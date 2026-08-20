import * as Sentry from '@sentry/nextjs';

// Exécuté côté serveur Node.js (routes API, Server Components).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
