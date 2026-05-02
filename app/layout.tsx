import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZLon | Premium Salon & Grooming Booking Platform',
    template: '%s | ZLon',
  },
  description:
    'Book your next haircut, spa, or grooming session instantly with ZLon. Discover top-rated salons, view real-time availability, and enjoy seamless wallet payments across India.',
  keywords: [
    'salon booking',
    'haircut booking',
    'ZLon',
    'grooming',
    'barbershop',
    'salon appointment India',
  ],
  openGraph: {
    type: 'website',
    siteName: 'ZLon',
    title: 'ZLon | Premium Salon & Grooming Booking Platform',
    description:
      'Book your next haircut, spa, or grooming session instantly with ZLon. Discover top-rated salons, view real-time availability, and enjoy seamless wallet payments across India.',
  },
  other: {
    'apple-mobile-web-app-title': 'ZLon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-[480px] min-h-screen bg-white relative overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
