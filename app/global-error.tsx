'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Doit vivre à la racine de app/ (pas dans app/[locale]/) même si le
// site n'a pas de root layout.tsx propre : c'est le seul endroit où
// Next.js va chercher ce fichier pour intercepter une erreur survenue
// dans le layout racine lui-même. Remplace ce layout quand actif, donc
// doit définir ses propres <html>/<body>.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
