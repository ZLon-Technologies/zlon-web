'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Star,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ZLon Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/login" 
              className="text-sm font-bold text-gray-600 hover:text-black transition-colors"
            >
              Log In
            </Link>
            <Link 
              href="/signup" 
              className="bg-black text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-3 rounded-2xl shadow-lg shadow-black/10 hover:bg-neutral-800 transition-all active:scale-[0.98]"
            >
              Join ZLon
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star size={16} className="text-neutral-950 fill-neutral-950" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-950">India&apos;s Premium Grooming Network</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            India&apos;s Premium <br />
            <span className="text-gray-400">Salon & Grooming Platform.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium mb-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            Experience grooming like never before. Book real-time haircuts, spa sessions, and premium treatments at India&apos;s finest salons with a single tap.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-neutral-950 text-white px-10 py-5 rounded-[2rem] font-bold text-lg shadow-2xl shadow-black/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-[0.97]"
            >
              Book Your First Appointment <ChevronRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-neutral-950 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-black/10">
                <Clock size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-time Slots</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                No more waiting on calls. Browse real-time availability and book your preferred slot instantly.
              </p>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-neutral-950 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-black/10">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Salons</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                We partner only with the best. Every salon on ZLon is vetted for quality, hygiene, and exceptional service.
              </p>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-16 h-16 bg-neutral-950 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-black/10">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Seamless Booking</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                From discovery to payment, the entire process is designed to be frictionless. Pay securely with ZLon Wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Image
                  src="/logo.png"
                  alt="ZLon Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <p className="text-gray-500 font-medium max-w-sm mb-8">
                Elevating the grooming experience for the modern consumer. Discover, book, and experience India&apos;s finest salons.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/terms-and-conditions" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy-settings" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Contact</h4>
              <ul className="space-y-4">
                <li><a href="mailto:info@zlon.in" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">info@zlon.in</a></li>
                <li><a href="mailto:business@zlon.in" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">business@zlon.in</a></li>
                <li><a href="mailto:support@zlon.in" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">support@zlon.in</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2026 ZLon Technologies Private Limited</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Made with Precision in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
