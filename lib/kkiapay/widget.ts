'use client';

// Shared with the KKiaPay-opening code that used to live only in
// components/gallery/GalleryCart.tsx — extracted so the mobile app's
// WebView bridge page (app/[locale]/(public)/kkiapay-checkout/page.tsx)
// can trigger the exact same widget without duplicating the script-load +
// invocation logic.
declare global {
  interface Window {
    openKkiapayWidget?: (config: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (response: { transactionId: string }) => void) => void;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadKkiapayScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function openKkiapayWidget(amountFcfa: number) {
  window.openKkiapayWidget?.({
    amount: amountFcfa,
    key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY,
    sandbox: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false',
    position: 'center',
    theme: 'orange',
  });
}
