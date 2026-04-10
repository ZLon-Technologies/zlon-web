import './globals.css';
import { headers } from 'next/headers';
import { PwaBootstrap } from '@/components/pwa-bootstrap';
import ErrorBoundary from '@/components/error-boundary'; // Ensure this file exists

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050505'
};

function normalizeHost(host = '') {
  return String(host).split(':')[0];
}

export async function generateMetadata() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get('x-forwarded-host') || headerStore.get('host') || '');
  const isBusinessHost = host === 'mybusiness.zlon.in';

  return {
    metadataBase: new URL(isBusinessHost ? 'https://mybusiness.zlon.in' : 'https://www.zlon.in'),
    title: {
      default: isBusinessHost ? 'ZLon Business' : 'ZLon',
      template: '%s | ZLon'
    },
    description: isBusinessHost
      ? 'ZLon owner dashboard for appointments, earnings, and salon operations.'
      : 'ZLon consumer app for instant salon discovery and booking.',
    manifest: isBusinessHost ? '/business.webmanifest' : '/consumer.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: isBusinessHost ? 'ZLon Business' : 'ZLon'
    },
    icons: {
      icon: ['/favicon.png'],
      apple: ['/favicon.png']
    },
    formatDetection: {
      telephone: false,
      email: false,
      address: false
    }
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Wrapping the entire app in the Error Boundary catches crashes in any component below */}
        <ErrorBoundary>
          <PwaBootstrap />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}