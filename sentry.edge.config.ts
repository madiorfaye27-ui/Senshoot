import * as Sentry from '@sentry/nextjs';

// Exécuté dans le runtime Edge (middleware.ts).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
