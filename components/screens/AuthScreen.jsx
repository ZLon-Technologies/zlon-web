'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Apple, Mail, Chrome } from 'lucide-react'

export default function AuthScreen({
  onContinue,
  onGoogle,
  onApple,
  onEmail
}) {
  const [phone, setPhone] = useState('')

  return (
    <div className="flex h-dvh flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-6">
        <Image
          src="/zlon-logo.png"
          alt="ZLon"
          width={220}
          height={80}
          priority
        />
      </div>

      <div className="rounded-t-[34px] bg-black px-6 pb-8 pt-7 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <h2 className="text-center text-[24px] font-semibold tracking-tight">
          Login or sign up
        </h2>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            className="flex h-14 w-24 items-center justify-center gap-2 rounded-full bg-white text-black"
          >
            <span className="text-lg">🇮🇳</span>
            <span className="text-[12px] text-neutral-500">▼</span>
          </button>

          <div className="flex h-14 flex-1 items-center rounded-full bg-white px-4">
            <span className="mr-3 text-[18px] font-semibold text-black">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter Number"
              inputMode="numeric"
              className="w-full bg-transparent text-[16px] text-black outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onContinue?.(phone)}
          className="mt-7 h-14 w-full rounded-full bg-white text-[20px] font-bold text-black"
        >
          Continue
        </button>

        <div className="mt-7 grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={onGoogle}
            className="flex h-14 items-center justify-center rounded-full bg-white text-black"
            aria-label="Continue with Google"
          >
            <Chrome size={28} />
          </button>

          <button
            type="button"
            onClick={onApple}
            className="flex h-14 items-center justify-center rounded-full bg-white text-black"
            aria-label="Continue with Apple"
          >
            <Apple size={28} />
          </button>

          <button
            type="button"
            onClick={onEmail}
            className="flex h-14 items-center justify-center rounded-full bg-white text-black"
            aria-label="Continue with Email"
          >
            <Mail size={28} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between text-[13px] text-white/80">
          <button type="button" className="hover:opacity-100">
            Need help?
          </button>
          <button type="button" className="hover:opacity-100">
            For Business log in
          </button>
        </div>

        <p className="mt-8 text-center text-[11px] text-white/60">
          By continuing, you agree to our
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/80">
          <button type="button" className="underline underline-offset-2">
            Terms of Service
          </button>
          <button type="button" className="underline underline-offset-2">
            Privacy Policy
          </button>
          <button type="button" className="underline underline-offset-2">
            Content Policies
          </button>
        </div>
      </div>
    </div>
  )
}