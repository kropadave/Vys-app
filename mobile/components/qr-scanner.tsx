// QR code scanner overlay using expo-camera.
// Falls back to manual text input when expo-camera native module is unavailable (e.g. Expo Go).

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/lib/theme';

// Lazy-load expo-camera so a missing native module (Expo Go) doesn't crash the whole module.
let CameraViewNative: React.ComponentType<{
  style: object;
  facing: string;
  barcodeScannerSettings: { barcodeTypes: string[] };
  onBarcodeScanned?: (e: { data: string }) => void;
}> | null = null;
let useCameraPermissionsNative: (() => [{ granted: boolean } | null, () => Promise<void>]) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-camera') as { CameraView: typeof CameraViewNative; useCameraPermissions: typeof useCameraPermissionsNative };
  CameraViewNative = mod.CameraView;
  useCameraPermissionsNative = mod.useCameraPermissions;
} catch {
  // expo-camera not available in this environment (Expo Go)
}

type Props = {
  onScanned: (code: string) => void;
  onClose: () => void;
};

export function QrScanner({ onScanned, onClose }: Props) {
  // When expo-camera isn't available, show a manual text-entry fallback.
  if (!CameraViewNative || !useCameraPermissionsNative) {
    return <ManualQrFallback onScanned={onScanned} onClose={onClose} />;
  }
  return <CameraQrScanner CameraView={CameraViewNative} useCameraPermissions={useCameraPermissionsNative} onScanned={onScanned} onClose={onClose} />;
}

function ManualQrFallback({ onScanned, onClose }: Props) {
  const [text, setText] = useState('');
  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>Kamera není k dispozici.{'\n'}Vlož kód nebo URL z QR ručně:</Text>
      <TextInput
        style={styles.manualInput}
        placeholder="Vlož QR kód nebo URL…"
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => { if (text.trim()) onScanned(text.trim()); }}
        style={[styles.btn, !text.trim() && { opacity: 0.4 }]}
      >
        <Text style={styles.btnText}>Potvrdit</Text>
      </Pressable>
      <Pressable onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
        <Text style={styles.btnTextSecondary}>Zavřít</Text>
      </Pressable>
    </View>
  );
}

function CameraQrScanner({
  CameraView,
  useCameraPermissions,
  onScanned,
  onClose,
}: Props & {
  CameraView: NonNullable<typeof CameraViewNative>;
  useCameraPermissions: NonNullable<typeof useCameraPermissionsNative>;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  function handleBarcode({ data }: { data: string }) {
    if (calledRef.current) return;
    calledRef.current = true;
    setScanned(true);
    onScanned(data.trim());
  }

  if (!permission) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.hint}>Načítám oprávnění ke kameře…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.hint}>Přístup ke kameře je potřeba pro skenování QR kódů.</Text>
        <Pressable onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Povolit kameru</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
          <Text style={styles.btnTextSecondary}>Zavřít</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />
      {/* Finder frame */}
      <View style={styles.finderWrap} pointerEvents="none">
        <View style={styles.finder} />
        <Text style={styles.scanHint}>Namiř na QR kód trenéra</Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeBtnText}>✕ Zavřít</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0A15',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  hint: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  btn: {
    backgroundColor: '#8B1DFF',
    borderRadius: Radius.pill,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.10)' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  btnTextSecondary: { color: 'rgba(255,255,255,0.70)', fontSize: 15, fontWeight: '700' },
  manualInput: {
    width: '100%',
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  finderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  finder: {
    width: 240,
    height: 240,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: '#8B1DFF',
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
