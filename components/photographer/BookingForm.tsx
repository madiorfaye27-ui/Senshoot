'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const EVENT_CATEGORIES = [
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert', 'festival',
  'sport', 'professionnel', 'remise_diplomes', 'scolaire', 'institutionnel',
  'shooting', 'autre',
] as const;

export default function BookingForm({
  photographerId,
  photographerWhatsapp,
  bookButtonLabel,
}: {
  photographerId: string;
  photographerWhatsapp: string | null;
  bookButtonLabel: string;
}) {
  const t = useTranslations('BookingForm');
  const tc = useTranslations('EventCategories');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setStatus('idle');

    const form = e.currentTarget;
    const data = new FormData(form);
    const clientName = String(data.get('client_name') || '');
    const eventDate = String(data.get('event_date') || '');
    const eventCategory = String(data.get('event_category') || '');

    const res = await fetch('/api/photographers/booking-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photographer_id: photographerId,
        event_date: eventDate,
        event_category: eventCategory || undefined,
        client_name: clientName,
        client_email: data.get('client_email'),
        client_whatsapp: data.get('client_whatsapp') || undefined,
        message: data.get('message') || undefined,
      }),
    });

    setSending(false);

    if (!res.ok) {
      setStatus('error');
      return;
    }

    const result = await res.json();
    setStatus('success');
    form.reset();

    if (result.photographer_whatsapp) {
      const digits = String(result.photographer_whatsapp).replace(/[^0-9]/g, '');
      const messageText = `Bonjour, je suis ${clientName}. Je souhaiterais réserver vos services pour le ${eventDate}${eventCategory ? ` (${tc(eventCategory as (typeof EVENT_CATEGORIES)[number])})` : ''}.`;
      const url = `https://wa.me/${digits}?text=${encodeURIComponent(messageText)}`;
      // Certains navigateurs bloquent window.open() lorsqu'il n'est plus
      // appelé de façon strictement synchrone dans le gestionnaire de clic
      // (ce qui est le cas ici, après l'attente du fetch) — on tente quand
      // même l'ouverture automatique, mais on garde aussi un lien visible
      // en secours pour que le client ne se retrouve jamais bloqué.
      window.open(url, '_blank');
      setWhatsappLink(url);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        {bookButtonLabel}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-3 rounded-xl border border-gray-100 p-5 dark:border-white/10">
      <h3 className="text-sm font-semibold text-sn-slate dark:text-white">{t('title')}</h3>

      {status === 'success' && (
        <div className="rounded-lg bg-sn-teal/10 p-2 text-xs text-sn-teal">
          <p>{photographerWhatsapp ? t('success') : t('successNoWhatsapp')}</p>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium underline">
              {t('openWhatsapp')}
            </a>
          )}
        </div>
      )}
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{t('error')}</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('dateLabel')}</label>
        <input type="date" name="event_date" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('categoryLabel')}</label>
        <select name="event_category" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white">
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{tc(c)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('nameLabel')}</label>
        <input type="text" name="client_name" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('emailLabel')}</label>
        <input type="email" name="client_email" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('whatsappLabel')}</label>
        <input type="text" name="client_whatsapp" placeholder="+221 77 000 00 00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-sn-slate dark:text-gray-300">{t('messageLabel')}</label>
        <textarea name="message" rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white" />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={sending} className="btn-primary flex-1 text-sm disabled:opacity-50">
          {t('submit')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
