import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { themeInitScript } from '@/lib/theme-script';

const TITLE = 'Senshoot Sénégal — Capturez. Partagez. Vendez.';
const DESCRIPTION =
  "Senshoot Sénégal met en relation photographes et clients : créez un événement, générez un QR Code, partagez votre galerie et vendez vos photos en ligne.";

export const metadata: Metadata = {
  metadataBase: new URL('https://shootsenegal.com'),
  title: TITLE,
  description: DESCRIPTION,
  // "./" = URL de la page courante sans paramètres de requête : chaque page
  // déclare ainsi sa propre adresse canonique (préfixe de langue compris).
  alternates: { canonical: './' },
  // Aperçu lors d'un partage (WhatsApp, Facebook, X…). Une image dédiée
  // 1200×630 donnerait un meilleur rendu que le logo actuel.
  openGraph: {
    type: 'website',
    siteName: 'Senshoot Sénégal',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/logo.png', width: 526, height: 364, alt: 'Senshoot Sénégal' }],
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/logo.png'],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Applique le thème (clair/sombre) avant le premier rendu,
            pour éviter un flash visible au chargement de la page. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-sn-white text-sn-slate antialiased font-sans transition-colors duration-200 dark:bg-slate-900 dark:text-gray-100">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
