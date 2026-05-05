import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZLon | Premium Salon & Grooming',
    template: '%s | ZLon',
  },
  description:
    'ZLon is India\'s premium salon and grooming platform. Book haircuts, spa sessions, and grooming services at top-rated salons with real-time availability.',
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
    title: 'ZLon | Premium Salon & Grooming',
    description:
      'ZLon is India\'s premium salon and grooming platform. Book haircuts, spa sessions, and grooming services at top-rated salons with real-time availability.',
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
      <body className="min-h-screen bg-gray-900">
        <div className="mx-auto max-w-[480px] w-full min-h-screen bg-white relative shadow-2xl flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
