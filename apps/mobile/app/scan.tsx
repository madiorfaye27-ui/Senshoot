import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';

// Web already generates QR codes pointing at a full URL
// (${APP_URL}/galerie/${qr_short_code}, see app/api/events/route.ts).
// There's no Universal Links setup yet (no custom domain — see project
// notes), so instead of trying to intercept that https:// link, this
// screen decodes it itself and pulls the short code back out.
function extractShortCode(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/galerie\/([A-Za-z0-9]+)/);
  if (match) return match[1].toUpperCase();
  if (/^[A-Za-z0-9]{4,12}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  if (!permission) return <View className="flex-1 bg-sn-white" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white px-6">
        <Text className="mb-4 text-center text-sn-slate">
          L'accès à la caméra est nécessaire pour scanner un QR Code.
        </Text>
        <PrimaryButton title="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanned.current) return;
          const code = extractShortCode(data);
          if (!code) return;
          scanned.current = true;
          router.replace(`/gallery/${code}`);
        }}
      />
      <View className="absolute inset-x-0 bottom-12 items-center">
        <Text className="rounded-full bg-black/60 px-4 py-2 text-sm text-white">
          Visez le QR Code de l'événement
        </Text>
      </View>
    </View>
  );
}
