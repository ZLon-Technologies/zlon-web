import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const internalEmail = `phone_${cleanPhone}@zlon.internal`;

    // 4. Check for account in public.profiles table directly
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let userId = profile?.id;

    if (!profile) {
      // 5. Create user if missing in profiles (assuming missing in auth.users too)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        user_metadata: { 
          phone_number: phoneNumber,
          auth_provider: 'firebase_phone'
        }
      });

      if (createError) {
        // If user already exists in auth.users but not in profiles, we handle that
        if (createError.message.includes('already registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === internalEmail);
          userId = existingUser?.id;
        } else {
          throw createError;
        }
      } else {
        userId = newUser.user.id;
      }

      // Ensure profile record exists for the new/found user
      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          phone_number: phoneNumber,
          is_profile_complete: false
        }, { onConflict: 'phone_number' });
      }
    }

    if (!userId) {
      throw new Error('User identification failed');
    }

    // 6. Generate internal magic login link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: internalEmail,
    });

    if (linkError) throw linkError;

    // Use the token_hash to get a session on the server
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token');

    if (!tokenHash) throw new Error('Token hash generation failed');

    // Verify the OTP on the server to get a session object
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      email: internalEmail,
      token: tokenHash,
      type: 'magiclink',
    });

    if (verifyError) throw verifyError;

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
