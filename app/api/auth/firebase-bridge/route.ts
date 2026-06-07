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
    const body = await request.json();
    const phoneNumber = body.phoneNumber;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers: CORS_HEADERS });
    }

    // Explicitly declare the internal email reference for the bridge
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const internalEmail = `phone_${cleanPhone}@zlon.internal`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let isNewUser = false;

    // 4. Check for account in public.profiles table directly
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let userId = profile?.id;

    if (!profile) {
      isNewUser = true;
      // 5. Create user if missing in profiles
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        phone: phoneNumber,
        phone_confirm: true,
        user_metadata: { 
          phone_number: phoneNumber,
          auth_provider: 'firebase_phone'
        }
      });

      if (createError) {
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

    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token');

    if (!tokenHash) throw new Error('Token hash generation failed');

    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      email: internalEmail,
      token: tokenHash,
      type: 'magiclink',
    });

    if (verifyError) throw verifyError;

    return NextResponse.json({
      status: 'success',
      session: verifyData.session,
      isNewUser
    }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error('Hybrid Bridge Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500, headers: CORS_HEADERS });
  }
}
