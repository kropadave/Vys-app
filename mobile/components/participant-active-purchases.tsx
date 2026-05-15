import { StyleSheet, Text, View } from 'react-native';

import { CampTicketCard } from '@/components/camp-ticket-card';
import { ParticipantCard } from '@/components/participant-card';
import { WorkshopTicketCard } from '@/components/workshop-ticket-card';
import { useCourseDocuments } from '@/hooks/use-course-documents';
import { purchasesForParticipant, useParentPurchases } from '@/hooks/use-parent-purchases';
import { activityColors, type ActivityType } from '@/lib/activity-theme';
import type { ParentParticipant } from '@/lib/parent-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export function ParticipantActivePurchases({ title = 'Zakoupeno', participantId, participantName }: { title?: string; participantId?: string; participantName?: string }) {
  const participant = participantFromProfile(participantId, participantName);
  const { purchases: parentPurchases, removeParentPurchase } = useParentPurchases();
  const { documents } = useCourseDocuments();
  const participantPurchases = participant ? purchasesForParticipant(parentPurchases, participant.id).filter((purchase) => purchase.type !== 'Kroužek') : [];
  const staticTickets = participant?.activePurchases.filter((purchase) => purchase.type !== 'Kroužek' && purchase.status !== 'Zatím nezakoupeno') ?? [];
  const hasAnyItem = participantPurchases.length > 0 || staticTickets.length > 0;

  return (
    <ParticipantCard title={title}>
      {!hasAnyItem && <Text style={styles.emptyText}>Zatím není nic aktivováno.</Text>}

      {participantPurchases.map((purchase) => {
        if (purchase.type === 'Workshop') {
          return <WorkshopTicketCard key={purchase.id} purchase={purchase} participant={participant} onRemove={() => removeParentPurchase(purchase.id)} />;
        }

        if (purchase.type === 'Tábor') {
          return <CampTicketCard key={purchase.id} purchase={purchase} participant={participant} documents={documents} />;
        }

        return null;
      })}

      {staticTickets.map((purchase) => {
        if (purchase.type === 'Tábor') {
          return <StaticCampReservation key={`${purchase.type}-${purchase.title}`} title={purchase.title} place={campPlaceFor(purchase.title)} terms={campTermsFor(purchase.title)} />;
        }

        return null;
      })}
    </ParticipantCard>
  );
}

function participantFromProfile(participantId?: string, participantName?: string): ParentParticipant | null {
  if (!participantId || !participantName) return null;

  const [firstName, ...lastNameParts] = participantName.trim().split(/\s+/).filter(Boolean);
  return {
    id: participantId,
    firstName: firstName || participantName,
    lastName: lastNameParts.join(' '),
    birthNumberMasked: '',
    level: 1,
    bracelet: 'Béžová',
    braceletColor: '#D8C2A3',
    xp: 0,
    nextBraceletXp: 600,
    attendanceDone: 0,
    attendanceTotal: 0,
    activeCourse: '',
    nextTraining: '',
    paidStatus: 'due' as const,
    activePurchases: [],
  };
}

function StaticCampReservation({ title, place, terms }: { title: string; place: string; terms: string }) {
  return (
    <View style={[styles.ticket, activityTicketStyle('Tábor')]}> 
      <View style={styles.ticketHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.ticketKicker, { color: activityColors('Tábor').text }]}>Tábor</Text>
          <Text style={styles.ticketTitle}>{title}</Text>
          <Text style={styles.muted}>{place}</Text>
          {terms ? <Text style={styles.muted}>{terms}</Text> : null}
        </View>
        <ActivityPill type="Tábor" label="Zakoupeno" />
      </View>
      <Text style={styles.muted}>QR ticket se zobrazí až po zaplacení tábora a podepsání všech táborových dokumentů rodičem.</Text>
    </View>
  );
}

function ActivityPill({ type, label }: { type: ActivityType; label: string }) {
  const colors = activityColors(type);

  return (
    <View style={[styles.activityPill, { backgroundColor: colors.soft, borderColor: colors.border }]}>
      <Text style={styles.activityPillText}>{label}</Text>
    </View>
  );
}

function activityTicketStyle(type: ActivityType) {
  const colors = activityColors(type);
  return { backgroundColor: colors.background, borderColor: colors.border };
}

function campPlaceFor(title: string) {
  if (title.toLowerCase().includes('veliny')) return 'Veliny · Tábor Mlýnek';
  return 'Vyškov · Orel jednota Vyškov';
}

function campTermsFor(title: string) {
  if (title.toLowerCase().includes('veliny')) return '20.7.-24.7. nebo 27.7.-31.7.';
  return '13.7.-17.7. nebo 10.8.-14.8.';
}

const styles = StyleSheet.create({
  emptyText: { color: Palette.textMuted, fontSize: 14, lineHeight: 20 },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  ticket: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  ticketHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  ticketKicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  ticketTitle: { color: Palette.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  activityPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  activityPillText: { color: Palette.text, fontSize: 12, fontWeight: '900' },
});