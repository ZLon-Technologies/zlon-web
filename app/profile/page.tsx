import type { Metadata } from 'next';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { EditProfileScreen } from '../components/edit-profile-screen';

export const metadata: Metadata = {
  title: 'Edit Profile',
};

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender: string | null;
  avatar_url: string | null;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function mapProfileRow(row: Record<string, unknown>, fallbackEmail: string | null): ProfileRecord {
  return {
    id: getStringValue(row.id) ?? '',
    full_name: getStringValue(row.full_name),
    email: getStringValue(row.email) ?? fallbackEmail,
    phone_number: getStringValue(row.phone_number),
    gender: getStringValue(row.gender),
    avatar_url: getStringValue(row.avatar_url),
  };
}

async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone_number,gender,avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!error && data && typeof data === 'object') {
    return mapProfileRow(data as Record<string, unknown>, user.email ?? null);
  }

  const fallbackResult = await supabase
    .from('profiles')
    .select('id,full_name,phone_number')
    .eq('id', user.id)
    .maybeSingle();

  if (fallbackResult.data && typeof fallbackResult.data === 'object') {
    return mapProfileRow(fallbackResult.data as Record<string, unknown>, user.email ?? null);
  }

  return {
    id: user.id,
    full_name: getStringValue(user.user_metadata?.full_name) ?? null,
    email: user.email ?? null,
    phone_number: getStringValue(user.phone) ?? null,
    gender: null,
    avatar_url: null,
  } satisfies ProfileRecord;
}

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="w-full min-h-screen bg-white relative">
      <EditProfileScreen initialProfile={profile} />
    </div>
  );
}
