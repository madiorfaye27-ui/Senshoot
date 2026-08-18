import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildKkiapayCheckoutUrl } from '@/lib/checkout';

interface KkiapayMessage {
  result: 'success' | 'canceled' | 'error';
  accessUrl?: string | null;
  error?: string;
}

export default function KkiapayCheckout() {
  const router = useRouter();
  const { amount, kind, id } = useLocalSearchParams<{ amount: string; kind: string; id: string }>();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!amount || !kind || !id) return;
    buildKkiapayCheckoutUrl({
      amount: Number(amount),
      kind: kind as 'order' | 'subscription',
      id,
    }).then(setUrl);
  }, [amount, kind, id]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: KkiapayMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message.result === 'success') {
      if (message.accessUrl) {
        router.replace({ pathname: '/access/[token]', params: { token: message.accessUrl.split('/').pop()! } });
      } else {
        router.replace('/client/orders');
      }
      return;
    }
    router.back();
  };

  if (!url) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return <WebView source={{ uri: url }} onMessage={handleMessage} style={{ flex: 1 }} />;
}
