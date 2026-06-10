// Web fallback — uses the W3C Web NFC API (NDEFReader).
// Chrome on Android supports this; iOS Safari does not.
// The .native.ts counterpart handles iOS and Android via react-native-nfc-manager.

export type StopNfcFn = () => void;

type NfcReadingEventLike = {
  serialNumber?: string;
  message?: {
    records?: { data?: BufferSource; recordType?: string }[];
  };
};

type NfcReaderLike = {
  scan: () => Promise<void>;
  onreading: ((event: NfcReadingEventLike) => void) | null;
  onreadingerror: (() => void) | null;
};

function chipIdFromWebNfcEvent(event: NfcReadingEventLike): string {
  const textRecord = event.message?.records?.find(
    (r) => r.data && (r.recordType === 'text' || !r.recordType),
  );
  if (textRecord?.data) {
    const decoded = new TextDecoder()
      .decode(textRecord.data)
      .replace(/^\u0002?[a-z]{2}/i, '')
      .trim();
    if (decoded) return decoded;
  }
  return event.serialNumber?.trim() ?? '';
}

export async function startNfcScan(
  onChipId: (id: string) => void,
  onError: (msg: string) => void,
): Promise<StopNfcFn> {
  const Reader = (
    globalThis as typeof globalThis & { NDEFReader?: new () => NfcReaderLike }
  ).NDEFReader;

  if (!Reader) {
    onError(
      'Tento prohlížeč nepodporuje Web NFC. Použij Chrome na Androidu nebo nainstaluj nativní aplikaci TeamVYS.',
    );
    return () => {};
  }

  const reader = new Reader();

  reader.onreading = (event) => {
    const id = chipIdFromWebNfcEvent(event);
    if (id) onChipId(id);
    else onError('Čip se načetl, ale neobsahuje ID.');
  };
  reader.onreadingerror = () =>
    onError('Čip se nepodařilo načíst. Přilož ho znovu k horní části telefonu.');

  try {
    await reader.scan();
  } catch {
    onError('NFC čtečku se nepodařilo zapnout. Zkontroluj, že má telefon NFC povolené.');
    return () => {};
  }

  return () => {
    // Web NFC API has no explicit stop; nulling callbacks stops processing.
    reader.onreading = null;
    reader.onreadingerror = null;
  };
}
