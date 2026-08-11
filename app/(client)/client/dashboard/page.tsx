import { createClient } from '@/lib/supabase/server';

export default async function ClientProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">
        Bonjour {profile?.first_name ?? ''} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-500">{user?.email}</p>

      <div className="mt-8 rounded-xl border border-gray-100 p-6">
        <p className="font-semibold text-sn-slate">Astuce</p>
        <p className="mt-1 text-sm text-gray-500">
          Scannez le QR Code d'un événement pour retrouver et acheter vos photos.
        </p>
      </div>
    </div>
  );
}
