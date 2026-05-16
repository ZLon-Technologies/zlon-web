'use server';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

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
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: 'User not authenticated.' };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        dob: formData.dob,
        gender: formData.gender,
      })
      .eq('id', user.id);

    if (error) throw error;

    return { ok: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { ok: false, message: error.message || 'Failed to update profile.' };
  }
}
