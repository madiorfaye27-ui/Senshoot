'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function EventDeleteButton({ eventId }: { eventId: string }) {
  const t = useTranslations('EventDeleteButton');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/photographers/events/${eventId}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('error'));
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={confirmDelete}
          disabled={deleting}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          {deleting ? t('deleting') : t('confirm')}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400"
        >
          {t('cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
      >
        {t('delete')}
      </button>
      {error && <span className="max-w-[160px] text-right text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
