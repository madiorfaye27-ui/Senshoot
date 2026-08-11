import type { Metadata } from 'next';
import './globals.css';
import { themeInitScript } from '@/lib/theme-script';

export const metadata: Metadata = {
  title: 'Senshoot Sénégal — Capturez. Partagez. Vendez.',
  description:
    "Senshoot Sénégal met en relation photographes et clients : créez un événement, générez un QR Code, partagez votre galerie et vendez vos photos en ligne.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Applique le thème (clair/sombre) avant le premier rendu,
            pour éviter un flash visible au chargement de la page. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-sn-white text-sn-slate antialiased font-sans transition-colors duration-200 dark:bg-slate-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
