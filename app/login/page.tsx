import React from 'react';

const ZLonAuthScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-black">ZLon.</h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10">
        {/* Welcome Header */}
        <h2 className="text-3xl font-bold text-black text-center mb-8">
          Welcome Back
        </h2>

        {/* Phone Number Input Row */}
        <div className="flex gap-3 mb-6">
          <div className="w-20 bg-gray-100 text-black rounded-2xl flex items-center justify-center py-4 font-medium">
            +91
          </div>
          <input
            type="tel"
            placeholder="Enter Number"
            className="flex-1 bg-gray-100 rounded-2xl pl-5 py-4 text-black placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Send OTP Button */}
        <button className="w-full bg-black text-white font-semibold py-4 rounded-2xl hover:bg-gray-900 transition-colors">
          Send OTP
        </button>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-xs font-medium text-gray-400 tracking-widest">
            OR SIGN IN WITH
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Social Login Icons */}
        <div className="flex justify-center gap-8 mb-8">
          {/* Google Icon */}
          <button className="focus:outline-none">
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>

          {/* Email Icon */}
          <button className="focus:outline-none">
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" fill="#7C2D12" />
              <path
                d="M2 7l10 6 10-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <span className="font-semibold text-gray-800 cursor-pointer hover:underline">
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default ZLonAuthScreen;