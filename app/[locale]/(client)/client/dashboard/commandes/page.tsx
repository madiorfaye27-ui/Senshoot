import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';
import QRCode from 'qrcode';

export default async function ClientOrdersPage() {
  const t = await getTranslations('ClientOrdersPage');
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
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-white/10 dark:border-white/10">
        {(orders ?? []).map((o) => (
          <OrderRow key={o.id} order={o} accessLabel={t('accessLabel')} accessQrAlt={t('accessQrAlt')} usedLink={t('usedLink')} />
        ))}
        {!orders?.length && (
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}

async function OrderRow({
  order: o,
  accessLabel,
  accessQrAlt,
  usedLink,
}: {
  order: any;
  accessLabel: string;
  accessQrAlt: string;
  usedLink: string;
}) {
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
        <span className="font-mono text-gray-500 dark:text-gray-400">{o.order_number}</span>
        <span>{formatDate(o.created_at)}</span>
        <span>{formatFCFA(o.total_fcfa)}</span>
        <span className="capitalize">{o.status}</span>
      </div>

      {qrDataUrl && (
        <div className="mt-3 flex items-center gap-4 rounded-lg border border-gray-100 p-3 dark:border-white/10">
          <img src={qrDataUrl} alt={accessQrAlt} className="h-20 w-20" />
          <div>
            <p className="text-xs font-medium text-sn-slate dark:text-gray-300">{accessLabel}</p>
            <a href={accessUrl!} className="text-xs text-sn-orange break-all">
              {accessUrl}
            </a>
          </div>
        </div>
      )}

      {accessToken?.used_at && (
        <p className="mt-2 text-xs text-gray-400">{usedLink}</p>
      )}
    </div>
  );
}
