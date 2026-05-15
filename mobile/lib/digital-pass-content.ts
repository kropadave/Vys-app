export type DigitalPass = {
  id: string;
  participantId: string;
  holderName: string;
  title: string;
  location: string;
  nfcChipId: string;
  totalEntries: number;
  usedEntries: number;
  lastScanAt: string;
  lastScanPlace: string;
};

export const digitalPass: DigitalPass = {
  id: 'pass-demo-child-1',
  participantId: 'demo-child-1',
  holderName: 'Eliška Nováková',
  title: 'Permanentka 10 vstupů',
  location: 'Vyškov · ZŠ Nádražní',
  nfcChipId: 'NFC-VYS-0428',
  totalEntries: 10,
  usedEntries: 4,
  lastScanAt: 'Středa 24. 4. 2026 · 16:27',
  lastScanPlace: 'Vyškov · ZŠ Nádražní',
};

export const digitalPasses: DigitalPass[] = [digitalPass];

export function remainingEntries(pass: DigitalPass) {
  return Math.max(pass.totalEntries - pass.usedEntries, 0);
}

export function digitalPassProgress(pass: DigitalPass) {
  if (pass.totalEntries === 0) return 0;
  return Math.min(pass.usedEntries / pass.totalEntries, 1);
}