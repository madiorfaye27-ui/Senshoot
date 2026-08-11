import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils/format';

export default async function TarifsPage() {
  const supabase = createClient();
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="container-sn py-16">
      <h1 className="text-center text-3xl font-bold text-sn-slate dark:text-white">
        Des formules pour chaque photographe
      </h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {(plans ?? []).map((plan) => (
          <div key={plan.id} className="card-hover surface-card rounded-2xl p-6 text-center shadow-sm">
            <p className="font-bold text-sn-teal">{plan.name}</p>
            <p className="mt-2 text-2xl font-extrabold text-sn-slate dark:text-white">
              {formatFCFA(plan.price_fcfa)}
              <span className="text-sm font-normal text-gray-400">/mois</span>
            </p>
            <ul className="mt-4 space-y-1 text-left text-xs text-gray-500 dark:text-gray-400">
              {plan.max_events && <li>{plan.max_events} événements</li>}
              {plan.max_storage_gb && <li>{plan.max_storage_gb} Go de stockage</li>}
              {plan.max_photos && <li>{plan.max_photos} photos</li>}
            </ul>
            <a href="/register" className="btn-primary mt-6 w-full text-sm">
              Choisir
            </a>
          </div>
        ))}
        {!plans?.length && (
          <p className="col-span-full text-center text-gray-400">
            Les formules seront bientôt disponibles.
          </p>
        )}
      </div>
    </div>
  );
}
