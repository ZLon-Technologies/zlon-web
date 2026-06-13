'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

interface ProfileMutationResult {
  ok: boolean;
  message: string;
}

export async function updateProfile(formData: {
  full_name: string;
  email: string;
  phone_number: string;
  dob: string;
  gender: string;
}): Promise<ProfileMutationResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;

    if (!token) {
      return { ok: false, message: 'User not authenticated.' };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) return { ok: false, message: 'User not authenticated.' };

    await adminDb
      .collection('profiles')
      .doc(userId)
      .set({
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        dob: formData.dob,
        gender: formData.gender,
        updated_at: new Date().toISOString(),
      }, { merge: true });

    return { ok: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { ok: false, message: error.message || 'Failed to update profile.' };
  }
}
