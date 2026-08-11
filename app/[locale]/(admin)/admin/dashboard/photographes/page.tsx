import { createAdminClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  validated: 'bg-sn-teal/10 text-sn-teal',
  rejected: 'bg-red-50 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
};

export default async function AdminPhotographersPage() {
  const admin = createAdminClient();

  const { data: photographers } = await admin
    .from('photographers')
    .select('*, profiles(first_name, last_name, phone)')
    .order('created_at', { ascending: false });

  const pending = (photographers ?? []).filter((p) => p.status === 'pending');
  const others = (photographers ?? []).filter((p) => p.status !== 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Photographes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Validez un photographe pour qu'il apparaisse publiquement sur
        l'accueil, l'annuaire et sa fiche.
      </p>

      {!!pending.length && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase text-gray-400">
            En attente de validation ({pending.length})
          </h2>
          <div className="mt-3 space-y-3">
            {pending.map((p) => (
              <PhotographerRow key={p.id} photographer={p} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Tous les photographes</h2>
        <div className="mt-3 space-y-3">
          {others.map((p) => (
            <PhotographerRow key={p.id} photographer={p} />
          ))}
          {!photographers?.length && (
            <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              Aucun photographe inscrit pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotographerRow({ photographer: p }: { photographer: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sn-slate">
            {p.studio_name || `${p.profiles?.first_name ?? ''} ${p.profiles?.last_name ?? ''}`.trim() || 'Photographe'}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
            {STATUS_LABELS[p.status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {p.profiles?.first_name} {p.profiles?.last_name} · {p.profiles?.phone || 'pas de téléphone'} ·
          {' '}inscrit le {formatDate(p.created_at)}
        </p>
      </div>

      <div className="flex gap-2">
        {(p.status === 'pending' || p.status === 'rejected') && (
          <StatusForm photographerId={p.id} status="validated" label="Valider" className="btn-primary text-xs" />
        )}
        {p.status === 'pending' && (
          <StatusForm photographerId={p.id} status="rejected" label="Rejeter" className="btn-secondary text-xs" />
        )}
        {p.status === 'validated' && (
          <StatusForm photographerId={p.id} status="suspended" label="Suspendre" className="btn-secondary text-xs" />
        )}
        {p.status === 'suspended' && (
          <StatusForm photographerId={p.id} status="validated" label="Réactiver" className="btn-primary text-xs" />
        )}
      </div>
    </div>
  );
}

function StatusForm({
  photographerId,
  status,
  label,
  className,
}: {
  photographerId: string;
  status: string;
  label: string;
  className: string;
}) {
  return (
    <form action={`/api/admin/photographers/${photographerId}/status`} method="post">
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
