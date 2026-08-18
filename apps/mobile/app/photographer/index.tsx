import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Mirrors app/[locale]/(photographer)/dashboard/page.tsx on the web,
// which — as of this writing — shows the same hardcoded 0 for every stat
// (statEvents, statGalleries, statPhotos, statSales, statRevenue,
// statAvailableRevenue never got wired to a real query there either).
// Matching that rather than inventing a different, richer dashboard here.
export default function PhotographerHome() {
  const { profile } = useAuth();
  const [photographer, setPhotographer] = useState<{ studio_name: string | null; status: string } | null>(
    null
  );

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('photographers')
      .select('studio_name, status')
      .eq('profile_id', profile.id)
      .single()
      .then(({ data }) => setPhotographer(data));
  }, [profile]);

  const stats = [
    { label: 'Événements', value: '0' },
    { label: 'Galeries', value: '0' },
    { label: 'Photos', value: '0' },
    { label: 'Ventes', value: '0' },
    { label: 'Revenu', value: '0 F CFA' },
    { label: 'Solde disponible', value: '0 F CFA' },
  ];

  return (
    <View className="flex-1 bg-sn-white px-4 pt-6">
      <Text className="text-2xl font-bold text-sn-slate">
        Bonjour{photographer?.studio_name ? `, ${photographer.studio_name}` : ''}
      </Text>
      <Text className="mt-1 text-sm text-gray-500">
        Statut du compte : <Text className="font-medium">{photographer?.status ?? 'en attente'}</Text>
      </Text>

      <View className="mt-6 flex-row flex-wrap gap-3">
        {stats.map((s) => (
          <View key={s.label} className="w-[47%] rounded-xl bg-white p-4 shadow-sm">
            <Text className="text-xs font-medium uppercase text-gray-400">{s.label}</Text>
            <Text className="mt-2 text-lg font-bold text-sn-teal">{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
