'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function PhotoPriceEditor({
  photoId,
  initialPrice,
}: {
  photoId: string;
  initialPrice: number;
}) {
  const t = useTranslations('PhotoPriceEditor');
  const [price, setPrice] = useState(initialPrice);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/photos/${photoId}/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_fcfa: price }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('error'));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={500}
        step={100}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-20 rounded border border-gray-200 px-1.5 py-1 text-xs dark:border-white/10 dark:bg-slate-700 dark:text-white"
      />
      <button
        onClick={save}
        disabled={saving || price === initialPrice}
        className="rounded bg-sn-teal px-2 py-1 text-[10px] font-medium text-white disabled:opacity-40"
      >
        {saved ? t('saved') : t('save')}
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
