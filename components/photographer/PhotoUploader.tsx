'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const ORIGINALS_BUCKET = 'photos-originals';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function PhotoUploader({ galleryId }: { galleryId: string }) {
  const t = useTranslations('PhotoUploader');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [defaultPrice, setDefaultPrice] = useState(2000);
  const supabase = createClient();

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setErrors([]);
    setProgress({ done: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validation côté client (l'API refait de toute façon ses propres
      // vérifications côté serveur — ceci n'est qu'un premier filtre
      // pour un retour immédiat à l'utilisateur).
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrors((e) => [...e, t('unsupportedFormat', { name: file.name })]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((e) => [...e, t('tooLarge', { name: file.name })]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      // Nom de fichier nettoyé : évite tout caractère spécial qui
      // pourrait perturber le chemin de stockage.
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-100);
      const path = `${galleryId}/${Date.now()}-${i}-${safeName}`;

      // 1. Upload de l'ORIGINAL dans le bucket PRIVÉ (jamais exposé publiquement)
      const { error: uploadError } = await supabase.storage
        .from(ORIGINALS_BUCKET)
        .upload(path, file);

      if (uploadError) {
        setErrors((e) => [...e, `${file.name} : ${uploadError.message}`]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      // 2. Le serveur télécharge l'original, génère les versions
      // filigranées et enregistre les métadonnées — l'original ne
      // transite jamais vers un espace public.
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: galleryId,
          photo_number: String(i + 1).padStart(4, '0'),
          original_path: path,
          price_fcfa: defaultPrice,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((e) => [...e, `${file.name} : ${data.error || t('processingError')}`]);
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
      <div className="mx-auto mb-4 flex max-w-xs items-center justify-center gap-2">
        <label className="text-xs font-medium text-sn-slate dark:text-gray-300">{t('defaultPrice')}</label>
        <input
          type="number"
          min={500}
          step={100}
          value={defaultPrice}
          onChange={(e) => setDefaultPrice(Number(e.target.value))}
          disabled={uploading}
          className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-white/10 dark:bg-slate-700 dark:text-white"
        />
      </div>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="mx-auto block text-sm"
      />
      {uploading && (
        <p className="mt-3 text-sm text-sn-teal">
          {t('uploading', { done: progress.done, total: progress.total })}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-left text-xs text-red-500">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-gray-400">{t('hint')}</p>
    </div>
  );
}
