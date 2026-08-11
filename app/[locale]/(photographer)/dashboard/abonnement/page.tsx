import { createClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';

export default async function AbonnementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('photographer_id', photographer?.id)
    .eq('status', 'active')
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Mon abonnement</h1>

      {subscription ? (
        <div className="mt-6 max-w-md rounded-xl border border-gray-100 p-6 shadow-sm">
          <p className="font-bold text-sn-teal">{subscription.plans?.name}</p>
          <p className="mt-1 text-2xl font-extrabold">
            {formatFCFA(subscription.plans?.price_fcfa)}
            <span className="text-sm font-normal text-gray-400">/mois</span>
          </p>
          {subscription.expires_at && (
            <p className="mt-2 text-sm text-gray-500">
              Expire le {formatDate(subscription.expires_at)}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          Aucun abonnement actif.{' '}
          <a href="/tarifs" className="font-medium text-sn-orange">Voir les formules →</a>
        </p>
      )}
    </div>
  );
}
