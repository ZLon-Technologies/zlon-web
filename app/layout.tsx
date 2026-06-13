import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

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
  manifest: '/manifest.json',
};

import { BookingProvider } from './lib/booking-state';
import { LoadingProvider } from './components/loading-provider';
import { RootWrapper } from './components/root-wrapper';
import { AuthProvider } from '@/lib/auth-context';

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  const { locale = 'en' } = await params;

  return (
    <html lang={locale} className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-900">
        <AuthProvider>
          <LoadingProvider>
            <BookingProvider>
              <RootWrapper>{children}</RootWrapper>
            </BookingProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
