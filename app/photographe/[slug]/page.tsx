import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PhotographerProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('*, events(*)')
    .eq('slug', params.slug)
    .single();

  if (!photographer) return notFound();

  const publicEvents = (photographer.events ?? []).filter(
    (e: any) => e.status === 'publie' && e.visibility === 'public'
  );

  return (
    <div className="container-sn py-16">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-sn-teal/10" />
        <div>
          <h1 className="text-2xl font-bold text-sn-slate">
            {photographer.studio_name || 'Photographe'}
          </h1>
          {photographer.city && <p className="text-sm text-sn-teal">{photographer.city}</p>}
          <p className="text-sm text-gray-500">{photographer.description}</p>
        </div>
      </div>

      {(photographer.contact_phone || photographer.contact_whatsapp || photographer.contact_email) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {photographer.contact_whatsapp && (
            <a
              href={`https://wa.me/${photographer.contact_whatsapp.replace(/[^0-9]/g, '')}`}
              className="btn-primary text-sm"
            >
              WhatsApp : {photographer.contact_whatsapp}
            </a>
          )}
          {photographer.contact_phone && (
            <a href={`tel:${photographer.contact_phone}`} className="btn-secondary text-sm">
              Appeler : {photographer.contact_phone}
            </a>
          )}
          {photographer.contact_email && (
            <a href={`mailto:${photographer.contact_email}`} className="btn-secondary text-sm">
              {photographer.contact_email}
            </a>
          )}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-sn-slate">Événements publics</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {publicEvents.map((e: any) => (
          <Link
            key={e.id}
            href={`/galerie/${e.qr_short_code}`}
            className="rounded-xl border border-gray-100 p-4 shadow-sm hover:border-sn-orange"
          >
            <p className="font-medium text-sn-slate">{e.name}</p>
            <p className="text-xs text-gray-500">{e.city}</p>
          </Link>
        ))}
        {!publicEvents.length && (
          <p className="col-span-full text-gray-400">Aucun événement public pour le moment.</p>
        )}
      </div>
    </div>
  );
}
