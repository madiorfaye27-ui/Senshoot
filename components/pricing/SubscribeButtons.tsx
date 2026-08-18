'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { loadKkiapayScript, openKkiapayWidget } from '@/lib/kkiapay/widget';

// Un seul chargement du widget KKiaPay pour toute la grille de formules
// (au lieu d'un par carte) — même logique que GalleryCart, adaptée pour
// gérer plusieurs boutons "Choisir" sur la même page.
export default function SubscribeButtons({ planId }: { planId: string }) {
  const t = useTranslations('PricingPage');
  const router = useRouter();
  const [paying, setPaying] = useState<'stripe' | 'kkiapay' | null>(null);
  const pendingPaymentId = useRef<string | null>(null);

  useEffect(() => {
    loadKkiapayScript().then(() => {
      window.addSuccessListener?.(async (response) => {
        const paymentId = pendingPaymentId.current;
        if (!paymentId) return;
        await fetch(`/api/photographers/subscribe/${paymentId}/confirm-kkiapay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: response.transactionId }),
        });
        router.push('/dashboard/abonnement?success=1');
      });
    });
  }, [router]);

  async function subscribe(payment_method: 'stripe' | 'kkiapay') {
    setPaying(payment_method);
    const res = await fetch('/api/photographers/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, payment_method }),
    });
    const data = await res.json();

    if (payment_method === 'stripe') {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setPaying(null);
      }
      return;
    }

    if (!data.subscription_payment_id) {
      setPaying(null);
      return;
    }
    pendingPaymentId.current = data.subscription_payment_id;
    openKkiapayWidget(data.amount);
    setPaying(null);
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        onClick={() => subscribe('kkiapay')}
        disabled={paying !== null}
        className="btn-secondary w-full text-xs disabled:opacity-50"
      >
        {t('payMobileMoney')}
      </button>
      <button
        onClick={() => subscribe('stripe')}
        disabled={paying !== null}
        className="btn-primary w-full text-xs disabled:opacity-50"
      >
        {t('payCard')}
      </button>
    </div>
  );
}
