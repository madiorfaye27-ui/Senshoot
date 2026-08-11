import { createClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';
import QRCode from 'qrcode';

export default async function ClientOrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_access_tokens(token, used_at)')
    .eq('client_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Mes commandes</h1>
      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {(orders ?? []).map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
        {!orders?.length && (
          <p className="p-8 text-center text-sm text-gray-400">Aucune commande pour le moment.</p>
        )}
      </div>
    </div>
  );
}

async function OrderRow({ order: o }: { order: any }) {
  // Le token n'existe que pour les commandes payées (généré par le
  // webhook Stripe). "used_at" : le lien à usage unique a déjà servi ;
  // le client retrouve alors ses photos via cette page (son compte).
  const accessToken = o.order_access_tokens?.[0];
  const accessUrl = accessToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/acces/${accessToken.token}`
    : null;
  const qrDataUrl = accessUrl && !accessToken.used_at
    ? await QRCode.toDataURL(accessUrl)
    : null;

  return (
    <div className="p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-gray-500">{o.order_number}</span>
        <span>{formatDate(o.created_at)}</span>
        <span>{formatFCFA(o.total_fcfa)}</span>
        <span className="capitalize">{o.status}</span>
      </div>

      {qrDataUrl && (
        <div className="mt-3 flex items-center gap-4 rounded-lg border border-gray-100 p-3">
          <img src={qrDataUrl} alt="QR d'accès" className="h-20 w-20" />
          <div>
            <p className="text-xs font-medium text-sn-slate">
              Accès direct à vos photos (lien à usage unique)
            </p>
            <a href={accessUrl!} className="text-xs text-sn-orange break-all">
              {accessUrl}
            </a>
          </div>
        </div>
      )}

      {accessToken?.used_at && (
        <p className="mt-2 text-xs text-gray-400">
          Lien d'accès déjà utilisé — vos photos restent disponibles ici, dans votre compte.
        </p>
      )}
    </div>
  );
}
