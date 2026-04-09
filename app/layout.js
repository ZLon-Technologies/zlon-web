import './globals.css';
import { PwaBootstrap } from '@/components/pwa-bootstrap';

export const metadata = {
  metadataBase: new URL('https://www.zlon.in'),
  title: {
    default: 'ZLon',
    template: '%s | ZLon'
  },
  description: 'ZLon consumer app for instant salon discovery and booking.',
  manifest: '/consumer.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZLon'
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050505'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
