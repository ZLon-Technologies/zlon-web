'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!user) {
        throw new Error('User not found. Please log in again.');
      }

      // 1. Update users collection with Name and DOB
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        fullName: fullName,
        dateOfBirth: dob,
        isProfileComplete: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. If email is provided and different from current, update auth user
      if (email && email !== user.email) {
        try {
          await updateEmail(user, email);
          setMessage({ 
            type: 'success', 
            text: 'Profile saved! Please check your email to verify your address.' 
          });
        } catch (authError: any) {
          console.error('Auth update error:', authError);
          // If it fails (e.g. requires recent login), we still saved the profile
          setMessage({ 
            type: 'success', 
            text: 'Profile details saved, but email update requires re-authentication. You can update it later in settings.' 
          });
        }
        
        // Brief delay to show success message before redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        // 3. Redirect to home/dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Onboarding Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Image
            src="/logo.png"
            alt="ZLon Logo"
            width={80}
            height={80}
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-black">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2">Tell us a bit more about yourself to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-black focus:bg-white transition-all outline-none text-black"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              id="dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-black focus:bg-white transition-all outline-none text-black"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-black focus:bg-white transition-all outline-none text-black"
              placeholder="john@example.com"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-900 transition-all disabled:opacity-70 shadow-lg"
          >
            {isLoading ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
