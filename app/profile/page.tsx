'use client';

import { useState, useEffect } from 'react';
import { EditProfileScreen } from '../components/edit-profile-screen';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileRecord {
  uid: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  avatarUrl: string | null;
  walletBalance: number;
  monthlyBookings: number;
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
    uid: getStringValue(row.uid) ?? '',
    fullName: getStringValue(row.fullName),
    email: getStringValue(row.email) ?? fallbackEmail,
    phone: getStringValue(row.phone),
    gender: getStringValue(row.gender),
    avatarUrl: getStringValue(row.avatarUrl),
    walletBalance: walletBalance,
    monthlyBookings: getNumericValue(row.monthlyBookings),
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
          getDoc(doc(db, 'users', userId)),
          getDoc(doc(db, 'wallets', userId))
        ]);

        const profileData = profileSnap.exists() ? profileSnap.data() : null;
        const walletData = walletSnap.exists() ? walletSnap.data() : null;

        const walletBalance = getNumericValue(walletData?.balance);

        if (profileData) {
          setProfile(mapProfileRow({ uid: userId, ...profileData } as Record<string, unknown>, user.email ?? null, walletBalance));
        } else {
          setProfile({
            uid: userId,
            fullName: null,
            email: user.email ?? null,
            phone: user.phoneNumber ?? null,
            gender: null,
            avatarUrl: null,
            walletBalance: walletBalance,
            monthlyBookings: 0,
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
