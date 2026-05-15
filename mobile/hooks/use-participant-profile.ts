import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import {
    braceletForXp,
    nextBraceletXpForXp,
    participantProfile,
    type ParticipantProfile,
} from '@/lib/participant-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const emptyParticipantProfile: ParticipantProfile = {
  id: '',
  name: '',
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  homeCourse: '',
  nextTraining: '',
  level: 1,
  xp: 0,
  nextBraceletXp: nextBraceletXpForXp(0),
  bracelet: braceletForXp(0),
  birthNumberMasked: null,
};

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  active_course: string | null;
  next_training: string | null;
  level: number | null;
  xp: number | null;
  next_bracelet_xp: number | null;
  bracelet: string | null;
  bracelet_color: string | null;
  birth_number_masked: string | null;
};

function profileFromRow(row: ParticipantRow): ParticipantProfile {
  const xp = Number(row.xp ?? 0);
  const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  return {
    id: row.id,
    name,
    parentName: row.parent_name || '',
    parentEmail: '',
    parentPhone: row.parent_phone || '',
    homeCourse: row.active_course || '',
    nextTraining: row.next_training || '',
    level: Number(row.level ?? 1),
    xp,
    nextBraceletXp: nextBraceletXpForXp(xp, row.next_bracelet_xp),
    bracelet: braceletForXp(xp, row.bracelet, row.bracelet_color),
    birthNumberMasked: row.birth_number_masked ?? null,
  };
}

export function useParticipantProfile() {
  const { session, loading: authLoading } = useAuth();
  // Don't pre-fill with static "Eliška" data — start blank until auth + DB load finishes.
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (DEV_BYPASS_AUTH) {
      setProfile(participantProfile);
      setLoading(false);
      setError(null);
      return;
    }

    if (!hasSupabaseConfig || !supabase) {
      setProfile(null);
      setLoading(false);
      setError('Supabase není nakonfigurovaný, profil se nemůže načíst živě.');
      return;
    }

    if (!session?.userId) {
      setProfile(null);
      setLoading(false);
      setError('Nejdřív se přihlas jako účastník.');
      return;
    }

    setLoading(true);
    const { data, error: profileError } = await supabase
      .from('participants')
      .select('id,first_name,last_name,parent_name,parent_phone,active_course,next_training,level,xp,next_bracelet_xp,bracelet,bracelet_color,birth_number_masked')
      .eq('id', session.userId)
      .maybeSingle();

    if (profileError) {
      setProfile(null);
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setProfile(null);
      setError('K tomuto přihlášení zatím neexistuje účastnický profil.');
      setLoading(false);
      return;
    }

    setProfile(profileFromRow(data as ParticipantRow));
    setError(null);
    setLoading(false);
  }, [session?.userId]);

  // Start loading as soon as auth resolves (session might already be cached).
  useEffect(() => {
    if (authLoading) return;
    void loadProfile();
  }, [authLoading, loadProfile]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (DEV_BYPASS_AUTH || !hasSupabaseConfig || !supabaseClient || !session?.userId) return;

    // Each mount gets a unique channel name so Supabase never returns an
    // already-subscribed instance, which would throw synchronously inside
    // useEffect and crash the React tree (white screen on tab switch).
    const channelId = `participant-profile-${session.userId}-${Math.random().toString(36).slice(2)}`;
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;

    try {
      channel = supabaseClient
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `id=eq.${session.userId}` }, () => {
          void loadProfile();
        })
        .subscribe();
    } catch {
      // Realtime setup failed — profile still loads via the fetch above.
    }

    return () => {
      if (channel) void supabaseClient.removeChannel(channel);
    };
  }, [loadProfile, session?.userId]);

  const isLoading = authLoading || loading;

  return {
    profile: profile ?? emptyParticipantProfile,
    profileReady: !isLoading,
    hasLiveProfile: profile !== null,
    loading: isLoading,
    authLoading,
    error,
    refresh: loadProfile,
  };

}