'use client';

import { useState, useEffect } from 'react';
import { EditProfileScreen } from '../components/edit-profile-screen';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const userId = user.uid;
        
        const [profileSnap, walletSnap] = await Promise.all([
          getDoc(doc(db, 'profiles', userId)),
          getDoc(doc(db, 'wallets', userId))
        ]);

        const profileData = profileSnap.exists() ? profileSnap.data() : null;
        const walletData = walletSnap.exists() ? walletSnap.data() : null;

        const walletBalance = getNumericValue(walletData?.balance);

        if (profileData) {
          setProfile(mapProfileRow({ id: userId, ...profileData } as Record<string, unknown>, user.email ?? null, walletBalance));
        } else {
          setProfile({
            id: userId,
            full_name: null,
            email: user.email ?? null,
            phone_number: user.phoneNumber ?? null,
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

    if (!authLoading) {
      loadProfileData();
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full relative">
      <EditProfileScreen initialProfile={profile} />
    </div>
  );
}
