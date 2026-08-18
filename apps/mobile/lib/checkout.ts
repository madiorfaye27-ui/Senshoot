import * as WebBrowser from 'expo-web-browser';
import { apiFetch, getAccessToken } from './api';

export type OrderPaymentMethod = 'stripe' | 'kkiapay';

interface CreateOrderParams {
  eventId: string;
  photoIds: string[];
  paymentMethod: OrderPaymentMethod;
  guestEmail?: string;
}

export async function createOrder(params: CreateOrderParams) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      event_id: params.eventId,
      photo_ids: params.photoIds,
      payment_method: params.paymentMethod,
      guest_email: params.guestEmail,
    }),
  }) as Promise<{ checkout_url?: string; order_id?: string; amount?: number }>;
}

// Opens Stripe's hosted checkout in an in-app browser. The API route sets
// success_url/cancel_url to "senshootapp://payment-return" for bearer
// (mobile) requests — see app/api/orders/route.ts — which
// openAuthSessionAsync watches for and intercepts itself, closing the
// browser and resolving this promise instead of actually navigating
// there. Payment is only ever confirmed server-side via the Stripe
// webhook; this is just about getting the browser to close again.
export async function openStripeCheckout(checkoutUrl: string) {
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'senshootapp://payment-return');
  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);
    return { canceled: url.searchParams.get('result') === 'canceled' };
  }
  return { canceled: true };
}

// KKiaPay's widget is DOM-only — see app/[locale]/kkiapay-checkout/page.tsx
// — so the mobile app drives it through a WebView loading that page
// instead. Building the URL (and forwarding the user's own access token,
// only needed for a logged-in flow) lives here so both the gallery
// checkout and the photographer subscription screen build it the same way.
export async function buildKkiapayCheckoutUrl(params: {
  amount: number;
  kind: 'order' | 'subscription';
  id: string;
}) {
  const token = await getAccessToken();
  const appUrl = process.env.EXPO_PUBLIC_APP_URL;
  const search = new URLSearchParams({
    amount: String(params.amount),
    kind: params.kind,
    id: params.id,
    ...(token ? { token } : {}),
  });
  return `${appUrl}/kkiapay-checkout?${search.toString()}`;
}
