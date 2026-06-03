import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const adminClient = createAdminClient();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const internalEmail = `phone_${cleanPhone}@zlon.internal`;

    // 4. Check for account
    let { data: { user }, error: getError } = await adminClient.auth.admin.getUserByEmail(internalEmail);

    if (getError || !user) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        user_metadata: { 
          phone_number: phoneNumber,
          auth_provider: 'firebase_phone'
        }
      });

      if (createError) throw createError;
      user = newUser.user;
    }

    // 5. Generate internal magic login link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: internalEmail,
    });

    if (linkError) throw linkError;

    // Use the token_hash to get a session on the server
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token');

    if (!tokenHash) throw new Error('Token hash generation failed');

    // Verify the OTP on the server to get a session object
    const { data: verifyData, error: verifyError } = await adminClient.auth.verifyOtp({
      email: internalEmail,
      token: tokenHash,
      type: 'magiclink',
    });

    if (verifyError) throw verifyError;

    // 6. Ensure profile record exists in public.profiles for DB continuity
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      await adminClient.from('profiles').insert({
        id: user.id,
        phone_number: phoneNumber,
        is_profile_complete: false
      });
    }

    // Return the session tokens to the client as requested
    return NextResponse.json({
      status: 'success',
      session: verifyData.session, // Contains access_token, refresh_token, etc.
    }, { headers: CORS_HEADERS });

  } catch (error: any) {
    console.error('Hybrid Bridge Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || String(error)
    }, { status: 500, headers: CORS_HEADERS });
  }
}
