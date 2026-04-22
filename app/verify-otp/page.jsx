'use client';

import React, { useState, useRef } from 'react';

export default function OTPScreen() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (index, value) => {
    // Only allow numbers
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto-focus the next input field if a number is typed
    if (cleanValue !== '' && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Auto-focus the previous input field if backspace is pressed on an empty box
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Enter OTP
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm font-medium">
            We've sent a 4-digit code to your phone number.
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-4 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 bg-gray-200 rounded-2xl text-center text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all placeholder-gray-400"
              maxLength={1}
            />
          ))}
        </div>

        {/* Resend Code Link */}
        <div className="text-center mb-8">
          <button className="text-sm font-bold text-gray-900 hover:underline">
            Resend Code
          </button>
        </div>

        {/* Continue Button */}
        <button
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-full hover:bg-gray-800 active:bg-gray-950 transition-all text-base"
        >
          Continue
        </button>

      </div>
    </div>
  );
}