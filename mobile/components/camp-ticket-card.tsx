import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/parent-card';
import type { StoredParentPurchase } from '@/hooks/use-parent-purchases';
import { activityColors } from '@/lib/activity-theme';
import { campTicketPayload } from '@/lib/camp-ticket';
import { type StoredCourseDocument } from '@/lib/course-documents';
import type { ParentParticipant } from '@/lib/parent-content';
import { printPaymentReceipt } from '@/lib/payment-receipt-pdf';
import { Palette, Radius, Spacing } from '@/lib/theme';

type Props = {
  purchase: StoredParentPurchase;
  participant?: ParentParticipant | null;
  documents: StoredCourseDocument[];
  compact?: boolean;
};

export function CampTicketCard({ purchase, participant, documents, compact = false }: Props) {
  const ticket = campTicketPayload(purchase, participant ?? null, documents);
  const colors = activityColors('Tábor');
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    await printPaymentReceipt(purchase);
    setPrinting(false);
  };

  return (
    <View style={[styles.ticket, compact && styles.ticketCompact, { backgroundColor: colors.background, borderColor: ticket.documentsComplete ? colors.border : Palette.accent }]}> 
      <View style={styles.ticketHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.ticketKicker, { color: colors.text }]}>Tábor QR ticket</Text>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <Text style={styles.ticketCode} numberOfLines={1}>{ticket.documentsComplete ? ticket.code : 'QR se odemkne po dokumentech'}</Text>
        </View>
        <StatusPill label={ticket.documentsComplete ? 'QR aktivní' : `${ticket.signedDocuments}/${ticket.requiredDocuments}`} tone={ticket.documentsComplete ? 'success' : 'warning'} />
      </View>

      {ticket.documentsComplete ? (
        <View style={[styles.ticketBody, compact && styles.ticketBodyCompact]}>
          <GeneratedCampQr seed={ticket.code} compact={compact} />
          <View style={styles.ticketInfo}>
            <TicketField label="Jméno" value={ticket.participantName} />
            <TicketField label="První sken" value={`${ticket.firstDay} · u vstupu`} />
            <TicketField label="Místo" value={ticket.place} />
            <TicketField label="Dokumenty" value="Zaplaceno + podepsáno" />
            {!compact ? <TicketField label="Anamnéza" value={`Alergie: ${ticket.allergies} · Léky: ${ticket.medication}`} /> : null}
          </View>
        </View>
      ) : (
        <View style={styles.lockedBox}>
          <Text style={styles.lockedTitle}>Ticket čeká na dokumenty</Text>
          <Text style={styles.muted}>Po podpisu všech táborových dokumentů se QR uloží do profilu rodiče i účastníka. Trenér ho první den naskenuje a uvidí anamnézu, alergie, léky a odchod.</Text>
          <Text style={styles.missingText}>Chybí: {ticket.missingDocuments.join(', ')}</Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Vyplnit ve webovém portálu</Text>
          </View>
        </View>
      )}

      {!compact ? (
        <View style={styles.skillWrap}>
          {ticket.requiredItems.map((item) => (
            <View key={item} style={[styles.skillPill, { borderColor: colors.border, backgroundColor: colors.soft }]}> 
              <Text style={styles.skillText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.printButton, pressed && { opacity: 0.84 }]}
        onPress={handlePrint}
        disabled={printing}
        accessibilityLabel="Vytisknout potvrzení platby"
      >
        {printing
          ? <ActivityIndicator size="small" color={Palette.primary} />
          : <FontAwesome5 name="file-pdf" size={13} color={Palette.primary} />}
        <Text style={styles.printButtonText}>{printing ? 'Generuji…' : 'Potvrzení platby (PDF)'}</Text>
      </Pressable>
    </View>
  );
}

export function GeneratedCampQr({ seed, faded = false, compact = false }: { seed: string; faded?: boolean; compact?: boolean }) {
  const blocks = Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);
    const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    const value = seed.charCodeAt(index % seed.length) + index * 13 + x * 7 + y * 3;
    return finder || value % 5 < 3;
  });

  return (
    <View style={[styles.qr, compact && styles.qrCompact, faded && styles.qrFaded]}>
      {blocks.map((filled, index) => <View key={`${seed}-${index}`} style={[styles.qrCell, compact && styles.qrCellCompact, filled && styles.qrCellFilled]} />)}
    </View>
  );
}

function TicketField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ticketField}>
      <Text style={styles.ticketLabel}>{label}</Text>
      <Text style={styles.ticketValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, width: '100%' },
  ticketCompact: { minWidth: 260, flex: 1 },
  ticketHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  ticketKicker: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  ticketTitle: { color: Palette.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  ticketCode: { color: Palette.textMuted, fontSize: 11, lineHeight: 16, fontWeight: '900' },
  ticketBody: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, alignItems: 'center' },
  ticketBodyCompact: { gap: Spacing.md },
  ticketInfo: { flex: 1, minWidth: 220, gap: Spacing.sm },
  ticketField: { gap: 2 },
  ticketLabel: { color: Palette.textMuted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  ticketValue: { color: Palette.text, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  lockedBox: { backgroundColor: 'rgba(255,255,255,0.62)', borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  lockedTitle: { color: Palette.text, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  missingText: { color: Palette.primary, fontSize: 13, lineHeight: 19, fontWeight: '900' },
  button: { alignSelf: 'flex-start', backgroundColor: Palette.primaryDark, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginTop: Spacing.xs },
  buttonText: { color: '#fff', fontWeight: '900' },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillPill: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  skillText: { color: Palette.text, fontSize: 12, lineHeight: 15, fontWeight: '900' },
  printButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(139,29,255,0.08)', borderColor: 'rgba(139,29,255,0.22)', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  printButtonText: { color: Palette.primary, fontSize: 13, fontWeight: '900' },
  qr: { width: 126, height: 126, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderWidth: 1, borderColor: Palette.border },
  qrCompact: { width: 108, height: 108, padding: 8, gap: 2 },
  qrFaded: { opacity: 0.5 },
  qrCell: { width: 9, height: 9, borderRadius: 1.5, backgroundColor: '#FFFFFF' },
  qrCellCompact: { width: 8, height: 8 },
  qrCellFilled: { backgroundColor: Palette.text },
});