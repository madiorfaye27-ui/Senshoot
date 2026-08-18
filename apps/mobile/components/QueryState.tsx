import { ActivityIndicator, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

// All 6 admin screens share the same useAdminOverview() query. Without
// this, each screen's `if (isLoading || !data) return <spinner>` also
// silently swallowed the error case — a failed fetch (e.g. no network)
// left the user staring at a spinner forever, with react-query having
// already given up retrying in the background. This makes loading and
// error two distinct, visible states.
export function QueryState({ isLoading, onRetry }: { isLoading: boolean; onRetry: () => void }) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-sn-white px-6">
      <Text className="text-center text-sn-slate">Impossible de charger les données.</Text>
      <PrimaryButton title="Réessayer" onPress={onRetry} />
    </View>
  );
}
