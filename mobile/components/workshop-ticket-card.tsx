import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/parent-card';
import type { StoredParentPurchase } from '@/hooks/use-parent-purchases';
import { activityColors } from '@/lib/activity-theme';
import type { ParentParticipant } from '@/lib/parent-content';
import { printPaymentReceipt } from '@/lib/payment-receipt-pdf';
import { Palette, Radius, Spacing } from '@/lib/theme';
import { formatTicketExpiry, isWorkshopTicketExpired, workshopTicketPayload } from '@/lib/workshop-ticket';

type Props = {
  purchase: StoredParentPurchase;
  participant?: ParentParticipant | null;
  onRemove?: () => void;
  compact?: boolean;
};

export function WorkshopTicketCard({ purchase, participant, onRemove, compact = false }: Props) {
  const ticket = workshopTicketPayload(purchase, participant ?? null);
  const colors = activityColors('Workshop');
  const expired = isWorkshopTicketExpired(ticket.expiresAt);
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    await printPaymentReceipt(purchase);
    setPrinting(false);
  };

  return (
    <View style={[styles.ticket, { backgroundColor: colors.background, borderColor: expired ? Palette.danger : colors.border }, expired && styles.ticketExpired]}>
      <View style={styles.ticketHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.ticketKicker, { color: colors.text }]}>Workshop QR ticket</Text>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <Text style={styles.ticketCode} numberOfLines={1}>{ticket.code}</Text>
        </View>
        <StatusPill label={expired ? 'Vypršelo' : 'Platný'} tone={expired ? 'danger' : 'success'} />
      </View>

      <View style={[styles.ticketBody, compact && styles.ticketBodyCompact]}>
        <GeneratedWorkshopQr seed={ticket.code} faded={expired} compact={compact} />
        <View style={styles.ticketInfo}>
          <TicketField label="Jméno" value={ticket.participantName} />
          <TicketField label="Level" value={ticket.participantLevel ? `Level ${ticket.participantLevel} · ${ticket.participantBracelet} náramek · ${ticket.participantXp} XP` : 'Účastník z nákupu'} />
          <TicketField label="Místo" value={ticket.place} />
          <TicketField label="Platí" value={`${ticket.eventDate} · do ${formatTicketExpiry(ticket.expiresAt)}`} />
          <TicketField label="Cena" value={ticket.priceLabel} />
        </View>
      </View>

      <View style={styles.skillWrap}>
        {ticket.tricks.map((trick) => (
          <View key={trick} style={[styles.skillPill, { borderColor: colors.border, backgroundColor: colors.soft }]}> 
            <Text style={styles.skillText}>{trick}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
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

        {expired && onRemove ? (
          <Pressable style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.84 }]} onPress={onRemove} accessibilityLabel="Smazat vypršelý workshop ticket">
            <Text style={styles.deleteButtonText}>Smazat z profilu</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function GeneratedWorkshopQr({ seed, faded = false, compact = false }: { seed: string; faded?: boolean; compact?: boolean }) {
  const blocks = Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);
    const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    const value = seed.charCodeAt(index % seed.length) + index * 11 + x * 3 + y * 5;
    return finder || value % 4 !== 0;
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
  ticketExpired: { opacity: 0.84 },
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
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillPill: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  skillText: { color: Palette.text, fontSize: 12, lineHeight: 15, fontWeight: '900' },
  qr: { width: 126, height: 126, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderWidth: 1, borderColor: Palette.border },
  qrCompact: { width: 108, height: 108, padding: 8, gap: 2 },
  qrFaded: { opacity: 0.5 },
  qrCell: { width: 9, height: 9, borderRadius: 1.5, backgroundColor: '#FFFFFF' },
  qrCellCompact: { width: 8, height: 8 },
  qrCellFilled: { backgroundColor: Palette.text },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  printButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(139,29,255,0.08)', borderColor: 'rgba(139,29,255,0.22)', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  printButtonText: { color: Palette.primary, fontSize: 13, fontWeight: '900' },
  deleteButton: { alignSelf: 'flex-start', backgroundColor: Palette.dangerSoft, borderColor: 'rgba(240,68,91,0.34)', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  deleteButtonText: { color: Palette.text, fontSize: 13, fontWeight: '900' },
});