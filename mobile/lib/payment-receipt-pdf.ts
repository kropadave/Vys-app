import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import type { StoredParentPurchase } from '@/hooks/use-parent-purchases';

function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function receiptHtml(purchase: StoredParentPurchase): string {
  const typeLabel: Record<string, string> = {
    Workshop: 'Workshop',
    Tábor: 'Tábor',
    Kroužek: 'Kroužek',
  };

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Potvrzení platby – ${purchase.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #FFF9F0; color: #171220; padding: 40px; }
    .card { background: #FFFFFF; border-radius: 16px; border: 1.5px solid rgba(23,18,32,0.08); max-width: 560px; margin: 0 auto; padding: 36px 36px 32px; }
    .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .logo-dot { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#8B1DFF,#F12BB3); }
    .logo-text { font-size: 18px; font-weight: 900; color: #171220; letter-spacing: -0.5px; }
    h1 { font-size: 22px; font-weight: 900; color: #171220; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #8B7FAB; margin-bottom: 28px; }
    .divider { height: 1.5px; background: rgba(23,18,32,0.07); margin: 24px 0; }
    .field { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .field-label { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #8B7FAB; }
    .field-value { font-size: 14px; font-weight: 700; color: #171220; text-align: right; max-width: 280px; }
    .amount-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .amount-label { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #8B7FAB; }
    .amount-value { font-size: 28px; font-weight: 900; color: #22C55E; }
    .status-pill { display: inline-block; background: #DCFCE7; border: 1.5px solid #86EFAC; border-radius: 999px; padding: 4px 14px; font-size: 12px; font-weight: 900; color: #15803D; margin-top: 20px; }
    .footer { margin-top: 32px; font-size: 11px; color: #8B7FAB; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-row">
      <div class="logo-dot"></div>
      <span class="logo-text">TeamVYS</span>
    </div>

    <h1>Potvrzení platby</h1>
    <p class="subtitle">Číslo dokladu: ${purchase.id}</p>

    <div class="divider"></div>

    <div class="field">
      <span class="field-label">Produkt</span>
      <span class="field-value">${purchase.title}</span>
    </div>
    <div class="field">
      <span class="field-label">Typ</span>
      <span class="field-value">${typeLabel[purchase.type] ?? purchase.type}</span>
    </div>
    <div class="field">
      <span class="field-label">Účastník</span>
      <span class="field-value">${purchase.participantName}</span>
    </div>
    <div class="field">
      <span class="field-label">Místo</span>
      <span class="field-value">${purchase.place || '—'}</span>
    </div>
    ${purchase.eventDate ? `
    <div class="field">
      <span class="field-label">Datum akce</span>
      <span class="field-value">${formatDate(purchase.eventDate)}</span>
    </div>` : ''}
    <div class="field">
      <span class="field-label">Datum platby</span>
      <span class="field-value">${formatDate(purchase.paidAt)}</span>
    </div>

    <div class="divider"></div>

    <div class="amount-row">
      <span class="amount-label">Celkem zaplaceno</span>
      <span class="amount-value">${purchase.priceLabel || `${purchase.amount} Kč`}</span>
    </div>

    <div>
      <span class="status-pill">✓ Zaplaceno</span>
    </div>

    <div class="footer">
      TeamVYS · Potvrzení vygenerováno ${formatDate(new Date().toISOString())}<br/>
      Tento dokument je automaticky vygenerovaný doklad o platbě.
    </div>
  </div>
</body>
</html>`;
}

export async function printPaymentReceipt(purchase: StoredParentPurchase): Promise<void> {
  try {
    const html = receiptHtml(purchase);

    if (Platform.OS === 'web') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
      }
      return;
    }

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Potvrzení platby – ${purchase.title}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ uri });
    }
  } catch (err) {
    Alert.alert('Chyba', 'Nepodařilo se vygenerovat PDF. Zkuste to znovu.');
  }
}
