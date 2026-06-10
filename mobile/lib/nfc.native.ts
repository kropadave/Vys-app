// Native NFC — iOS (CoreNFC) + Android via react-native-nfc-manager.
// Metro automatically prefers this file over nfc.ts on iOS and Android.

import { Platform } from 'react-native';

export type StopNfcFn = () => void;

type NfcModule = {
  default: {
    start: () => Promise<void>;
    isSupported: () => Promise<boolean>;
    isEnabled: () => Promise<boolean>;
    setEventListener: (event: unknown, listener: ((tag: unknown) => void) | null) => void;
    setAlertMessageIOS: (message: string) => void;
    registerTagEvent: () => Promise<void>;
    unregisterTagEvent: () => Promise<void>;
  };
  NfcEvents: {
    DiscoverTag: unknown;
  };
};

function loadNfcModule(): NfcModule | null {
  try {
    // In Expo Go this module is not available and direct import would crash app startup.
    return require('react-native-nfc-manager') as NfcModule;
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function extractNdefText(payload: number[]): string | null {
  // NDEF Text record layout: byte0 = status (lower 6 bits = lang length),
  // then lang bytes, then UTF-8 or UTF-16 text.
  if (payload.length < 3) return null;
  const langLength = payload[0] & 0x3f;
  const textBytes = payload.slice(1 + langLength);
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(textBytes)).trim() || null;
  } catch {
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function startNfcScan(
  onChipId: (id: string) => void,
  onError: (msg: string) => void,
): Promise<StopNfcFn> {
  const nfcModule = loadNfcModule();
  if (!nfcModule) {
    onError('NFC v Expo Go nefunguje. Pro NFC použij development build aplikace TeamVYS.');
    return () => {};
  }

  const NfcManager = nfcModule.default;
  const { NfcEvents } = nfcModule;

  try {
    await NfcManager.start();
  } catch {
    // "Already started" — safe to ignore.
  }

  const supported = await NfcManager.isSupported();
  if (!supported) {
    onError('Tento telefon NFC nepodporuje.');
    return () => {};
  }

  const enabled = await NfcManager.isEnabled();
  if (!enabled) {
    onError('NFC není zapnuto. Zapni ho v Nastavení → Připojení → NFC.');
    return () => {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
    console.log('NFC TAG RAW:', JSON.stringify(tag));
    // 1. Prefer NDEF text record (if chip was programmed with a custom ID string).
    if (Array.isArray(tag?.ndefMessage)) {
      for (const record of tag.ndefMessage as { payload?: number[] }[]) {
        if (Array.isArray(record?.payload)) {
          const text = extractNdefText(record.payload);
          if (text) {
            onChipId(text);
            if (Platform.OS === 'ios') {
              NfcManager.setAlertMessageIOS('Hotovo! Přilož čip dalšího dítěte.');
            }
            return;
          }
        }
      }
    }

    // 2. Fall back to hardware UID (7-byte for NTAG213, unique from factory).
const rawId = tag?.id;
if (rawId) {
  const chipId = Array.isArray(rawId)
    ? bytesToHex(rawId as number[])
    : String(rawId).trim();
  if (chipId) {
    onChipId(chipId);
    if (Platform.OS === 'ios') {
      NfcManager.setAlertMessageIOS('Hotovo! Přilož čip dalšího dítěte.');
    }
    return;
  }
}

onError('Čip se načetl, ale neobsahuje ID. Přilož ho znovu.');
  });

  try {
    await NfcManager.registerTagEvent();
  } catch {
    onError(
      'NFC čtečku se nepodařilo spustit. Zkontroluj, že má telefon NFC povolené a aplikace má oprávnění.',
    );
    return () => {};
  }

  return () => {
    void NfcManager.unregisterTagEvent();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  };
}
