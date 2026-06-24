'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Pencil, User } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from '../actions';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    async function fetchProfile() {
      try {
        const docRef = doc(db, 'users', user!.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profile = docSnap.data();

          // Handle dob: the complete-profile page stores dateOfBirth as ISO string,
          // but the edit page stores dob as a date string. Support both.
          let dobValue = profile.dob || '';
          if (!dobValue && profile.dateOfBirth) {
            // Convert ISO dateOfBirth to YYYY-MM-DD for the date input
            try {
              const d = new Date(profile.dateOfBirth);
              if (!isNaN(d.getTime())) {
                dobValue = d.toISOString().split('T')[0];
              }
            } catch {
              dobValue = '';
            }
          }

          setFormData({
            fullName: profile.fullName || user?.displayName || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || '',
            dob: dobValue,
            gender: profile.gender || '',
          });
          setAvatarUrl(profile.avatarUrl || null);
        } else {
          setFormData(prev => ({
            ...prev,
            fullName: user?.displayName || '',
            email: user?.email || '',
          }));
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router, user, authLoading]);

  const handleBack = () => {
    router.back();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `avatars/${user.uid}/${Date.now()}.${safeExtension}`;
      const storageRef = ref(storage, filePath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore with the new avatar URL
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, { avatarUrl: downloadURL });

      setAvatarUrl(downloadURL);
      event.target.value = '';
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload image.');
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateProfile(formData);
      if (result.ok) {
        router.push('/profile');
        router.refresh();
      } else {
        setError(result.message);
        alert('Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isSaving || isUploading;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white text-neutral-950 font-sans antialiased">
      {/* Top Header */}
      <header className="flex items-center px-4 pt-[var(--safe-top)] pb-4 border-b border-neutral-100">
        <button
          onClick={handleBack}
          type="button"
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-2 text-xl font-bold tracking-tight">Edit Profile</h1>
      </header>

      {/* Form Fields */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex-1 flex flex-col min-h-0"
      >
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-2xl mx-auto w-full">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-2 border-neutral-200 overflow-hidden bg-neutral-100">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <User size={40} strokeWidth={1.5} />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="Change profile picture"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-lg ring-2 ring-white transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                <Pencil size={14} strokeWidth={2.5} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dob" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-semibold uppercase tracking-widest text-gray-700">
              Gender
            </label>
            <div className="relative">
              <select
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-base transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Action Buttons */}
        <footer className="p-6 border-t border-neutral-100 bg-white">
          <div className="max-w-2xl mx-auto flex gap-4">
            <button
              onClick={() => router.push('/profile')}
              disabled={isBusy}
              type="button"
              className="flex-1 px-6 py-4 rounded-full bg-neutral-100 text-neutral-900 font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              disabled={isBusy}
              type="submit"
              className="flex-1 px-6 py-4 rounded-full bg-black text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBusy && <Loader2 className="animate-spin" size={18} />}
              {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

