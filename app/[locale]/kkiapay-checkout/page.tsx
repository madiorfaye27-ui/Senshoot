'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadKkiapayScript, openKkiapayWidget } from '@/lib/kkiapay/widget';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

// Standalone bridge page, loaded inside the mobile app's WebView (never
// linked to from the web site itself — no Header/Footer, see
// app/[locale]/layout.tsx vs the (public) route group). The KKiaPay
// widget is DOM/browser-only (window.openKkiapayWidget), so there's no
// way to drive it directly from React Native; this page hosts it and
// reports back to the app via postMessage instead of the web flow's
// window.location.href redirect.
//
// Expected query params: amount (fcfa), kind ('order' | 'subscription'),
// id (order_id or subscription_payment_id), token (the mobile user's
// Supabase access token, only needed for a logged-in flow — a guest
// photo purchase needs none, same as the web guest-checkout flow).
export default function KkiapayCheckoutPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'opening' | 'confirming' | 'error'>('opening');
  const opened = useRef(false);

  const amount = Number(params.get('amount'));
  const kind = params.get('kind');
  const id = params.get('id');
  const token = params.get('token');

  useEffect(() => {
    if (!amount || !id || opened.current) return;
    opened.current = true;

    loadKkiapayScript().then(() => {
      window.addSuccessListener?.(async (response) => {
        setStatus('confirming');
        const confirmUrl =
          kind === 'subscription'
            ? `/api/photographers/subscribe/${id}/confirm-kkiapay`
            : `/api/orders/${id}/confirm-kkiapay`;

        const res = await fetch(confirmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ transaction_id: response.transactionId }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus('error');
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({ result: 'error', error: data.error || 'Paiement non confirmé' })
          );
          return;
        }

        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ result: 'success', accessUrl: data.access_url ?? null })
        );
      });
      openKkiapayWidget(amount);
    });
  }, [amount, id, kind, token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sn-white px-6 text-center dark:bg-slate-900">
      <p className="text-sn-slate dark:text-gray-200">
        {status === 'confirming' ? 'Confirmation du paiement…' : 'Ouverture du paiement…'}
      </p>
      <button
        onClick={() => window.ReactNativeWebView?.postMessage(JSON.stringify({ result: 'canceled' }))}
        className="text-sm text-sn-teal underline"
      >
        Annuler
      </button>
    </div>
  );
}
