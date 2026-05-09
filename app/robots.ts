import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile', '/wallet', '/booking', '/bookings', '/dashboard'],
    },
    sitemap: 'https://zlon.app/sitemap.xml',
  };
}