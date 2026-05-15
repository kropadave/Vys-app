import { useEffect, useState } from 'react';

import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export type CoachCampParticipant = {
  participantId: string;
  participantName: string;
  productId: string;
  purchaseId: string;
  parentPhone: string;
  emergencyPhone: string;
  allergies: string;
  healthLimits: string;
  medication: string;
  departureMode: string;
  authorizedPeople: string;
};

export type CoachCamp = {
  id: string;
  title: string;
  city: string;
  venue: string;
  primaryMeta: string;
  eventDate: string | null;
  participants: CoachCampParticipant[];
};

type ProductRow = {
  id: string;
  title: string;
  city: string;
  venue: string;
  primary_meta: string;
  event_date: string | null;
};

type PurchaseRow = {
  id: string;
  product_id: string;
  participant_id: string;
  participant_name: string;
};

type ParticipantHealthRow = {
  id: string;
  parent_phone: string | null;
  emergency_phone: string | null;
  allergies: string | null;
  health_limits: string | null;
  medication_note: string | null;
  departure_mode: string | null;
  authorized_people: string | null;
};

export function useCoachCamps(coachId: string): { camps: CoachCamp[]; loading: boolean } {
  const [camps, setCamps] = useState<CoachCamp[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coachId || !hasSupabaseConfig || !supabase) {
      setCamps([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // Fetch camp products where this coach is assigned
      const { data: products, error: prodError } = await supabase!
        .from('products')
        .select('id, title, city, venue, primary_meta, event_date')
        .eq('type', 'Tábor')
        .contains('coach_ids', [coachId]);

      if (prodError || !products || cancelled) {
        if (!cancelled) { setCamps([]); setLoading(false); }
        return;
      }

      if (products.length === 0) {
        if (!cancelled) { setCamps([]); setLoading(false); }
        return;
      }

      const productIds = (products as ProductRow[]).map((p) => p.id);

      // Fetch purchases for those camps
      const { data: purchases } = await supabase!
        .from('parent_purchases')
        .select('id, product_id, participant_id, participant_name')
        .eq('type', 'Tábor')
        .in('product_id', productIds);

      if (cancelled) return;

      const purchaseList: PurchaseRow[] = purchases ?? [];

      // Fetch participant health/contact data for all camp participants
      const allParticipantIds = [...new Set(purchaseList.map((pr) => pr.participant_id))];
      let healthMap: Record<string, ParticipantHealthRow> = {};
      if (allParticipantIds.length > 0) {
        const { data: healthData } = await supabase!
          .from('participants')
          .select('id,parent_phone,emergency_phone,allergies,health_limits,medication_note,departure_mode,authorized_people')
          .in('id', allParticipantIds);
        for (const row of (healthData ?? []) as ParticipantHealthRow[]) {
          healthMap[row.id] = row;
        }
      }

      const result: CoachCamp[] = (products as ProductRow[]).map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        venue: p.venue,
        primaryMeta: p.primary_meta,
        eventDate: p.event_date ?? null,
        participants: purchaseList
          .filter((pr) => pr.product_id === p.id)
          .map((pr) => {
            const h = healthMap[pr.participant_id];
            return {
              participantId: pr.participant_id,
              participantName: pr.participant_name,
              productId: pr.product_id,
              purchaseId: pr.id,
              parentPhone: h?.parent_phone ?? '',
              emergencyPhone: h?.emergency_phone ?? '',
              allergies: h?.allergies ?? '',
              healthLimits: h?.health_limits ?? '',
              medication: h?.medication_note ?? '',
              departureMode: h?.departure_mode ?? 'parent',
              authorizedPeople: h?.authorized_people ?? '',
            };
          }),
      }));

      setCamps(result);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [coachId]);

  return { camps, loading };
}
