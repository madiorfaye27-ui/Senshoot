'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ORIGINALS_BUCKET = 'photos-originals';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function PhotoUploader({ galleryId }: { galleryId: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
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
        setErrors((e) => [...e, `${file.name} : format non supporté (JPEG, PNG, WEBP, HEIC uniquement)`]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((e) => [...e, `${file.name} : fichier trop volumineux (25 Mo max)`]);
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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((e) => [...e, `${file.name} : ${data.error || 'erreur de traitement'}`]);
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
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
          Import et filigranage en cours… {progress.done}/{progress.total}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-left text-xs text-red-500">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Glissez-déposez ou sélectionnez plusieurs photos à la fois (25 Mo max
        par fichier). Un filigrane Senshoot Sénégal est appliqué
        automatiquement ; l'original reste privé jusqu'au paiement du client.
      </p>
    </div>
  );
}
