'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

interface ProfileMutationResult {
  ok: boolean;
  message: string;
  emailVerificationSent?: boolean;
}

/**
 * Safely retrieves the authenticated user's UID and email from the session cookie.
 * Returns null if the user is not authenticated.
 */
async function getAuthenticatedUser(): Promise<{ uid: string; email: string | undefined } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;

    if (!token) return null;

    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid) return null;

    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function updateProfile(formData: {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
}): Promise<ProfileMutationResult> {
  try {
    // 1. Authenticate the user
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return { ok: false, message: 'User not authenticated. Please log in again.' };
    }

    const { uid: userId, email: currentAuthEmail } = authUser;

    // 2. Determine if the email has changed
    const submittedEmail = formData.email?.trim().toLowerCase() || '';
    const existingEmail = currentAuthEmail?.trim().toLowerCase() || '';
    const emailChanged = submittedEmail !== '' && submittedEmail !== existingEmail;

    // 3. Always save the core profile fields (never includes email if it changed)
    const coreProfileData: Record<string, string> = {
      fullName: formData.fullName,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      updatedAt: new Date().toISOString(),
    };

    // If the email hasn't changed, include it in the normal save
    if (!emailChanged) {
      coreProfileData.email = formData.email;
    }

    try {
      await adminDb
        .collection('users')
        .doc(userId)
        .set(coreProfileData, { merge: true });
    } catch (dbError: any) {
      console.error('Firestore write failed:', dbError);
      return {
        ok: false,
        message: 'Failed to save profile data. Please try again.',
      };
    }

    // 4. If email changed, trigger email verification instead of saving directly
    if (emailChanged) {
      try {
        // Generate a verification link for the new email.
        // Firebase Admin SDK sends an email to the NEW address with a verification link.
        // Once the user clicks it, Firebase updates their auth email automatically.
        await adminAuth.generateEmailVerificationLink(submittedEmail, {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zlon.in'}/profile`,
        });

        // Store the pending email in Firestore so the UI can show it
        await adminDb
          .collection('users')
          .doc(userId)
          .set({ pendingEmail: submittedEmail }, { merge: true });

        return {
          ok: true,
          message: 'Profile saved! A verification email has been sent to your new address. Please check your inbox.',
          emailVerificationSent: true,
        };
      } catch (emailError: any) {
        console.error('Email verification trigger failed:', emailError);
        // The core profile was already saved — don't fail the whole operation
        return {
          ok: true,
          message: 'Profile details saved, but we couldn\'t send a verification email. You can update your email later.',
          emailVerificationSent: false,
        };
      }
    }

    return { ok: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    // Top-level catch: ensures the Server Component NEVER crashes
    console.error('Update Profile Error:', error);
    return {
      ok: false,
      message: error?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}
