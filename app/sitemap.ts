import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = 'https://shootsenegal.com';

// Pages publiques statiques (le français est la langue par défaut, sans préfixe).
const STATIC_PATHS = [
  '',
  '/tarifs',
  '/galeries',
  '/photographes',
  '/comment-ca-marche',
  '/a-propos',
  '/contact',
  '/conditions-generales',
  '/conditions-generales-vente',
  '/politique-de-confidentialite',
];

function entry(path: string, lastModified?: string | null): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    alternates: {
      languages: {
        fr: `${SITE_URL}${path}`,
        en: `${SITE_URL}/en${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  // Mêmes filtres que les pages publiques : seuls les contenus visibles sont listés.
  const [{ data: events }, { data: photographers }] = await Promise.all([
    supabase
      .from('events')
      .select('qr_short_code, created_at')
      .eq('visibility', 'public')
      .eq('status', 'publie')
      .is('deleted_at', null),
    supabase
      .from('photographers')
      .select('slug')
      .eq('status', 'validated')
      .not('studio_name', 'is', null)
      .neq('studio_name', '')
      .not('slug', 'is', null),
  ]);

  return [
    ...STATIC_PATHS.map((p) => entry(p)),
    ...(events ?? [])
      .filter((e) => e.qr_short_code)
      .map((e) => entry(`/galerie/${e.qr_short_code}`, e.created_at)),
    ...(photographers ?? []).map((p) => entry(`/photographe/${p.slug}`)),
  ];
}
