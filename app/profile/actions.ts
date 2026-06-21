'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

interface ProfileMutationResult {
  ok: boolean;
  message: string;
}

export async function updateProfile(formData: {
  fullName: string;
  email: string;
  phone: string;
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
      .collection('users')
      .doc(userId)
      .set({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

    return { ok: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { ok: false, message: error.message || 'Failed to update profile.' };
  }
}
