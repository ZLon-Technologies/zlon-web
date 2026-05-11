import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <Image
          src="/logo.png"
          alt="ZLon"
          width={120}
          height={120}
          priority
          className="object-contain animate-pulse"
        />
      </div>
    </div>
  );
}
