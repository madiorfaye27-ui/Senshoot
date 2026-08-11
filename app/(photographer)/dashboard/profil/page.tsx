import { createClient } from '@/lib/supabase/server';

export default async function PhotographerProfilePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('*')
    .eq('profile_id', user?.id)
    .single();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-sn-slate">Mon profil public</h1>
      <p className="mt-1 text-sm text-gray-500">
        Ces informations sont visibles par tous les clients sur la page
        d'accueil et l'annuaire des photographes — c'est ce qui leur permet
        de vous contacter pour un événement.
      </p>

      {searchParams.success && (
        <p className="mt-4 rounded-lg bg-sn-teal/10 p-3 text-sm text-sn-teal">
          Profil mis à jour.
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {searchParams.error}
        </p>
      )}

      <form action="/api/photographers/profile" method="post" className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Nom du studio</label>
          <input
            name="studio_name"
            defaultValue={photographer?.studio_name ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={photographer?.description ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Ville</label>
          <input
            name="city"
            defaultValue={photographer?.city ?? ''}
            placeholder="Dakar"
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">Téléphone</label>
            <input
              name="contact_phone"
              defaultValue={photographer?.contact_phone ?? ''}
              placeholder="+221 77 000 00 00"
              className="w-full rounded-lg border border-gray-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">WhatsApp</label>
            <input
              name="contact_whatsapp"
              defaultValue={photographer?.contact_whatsapp ?? ''}
              placeholder="+221 77 000 00 00"
              className="w-full rounded-lg border border-gray-200 px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Email de contact</label>
          <input
            name="contact_email"
            type="email"
            defaultValue={photographer?.contact_email ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
