'use client';

import { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { EditProfileScreen } from '../components/edit-profile-screen';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user) {
          setIsLoading(false);
          return;
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
          setProfile(mapProfileRow(profileData as Record<string, unknown>, user.email ?? null, walletBalance));
        } else {
          setProfile({
            id: user.id,
            full_name: getStringValue(user.user_metadata?.full_name) ?? null,
            email: user.email ?? null,
            phone_number: getStringValue(user.phone) ?? null,
            gender: null,
            avatar_url: null,
            wallet_balance: walletBalance,
            monthly_bookings: 0,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full relative">
      <EditProfileScreen initialProfile={profile} />
    </div>
  );
}
