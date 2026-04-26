'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

type GenderOption = 'male' | 'female' | 'other';

function UserIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 18.5c.92-2.35 3-3.5 5.5-3.5s4.58 1.15 5.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V7M16 3.5V7M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01M16 16h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaleIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.5 16.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12.5 8.5 18 3m-4 0h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FemaleIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13v7M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8.5 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 20.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M11 9.5 18.5 4m-3.5 0h3.5v3.5M12 13l2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 8.5h3l1.6-2h5.8l1.6 2h3A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InputRow({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-sm font-bold tracking-[0.18em] text-black">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-gray-100 py-4 pr-14 pl-5 text-black placeholder:text-gray-400 focus:outline-none"
        />
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">{icon}</span>
      </div>
    </div>
  );
}

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const nextPath = getSafeRedirectPath(searchParams.get('next'), '/home');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<GenderOption>('male');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const genderOptions: Array<{
    value: GenderOption;
    label: string;
    icon: ReactNode;
  }> = [
    { value: 'male', label: 'Male', icon: <MaleIcon /> },
    { value: 'female', label: 'Female', icon: <FemaleIcon /> },
    { value: 'other', label: 'Other', icon: <OtherIcon /> },
  ];

  const handleCompleteProfile = async () => {
    if (!fullName.trim() || !dateOfBirth.trim()) {
      setErrorMessage('Complete your name and date of birth to finish setting up your profile.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth.trim(),
        gender,
      },
    });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(nextPath);
  };

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-[-0.05em] text-black">Complete Your Profile</h1>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-8 text-gray-500">
            Set up your identity to experience the best of ZLon services.
          </p>
        </div>

        <div className="mt-8 rounded-[2.5rem] bg-white px-6 py-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:px-8 sm:py-10">
          <div className="space-y-6">
            <InputRow
              id="full-name"
              label="FULL NAME"
              placeholder="e.g. Julian Alexander"
              icon={<UserIcon />}
              value={fullName}
              onChange={(value) => {
                setFullName(value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />
            <InputRow
              id="date-of-birth"
              label="DATE OF BIRTH"
              placeholder="mm/dd/yyyy"
              icon={<CalendarIcon />}
              value={dateOfBirth}
              onChange={(value) => {
                setDateOfBirth(value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            />

            <div>
              <p className="mb-3 text-sm font-bold tracking-[0.18em] text-black">GENDER</p>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map((option) => {
                  const isActive = gender === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGender(option.value)}
                      aria-pressed={isActive}
                      className={`flex h-24 flex-col items-center justify-center rounded-2xl border bg-white text-center transition-colors ${
                        isActive
                          ? 'border-black text-black shadow-[0_8px_20px_rgb(0,0,0,0.05)]'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {option.icon}
                      <span className="mt-2 text-xs font-bold uppercase tracking-[0.12em]">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div
                className="relative mb-6 h-40 w-full overflow-hidden rounded-2xl bg-gray-800"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 18% 22%, rgba(246,196,117,0.95), transparent 26%), radial-gradient(circle at 82% 28%, rgba(76,132,162,0.55), transparent 24%), linear-gradient(135deg, #1b1b1b 0%, #463328 38%, #85503f 62%, #1f2730 100%)',
                }}
              >
                <div className="absolute inset-y-0 left-5 w-6 bg-white/20 blur-sm" />
                <div className="absolute bottom-0 left-1/2 h-24 w-24 -translate-x-1/2 rounded-t-[999px] bg-[linear-gradient(180deg,#e8b89a_0%,#9e664e_100%)]" />
                <div className="absolute bottom-10 left-1/2 h-16 w-14 -translate-x-1/2 rounded-[999px] bg-[linear-gradient(180deg,#f1c9ac_0%,#dda987_100%)]" />
                <div className="absolute bottom-16 left-1/2 h-14 w-16 -translate-x-[62%] rounded-[999px] bg-[#2d1f24]" />
                <div className="absolute bottom-16 left-1/2 h-14 w-16 -translate-x-[2%] rounded-[999px] bg-[#4f2c2a]" />
                <div className="absolute bottom-12 left-1/2 h-16 w-20 -translate-x-1/2 rounded-t-[999px] bg-[#2f2126]/90 blur-[1px]" />

                <button
                  type="button"
                  aria-label="Upload profile picture"
                  className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm"
                >
                  <CameraIcon />
                </button>

                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-semibold tracking-[0.12em] text-white backdrop-blur-sm">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] leading-none text-black">
                    ✓
                  </span>
                  <span>ID VERIFIED</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteProfile}
                disabled={isSaving}
                className="w-full rounded-2xl bg-black py-4 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving Profile...' : 'Complete Profile ->'}
              </button>

              {errorMessage ? <p className="mt-4 text-center text-sm text-red-500">{errorMessage}</p> : null}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-semibold tracking-[0.22em] text-gray-400">
          BY CONTINUING YOU AGREE TO THE{' '}
          <span className="text-gray-500 underline underline-offset-4">TERMS &amp; PRIVACY POLICY</span>
        </p>
      </div>
    </main>
  );
}
