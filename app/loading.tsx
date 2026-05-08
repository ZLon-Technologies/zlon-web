import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative mb-6">
        <Image
          src="/logo.png"
          alt="ZLon Logo"
          width={80}
          height={80}
          priority
          className="animate-pulse"
        />
        <div className="absolute -inset-4 animate-spin rounded-full border-2 border-transparent border-t-black opacity-20" />
      </div>
    </div>
  );
}
