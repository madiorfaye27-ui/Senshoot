import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { formatFCFA, formatDate } from '@/lib/utils/format';

export default async function AccessTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const t = await getTranslations('AccessTokenPage');
  const admin = createAdminClient();

  const { data: accessToken } = await admin
    .from('order_access_tokens')
    .select('*, orders(*, order_items(*, photos(*)))')
    .eq('token', params.token)
    .single();

  if (!accessToken) return notFound();

  const order = accessToken.orders;

  // Lien à usage unique : la première ouverture donne accès aux photos et
  // consomme le lien. Les ouvertures suivantes (lien partagé, capture
  // d'écran du QR...) renvoient vers la connexion classique — le compte
  // du client reste l'accès durable et sécurisé à sa commande.
  if (accessToken.used_at) {
    return (
      <div className="container-sn flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold text-sn-slate dark:text-white">
          {t('linkUsedTitle')}
        </h1>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {t('linkUsedText')}
        </p>
        <Link href="/login" className="btn-primary mt-6 text-sm">
          {t('login')}
        </Link>
      </div>
    );
  }

  await admin
    .from('order_access_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', accessToken.id);

  return (
    <div className="container-sn py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-sn-slate dark:text-white">
          {t('title', { orderNumber: order.order_number })}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatDate(order.created_at)} · {formatFCFA(order.total_fcfa)}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {(order.order_items ?? []).map((item: any) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800"
          >
            <img
              src={item.photos.thumbnail_url || item.photos.watermark_url}
              alt={item.photos.photo_number}
              className="aspect-square w-full object-cover"
            />
            <div className="p-3">
              <p className="text-xs text-gray-400">#{item.photos.photo_number}</p>
              <a
                href={`/api/acces/${params.token}/download/${item.id}`}
                className="btn-primary mt-2 block text-center text-xs"
              >
                {t('download')}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
