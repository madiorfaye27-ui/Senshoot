const createNextIntlPlugin = require('next-intl/plugin');
const { withSentryConfig } = require('@sentry/nextjs');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // En-têtes de sécurité HTTP appliqués à toutes les pages/routes.
  // Référence : https://owasp.org/www-project-secure-headers/
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Empêche le site d'être affiché dans une <iframe> sur un
            // autre domaine (protection contre le "clickjacking").
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Empêche le navigateur de deviner le type d'un fichier
            // différemment de son Content-Type déclaré.
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Limite les informations envoyées dans l'en-tête Referer
            // lors de la navigation vers un autre site.
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Désactive l'accès aux capteurs/caméra/micro/géoloc par
            // défaut pour les pages du site (rien n'en a besoin ici).
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Force HTTPS pendant 2 ans, y compris pour les sous-domaines,
            // une fois le site en production sur un vrai domaine HTTPS.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  // Silencieux quand SENTRY_AUTH_TOKEN n'est pas défini (ex: en local) —
  // l'upload des source maps est alors simplement ignoré plutôt que de
  // faire échouer le build.
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
    // Désactivé : Sentry réécrit middleware.ts pour y injecter du
    // monitoring, et ça fait échouer le déploiement Vercel avec "The
    // Edge Function 'middleware' is referencing unsupported modules"
    // (référence à nos propres imports @/i18n/routing et
    // @/lib/supabase/middleware, alors qu'ils n'ont rien de non
    // supporté — le souci vient bien de l'enrobage automatique, pas de
    // notre code). Le suivi d'erreurs middleware n'est pas critique ici.
    autoInstrumentMiddleware: false,
  },
});
