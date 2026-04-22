'use client';

import React, { useState } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'email'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        
        {/* ZLon Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            ZLon.
          </h1>
        </div>

        {/* Welcome Back Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Welcome Back
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-full">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2 px-4 rounded-full font-medium text-sm transition-all ${
              activeTab === 'phone'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phone
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-4 rounded-full font-medium text-sm transition-all ${
              activeTab === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email
          </button>
        </div>

        {/* Phone Login Form */}
        {activeTab === 'phone' && (
          <div className="space-y-4 mb-6">
            {/* Phone Input with +91 prefix */}
            <div className="flex items-center bg-gray-200 rounded-2xl overflow-hidden h-14">
              {/* Country Code */}
              <div className="px-4 text-gray-700 font-semibold text-sm whitespace-nowrap flex-shrink-0">
                +91
              </div>
              
              {/* Vertical Separator */}
              <div className="w-px h-8 bg-gray-400"></div>
              
              {/* Input Field */}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter Number"
                className="flex-1 px-4 bg-gray-200 text-gray-900 placeholder-gray-500 text-sm focus:outline-none font-medium"
              />
            </div>
          </div>
        )}

        {/* Email Login Form */}
        {activeTab === 'email' && (
          <div className="space-y-4 mb-6">
            {/* Email Input */}
            <div className="flex items-center bg-gray-200 rounded-2xl px-4 h-14">
              <Mail className="w-5 h-5 text-gray-600 flex-shrink-0 mr-3" />
              <input
                type="email"
                placeholder="Enter Email"
                className="flex-1 bg-gray-200 text-gray-900 placeholder-gray-500 text-sm focus:outline-none font-medium"
              />
            </div>

            {/* Password Input */}
            <div className="flex items-center bg-gray-200 rounded-2xl px-4 h-14">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                className="flex-1 bg-gray-200 text-gray-900 placeholder-gray-500 text-sm focus:outline-none font-medium"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="flex-shrink-0 ml-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Send OTP / Continue Button */}
        <button
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-full hover:bg-gray-800 active:bg-gray-950 transition-all text-base mb-6"
        >
          {activeTab === 'phone' ? 'Send OTP' : 'Continue'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium tracking-widest">
            OR SIGN IN WITH
          </span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-4 mb-6">
          {/* Google Button */}
          <button
            className="flex-1 h-12 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="currentColor">
                G
              </text>
            </svg>
            {/* Or use actual Google SVG */}
            <span className="text-lg">🔍</span>
          </button>

          {/* Email Button */}
          <button
            className="flex-1 h-12 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <Mail className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-700">
          <span>Don&apos;t have an account? </span>
          <button className="font-bold text-gray-900 hover:underline">
            Sign Up
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="text-center mt-4">
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Forgot Password
          </button>
        </div>
      </div>
    </div>
  );
}
