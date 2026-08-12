'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { formatFCFA } from '@/lib/utils/format';
import { computeOrderPricing } from '@/lib/utils/pricing';

type Photo = {
  id: string;
  photo_number: string;
  watermark_url: string;
  thumbnail_url: string;
  price_fcfa: number;
};

declare global {
  interface Window {
    openKkiapayWidget?: (config: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (response: { transactionId: string }) => void) => void;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GalleryCart({
  photos,
  eventId,
  isLoggedIn,
}: {
  photos: Photo[];
  eventId: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations('GalleryCartComponent');
  const [selected, setSelected] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [query, setQuery] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const pendingOrderId = useRef<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedPhotos = photos.filter((p) => selected.includes(p.id));
  const fullPriceTotal = selectedPhotos.reduce((sum, p) => sum + p.price_fcfa, 0);
  const { total_fcfa: total, discountApplied } = computeOrderPricing(selectedPhotos);

  // Achat sans compte : l'email de l'invité est le seul moyen de lui
  // envoyer le lien vers ses photos, il n'a pas de tableau de bord.
  const emailValid = isLoggedIn || EMAIL_RE.test(guestEmail.trim());

  // Recherche par numéro : utile dès que la galerie dépasse quelques
  // centaines de photos (ex : un invité qui connaît son numéro de dossard).
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePhotos = normalizedQuery
    ? photos.filter((p) => p.photo_number?.toLowerCase().includes(normalizedQuery))
    : photos;

  // Widget KKiaPay (Wave / Orange Money) : script chargé une fois, écoute
  // globale du succès de paiement mise en place au montage.
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => {
      window.addSuccessListener?.(async (response) => {
        const orderId = pendingOrderId.current;
        if (!orderId) return;
        const res = await fetch(`/api/orders/${orderId}/confirm-kkiapay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: response.transactionId }),
        });
        const data = await res.json().catch(() => ({}));
        // Un invité n'a pas de tableau de bord : direct vers ses photos.
        // Un client connecté retrouve tout dans son historique de commandes.
        window.location.href = isLoggedIn
          ? '/client/dashboard/commandes?success=1'
          : data.access_url || '/';
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isLoggedIn]);

  async function checkoutStripe() {
    setPaying(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        photo_ids: selected,
        payment_method: 'stripe',
        guest_email: isLoggedIn ? undefined : guestEmail.trim(),
      }),
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      setPaying(false);
    }
  }

  async function checkoutKkiapay() {
    setPaying(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        photo_ids: selected,
        payment_method: 'kkiapay',
        guest_email: isLoggedIn ? undefined : guestEmail.trim(),
      }),
    });
    const data = await res.json();
    if (!data.order_id) {
      setPaying(false);
      return;
    }
    pendingOrderId.current = data.order_id;
    window.openKkiapayWidget?.({
      amount: data.amount,
      key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY,
      sandbox: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false',
      position: 'center',
      theme: 'orange',
    });
    setPaying(false);
  }

  return (
    <>
      {photos.length > 20 && (
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-2 text-xs text-gray-400">
            {normalizedQuery ? t('resultsFound', { count: visiblePhotos.length }) : t('resultsTotal', { count: visiblePhotos.length })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {visiblePhotos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => toggle(photo.id)}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            className={`group animate-fade-up overflow-hidden rounded-xl bg-white text-left shadow-sm dark:bg-slate-800 ring-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              selected.includes(photo.id) ? 'ring-sn-orange' : 'ring-transparent'
            }`}
          >
            <div className="relative overflow-hidden">
              <img
                src={photo.watermark_url || photo.thumbnail_url}
                alt={photo.photo_number}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {selected.includes(photo.id) && (
                <div className="absolute right-2 top-2 flex h-6 w-6 animate-fade-in items-center justify-center rounded-full bg-sn-orange text-xs font-bold text-white shadow">
                  ✓
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">#{photo.photo_number}</span>
              <span className="text-sm font-semibold text-sn-teal">
                {formatFCFA(photo.price_fcfa)}
              </span>
            </div>
          </button>
        ))}
        {!visiblePhotos.length && (
          <p className="col-span-full rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-white/10">
            {t('noResults', { query })}
          </p>
        )}
      </div>

      {/* Barre panier : glisse depuis le bas dès qu'une photo est sélectionnée */}
      <div
        className={`fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-slate-800 transition-transform duration-300 ${
          selected.length > 0 ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="container-sn flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm dark:text-gray-200">
            {t('selectedCount', { count: selected.length })}{' '}
            {discountApplied && (
              <span className="mr-1 text-xs text-gray-400 line-through">{formatFCFA(fullPriceTotal)}</span>
            )}
            <span className="font-bold text-sn-teal">{formatFCFA(total)}</span>
            {discountApplied && (
              <span className="ml-1 text-xs font-medium text-sn-orange">{t('discountApplied')}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn && (
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={t('guestEmailPlaceholder')}
                className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-700 dark:text-white"
              />
            )}
            <button
              onClick={checkoutKkiapay}
              disabled={paying || !emailValid}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t('payMobileMoney')}
            </button>
            <button
              onClick={checkoutStripe}
              disabled={paying || !emailValid}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {t('payCard')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
