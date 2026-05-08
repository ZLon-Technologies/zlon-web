import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Search size={40} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight text-black">404</h1>
      <h2 className="mt-4 text-xl font-bold text-gray-900">Page Not Found</h2>
      <p className="mt-2 text-base text-gray-500 max-w-xs">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>

      <div className="mt-10 w-full max-w-sm">
        <Link
          href="/home"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 font-semibold text-white transition-transform hover:scale-[0.99] active:scale-[0.97]"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
