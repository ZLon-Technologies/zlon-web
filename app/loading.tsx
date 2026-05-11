import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <Image
          src="/logo.png"
          alt="ZLon"
          width={100}
          height={100}
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
