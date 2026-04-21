'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

function BackArrowIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    console.log('Verifying OTP:', otpString);
    router.push('/home');
  };

  const handleResend = () => {
    console.log('Resending OTP...');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F3F3]">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl flex flex-col p-8 min-h-[700px] relative">

        <button
          onClick={() => router.back()}
          className="absolute top-8 left-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <BackArrowIcon className="h-6 w-6 text-black" />
        </button>

        <div className="flex-1 mt-16">
          <h1 className="text-3xl font-bold text-black mb-2">Enter OTP</h1>
          <p className="text-gray-500 mb-8">We've sent a 4-digit code to your phone.</p>

          <div className="flex gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-full aspect-square rounded-xl border border-gray-200 text-2xl font-semibold text-center focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            ))}
          </div>

          <button
            onClick={handleResend}
            className="text-sm text-gray-400 hover:text-black transition-colors"
          >
            Resend Code
          </button>
        </div>

        <button
          onClick={handleVerify}
          className="w-full bg-black text-white rounded-xl py-4 text-lg font-medium hover:bg-gray-800 transition-colors mt-auto mb-4"
        >
          Verify & Continue
        </button>
      </div>
    </div>
  );
}
