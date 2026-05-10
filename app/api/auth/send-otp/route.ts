import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Fast2SMS API key not configured' }, { status: 500 });
    }

    // 1. Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Store the OTP in Supabase (otp_verifications table)
    const adminClient = createAdminClient();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const { error: dbError } = await adminClient
      .from('otp_verifications')
      .upsert({
        phone_number: phone,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'phone_number' });

    if (dbError) {
      console.error('OTP Error Details (Supabase):', dbError);
      return NextResponse.json({ 
        error: 'Failed to initialize verification',
        details: dbError.message 
      }, { status: 500 });
    }

    // 3. Send OTP via Fast2SMS
    // Extract 10 digits if it starts with +91
    const cleanNumber = phone.startsWith('+91') ? phone.slice(3) : phone.replace(/\D/g, '');

    console.log('Attempting to send OTP via Fast2SMS to:', cleanNumber);

    const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otpCode,
        numbers: cleanNumber,
      }),
    });

    const data = await fast2smsResponse.json();
    console.log('Fast2SMS Response Details:', data);

    if (!data.return) {
      return NextResponse.json({ 
        error: data.message || 'Failed to send SMS',
        details: data
      }, { status: 500 });
    }

    // For Fast2SMS, we don't have a sessionId, we use the phone as the identifier
    return NextResponse.json({ status: 'success', sessionId: phone });
  } catch (error) {
    console.error('OTP Error Details (Catch):', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
