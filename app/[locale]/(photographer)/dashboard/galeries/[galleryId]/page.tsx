import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PhotoUploader from '@/components/photographer/PhotoUploader';
import PhotoPriceEditor from '@/components/photographer/PhotoPriceEditor';

export default async function GalleryManagePage({
  params,
}: {
  params: { galleryId: string };
}) {
  const t = await getTranslations('GalleryManagePage');
  const supabase = createClient();

  const { data: gallery } = await supabase
    .from('galleries')
    .select('*, photos(*), events(name, qr_code_url, qr_short_code)')
    .eq('id', params.galleryId)
    .single();

  if (!gallery) return notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{gallery.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t('photosImported', { count: gallery.photos?.length ?? 0 })}
      </p>

      <div className="mt-6">
        <PhotoUploader galleryId={gallery.id} />
      </div>

      {gallery.events?.qr_code_url && (
        <div className="mt-8 flex items-center gap-4 rounded-xl border border-gray-100 p-4">
          <img src={gallery.events.qr_code_url} alt={t('qrCodeAlt')} className="h-24 w-24" />
          <div>
            <p className="text-sm font-medium text-sn-slate">{t('qrCodeTitle')}</p>
            <p className="text-xs text-gray-500">
              /galerie/{gallery.events.qr_short_code}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {(gallery.photos ?? []).map((p: any) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-gray-100">
            <img
              src={p.thumbnail_url}
              className="aspect-square w-full object-cover"
              alt={p.photo_number}
            />
            <div className="flex items-center justify-between gap-1 p-1.5">
              <span className="text-[10px] text-gray-400">#{p.photo_number}</span>
              <PhotoPriceEditor photoId={p.id} initialPrice={p.price_fcfa} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
