'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  LockKeyhole,
  RefreshCcw,
} from 'lucide-react';

type VisibilityState = {
  current: boolean;
  next: boolean;
  confirm: boolean;
};

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  isVisible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({
  id,
  label,
  value,
  isVisible,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500"
      >
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f4f3f0] px-4 py-4 ring-1 ring-black/5">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-base text-neutral-950 outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="text-neutral-500 transition-colors hover:text-neutral-900"
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibility, setVisibility] = useState<VisibilityState>({
    current: false,
    next: false,
    confirm: false,
  });

  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      fulfilled: newPassword.length >= 8,
    },
    {
      label: 'Contains a special character',
      fulfilled: /[^A-Za-z0-9]/.test(newPassword),
    },
    {
      label: 'Includes uppercase and lowercase letters',
      fulfilled: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword),
    },
    {
      label: 'Contains at least one number',
      fulfilled: /\d/.test(newPassword),
    },
  ];

  function toggleVisibility(field: keyof VisibilityState) {
    setVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  }

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-white p-4">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col text-neutral-950">
        <header className="flex items-center gap-3 py-2">
          <Link
            href="/privacy-settings"
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Change Password</h1>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="px-2 pt-6 text-center">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm">
                <LockKeyhole size={30} strokeWidth={2.1} />
              </div>
              <div className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg">
                <RefreshCcw size={18} strokeWidth={2.2} />
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950">
              Security Update
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Ensure your account stays secure with a strong password.
            </p>
          </section>

          <section className="mt-6 rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="space-y-4">
              <PasswordField
                id="current-password"
                label="Current Password"
                value={currentPassword}
                isVisible={visibility.current}
                onChange={setCurrentPassword}
                onToggle={() => toggleVisibility('current')}
              />
              <PasswordField
                id="new-password"
                label="New Password"
                value={newPassword}
                isVisible={visibility.next}
                onChange={setNewPassword}
                onToggle={() => toggleVisibility('next')}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                isVisible={visibility.confirm}
                onChange={setConfirmPassword}
                onToggle={() => toggleVisibility('confirm')}
              />
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-full bg-black px-5 py-4 text-base font-semibold text-white transition-opacity hover:opacity-95"
            >
              Update Password
            </button>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Password Requirements
              </h3>
              <div className="mt-4 space-y-3">
                {passwordRequirements.map((requirement) => {
                  const Icon = requirement.fulfilled ? CheckCircle2 : Circle;

                  return (
                    <div
                      key={requirement.label}
                      className="flex items-center gap-3 text-sm text-neutral-600"
                    >
                      <Icon
                        size={18}
                        className={
                          requirement.fulfilled ? 'text-neutral-900' : 'text-neutral-300'
                        }
                      />
                      <span>{requirement.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="mt-auto pb-2 pt-8 text-center">
            <Link
              href="/login-email"
              className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Forgot current password?
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
