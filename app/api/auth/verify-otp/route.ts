import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Verify OTP from our internal table
    const { data: verification, error: verifyError } = await adminClient
      .from('otp_verifications')
      .select('code, expires_at')
      .eq('phone_number', phone)
      .maybeSingle();

    if (verifyError || !verification) {
      console.error('Verify Error (DB Lookup):', verifyError);
      return NextResponse.json({ 
        error: 'Verification record not found. Please request a new OTP.',
        details: verifyError?.message 
      }, { status: 401 });
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 401 });
    }

    // Check code match
    if (verification.code !== otp) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 401 });
    }

    // OTP is valid! Clean it up (optional but recommended)
    await adminClient
      .from('otp_verifications')
      .delete()
      .eq('phone_number', phone);

    // 2. Manual User Management & Auth Logic
    const supabase = await createClient(); // Use SSR client to handle cookies

    console.log('OTP verified successfully. Managing user for phone:', phone);

    // Check if a user with this phone number already exists in auth.users
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let targetUser = users.find(u => u.phone === phone || u.user_metadata?.phone_number === phone);

    let isNewUser = false;
    let redirectTo = '/home';

    if (!targetUser) {
      // New User: Create in auth.users
      isNewUser = true;
      redirectTo = '/complete-profile';

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        phone: phone,
        phone_confirm: true,
        user_metadata: { phone_number: phone },
      });

      if (createError) {
        console.error('Create User Error (Admin):', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      targetUser = newUser.user;
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Failed to retrieve or create user' }, { status: 500 });
    }

    // Ensure profile record exists
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', targetUser.id)
      .maybeSingle();

    if (profileError) {
       console.error('Profile Lookup Error:', profileError);
    }

    if (!profile) {
      isNewUser = true;
      redirectTo = '/complete-profile';
      const { error: insertError } = await adminClient.from('profiles').insert({
        id: targetUser.id,
        phone_number: phone,
      });
      if (insertError) console.error('Profile Insert Error:', insertError);
    } else if (!profile.full_name) {
      // Profile exists but incomplete
      isNewUser = true;
      redirectTo = '/complete-profile';
    }

    // 3. Session Generation (Manual Bypass)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
      password: tempPassword,
    });

    if (updateError) {
      console.error('Admin Password Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to prepare session' }, { status: 500 });
    }

    // Sign in using the SSR client to set cookies on the response
    const { error: signInError } = await supabase.auth.signInWithPassword({
      phone: phone,
      password: tempPassword,
    });

    if (signInError) {
      console.error('SSR Sign In Error:', signInError);
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      isNewUser,
      redirectTo,
    });
  } catch (error) {
    console.error('Verify OTP Error Details (Catch):', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
