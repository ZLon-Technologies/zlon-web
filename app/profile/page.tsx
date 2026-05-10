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
  wallet_balance: number;
  monthly_bookings: number;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getNumericValue(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

function mapProfileRow(row: Record<string, unknown>, fallbackEmail: string | null, walletBalance: number): ProfileRecord {
  return {
    id: getStringValue(row.id) ?? '',
    full_name: getStringValue(row.full_name),
    email: getStringValue(row.email) ?? fallbackEmail,
    phone_number: getStringValue(row.phone_number),
    gender: getStringValue(row.gender),
    avatar_url: getStringValue(row.avatar_url),
    wallet_balance: walletBalance,
    monthly_bookings: getNumericValue(row.monthly_bookings),
  };
}

async function getCurrentProfile(): Promise<ProfileRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return null;
  }

  const [{ data: profileData }, { data: walletData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,email,phone_number,gender,avatar_url,monthly_bookings')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()
  ]);

  const walletBalance = getNumericValue(walletData?.balance);

  if (profileData) {
    return mapProfileRow(profileData as Record<string, unknown>, user.email ?? null, walletBalance);
  }

  return {
    id: user.id,
    full_name: getStringValue(user.user_metadata?.full_name) ?? null,
    email: user.email ?? null,
    phone_number: getStringValue(user.phone) ?? null,
    gender: null,
    avatar_url: null,
    wallet_balance: walletBalance,
    monthly_bookings: 0,
  };
}

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="w-full relative">
      <EditProfileScreen initialProfile={profile} />
    </div>
  );
}
