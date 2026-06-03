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
    const { phone, firebaseUid } = await request.json();

    if (!phone || !firebaseUid) {
      return NextResponse.json({ error: 'Phone and Firebase UID are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const adminClient = createAdminClient();

    // 1. Sync Firebase Identity with Supabase Profile
    let { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('phone_number', phone)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch Profile Error:', fetchError);
      return NextResponse.json({ error: 'Failed to query database' }, { status: 500, headers: CORS_HEADERS });
    }

    if (!profile) {
      // Brand new user signing up via phone number
      const { data: newProfile, error: insertError } = await adminClient
        .from('profiles')
        .insert([{ 
          id: firebaseUid, 
          phone_number: phone, 
          is_profile_complete: false 
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Insert Profile Error:', insertError);
        // Fallback: maybe the ID already exists but with a different phone (unlikely)
        // or the 'is_profile_complete' column is missing.
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500, headers: CORS_HEADERS });
      }
      profile = newProfile;
    } else if (profile.id !== firebaseUid) {
      // Existing user found by phone, but ID needs updating to Firebase UID for continuity
      const { data: updatedProfile, error: updateError } = await adminClient
        .from('profiles')
        .update({ id: firebaseUid })
        .eq('phone_number', phone)
        .select()
        .single();
      
      if (updateError) {
        console.error('Update Profile UID Error:', updateError);
        return NextResponse.json({ error: 'Failed to synchronize identity' }, { status: 500, headers: CORS_HEADERS });
      }
      profile = updatedProfile;
    }

    // 2. Set a session cookie for the middleware
    const response = NextResponse.json({ 
      status: 'success', 
      profile 
    }, { headers: CORS_HEADERS });

    response.cookies.set('firebase-auth-token', firebaseUid, {
      path: '/',
      maxAge: 3600 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('Sync Phone Error Details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers: CORS_HEADERS });
  }
}
