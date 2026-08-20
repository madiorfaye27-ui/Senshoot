import * as Sentry from '@sentry/nextjs';

// Exécuté côté navigateur. Sans DSN (en local, tant qu'il n'est pas
// configuré), le SDK reste un no-op silencieux — rien à protéger ici.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
