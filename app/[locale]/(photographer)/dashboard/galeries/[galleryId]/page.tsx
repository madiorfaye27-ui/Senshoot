import { getTranslations } from 'next-intl/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PhotoUploader from '@/components/photographer/PhotoUploader';
import PhotoPriceEditor from '@/components/photographer/PhotoPriceEditor';
import PhotoDeleteButton from '@/components/photographer/PhotoDeleteButton';
import { getStorageLimitBytes, getStorageUsedBytes } from '@/lib/utils/storage';

function formatGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export default async function GalleryManagePage({
  params,
}: {
  params: { galleryId: string };
}) {
  const t = await getTranslations('GalleryManagePage');
  const supabase = createClient();

  const { data: gallery } = await supabase
    .from('galleries')
    .select('*, photos(*), events(name, qr_code_url, qr_short_code, photographer_id)')
    .eq('id', params.galleryId)
    .single();

  if (!gallery) return notFound();

  const admin = createAdminClient();
  const photographerId = (gallery as any).events.photographer_id;
  const [limitBytes, usedBytes] = await Promise.all([
    getStorageLimitBytes(admin, photographerId),
    getStorageUsedBytes(admin, photographerId),
  ]);
  const storagePct = limitBytes ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{gallery.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t('photosImported', { count: gallery.photos?.length ?? 0 })}
      </p>

      <div className="mt-3 max-w-xs">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t('storageUsed')}</span>
          <span>
            {limitBytes
              ? t('storageAmount', { used: formatGB(usedBytes), limit: formatGB(limitBytes) })
              : t('storageUnlimited', { used: formatGB(usedBytes) })}
          </span>
        </div>
        {limitBytes && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div
              className={`h-full rounded-full ${storagePct >= 100 ? 'bg-red-500' : 'bg-sn-teal'}`}
              style={{ width: `${storagePct}%` }}
            />
          </div>
        )}
      </div>

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
            <div className="border-t border-gray-100 p-1.5 dark:border-white/10">
              <PhotoDeleteButton photoId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
