import type { MetadataRoute } from 'next';

const SITE_URL = 'https://shootsenegal.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard',
        '/admin',
        '/client',
        '/acces/',
        '/commande-confirmee',
        '/kkiapay-checkout',
        '/reset-password',
        '/en/dashboard',
        '/en/admin',
        '/en/client',
        '/en/acces/',
        '/en/commande-confirmee',
        '/en/kkiapay-checkout',
        '/en/reset-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
