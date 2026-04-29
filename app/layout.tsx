import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZLon',
    template: '%s | ZLon',
  },
  description: 'ZLon salon booking experience',
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
      <body className="min-h-screen bg-zinc-100">
        <div className="min-h-screen bg-white max-w-[480px] mx-auto shadow-2xl relative overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
