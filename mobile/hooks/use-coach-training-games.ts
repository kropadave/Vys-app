import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.coachTrainingGames';

export type CoachTrainingGameType = 'warmup' | 'skill-building' | 'cooldown' | 'competition';

export type CoachTrainingGame = {
  id: string;
  title: string;
  description: string;
  rules: string;
  ageGroup: string;
  playerCount: string;
  spaceNeeded: string;
  skillGoal: string;
  type: CoachTrainingGameType;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type CoachTrainingGameRating = {
  id: string;
  gameId: string;
  coachId: string;
  coachName: string;
  rating: number;
  createdAt: string;
};

export type CoachTrainingGameFavorite = {
  id: string;
  gameId: string;
  coachId: string;
  createdAt: string;
};

export type CoachTrainingGameWithMeta = CoachTrainingGame & {
  ratingAverage: number;
  ratingCount: number;
  myRating: number | null;
  isFavorite: boolean;
};

export type SaveCoachTrainingGameInput = {
  title: string;
  description: string;
  rules: string;
  ageGroup: string;
  playerCount: string;
  spaceNeeded: string;
  skillGoal: string;
  type: CoachTrainingGameType;
};

type GamesSnapshot = {
  games: CoachTrainingGame[];
  ratings: CoachTrainingGameRating[];
  favorites: CoachTrainingGameFavorite[];
};

type GameRow = {
  id: string;
  title: string;
  description: string;
  rules: string;
  age_group: string;
  player_count: string;
  space_needed: string;
  skill_goal: string;
  type: CoachTrainingGameType;
  created_by: string;
  created_by_name: string;
  created_at_text: string;
  updated_at_text: string;
};

type RatingRow = {
  id: string;
  game_id: string;
  coach_id: string;
  coach_name: string;
  rating: number;
  created_at_text: string;
};

type FavoriteRow = {
  id: string;
  game_id: string;
  coach_id: string;
  created_at_text: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

const emptySnapshot: GamesSnapshot = { games: [], ratings: [], favorites: [] };
let cached: GamesSnapshot | null = null;
const listeners = new Set<(snapshot: GamesSnapshot) => void>();

export const coachTrainingGameTypeLabels: Record<CoachTrainingGameType, string> = {
  warmup: 'Rozcvička',
  'skill-building': 'Skill-building',
  cooldown: 'Cooldown',
  competition: 'Soutěžní',
};

function emit(snapshot: GamesSnapshot) {
  cached = snapshot;
  for (const listener of listeners) listener(snapshot);
}

function nowText() {
  return new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function normalizeRating(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function parseSnapshot(value: string | null): GamesSnapshot {
  if (!value) return emptySnapshot;

  try {
    const parsed = JSON.parse(value);
    return {
      games: Array.isArray(parsed?.games) ? parsed.games.filter((item: CoachTrainingGame) => typeof item?.id === 'string') : [],
      ratings: Array.isArray(parsed?.ratings) ? parsed.ratings.filter((item: CoachTrainingGameRating) => typeof item?.id === 'string') : [],
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites.filter((item: CoachTrainingGameFavorite) => typeof item?.id === 'string') : [],
    };
  } catch {
    return emptySnapshot;
  }
}

async function loadLocalSnapshot() {
  try {
    return parseSnapshot(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return emptySnapshot;
  }
}

async function saveLocalSnapshot(snapshot: GamesSnapshot) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Local cache is best-effort; Supabase remains the source of truth when available.
  }
}

function gameFromRow(row: GameRow): CoachTrainingGame {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    rules: row.rules,
    ageGroup: row.age_group,
    playerCount: row.player_count,
    spaceNeeded: row.space_needed,
    skillGoal: row.skill_goal,
    type: row.type,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at_text,
    updatedAt: row.updated_at_text,
  };
}

function rowFromGame(game: CoachTrainingGame): GameRow {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    rules: game.rules,
    age_group: game.ageGroup,
    player_count: game.playerCount,
    space_needed: game.spaceNeeded,
    skill_goal: game.skillGoal,
    type: game.type,
    created_by: game.createdBy,
    created_by_name: game.createdByName,
    created_at_text: game.createdAt,
    updated_at_text: game.updatedAt,
  };
}

function ratingFromRow(row: RatingRow): CoachTrainingGameRating {
  return {
    id: row.id,
    gameId: row.game_id,
    coachId: row.coach_id,
    coachName: row.coach_name,
    rating: normalizeRating(Number(row.rating)),
    createdAt: row.created_at_text,
  };
}

function rowFromRating(rating: CoachTrainingGameRating): RatingRow {
  return {
    id: rating.id,
    game_id: rating.gameId,
    coach_id: rating.coachId,
    coach_name: rating.coachName,
    rating: normalizeRating(rating.rating),
    created_at_text: rating.createdAt,
  };
}

function favoriteFromRow(row: FavoriteRow): CoachTrainingGameFavorite {
  return {
    id: row.id,
    gameId: row.game_id,
    coachId: row.coach_id,
    createdAt: row.created_at_text,
  };
}

function rowFromFavorite(favorite: CoachTrainingGameFavorite): FavoriteRow {
  return {
    id: favorite.id,
    game_id: favorite.gameId,
    coach_id: favorite.coachId,
    created_at_text: favorite.createdAt,
  };
}

async function loadCoachName(coachId: string) {
  if (!hasSupabaseConfig || !supabase) return 'Trenér';

  const { data, error } = await supabase
    .from('app_profiles')
    .select('id, name')
    .eq('id', coachId)
    .maybeSingle();

  if (error || !data) return 'Trenér';
  return ((data as ProfileRow).name ?? 'Trenér').trim() || 'Trenér';
}

async function loadSupabaseSnapshot(coachId: string): Promise<GamesSnapshot | null> {
  if (!hasSupabaseConfig || !supabase) return null;

  const [gamesResult, ratingsResult, favoritesResult] = await Promise.all([
    supabase.from('coach_training_games').select('*').order('created_at', { ascending: false }),
    supabase.from('coach_training_game_ratings').select('*'),
    supabase.from('coach_training_game_favorites').select('*').eq('coach_id', coachId),
  ]);

  if (gamesResult.error || ratingsResult.error || favoritesResult.error) return null;

  return {
    games: ((gamesResult.data as GameRow[] | null) ?? []).map(gameFromRow),
    ratings: ((ratingsResult.data as RatingRow[] | null) ?? []).map(ratingFromRow),
    favorites: ((favoritesResult.data as FavoriteRow[] | null) ?? []).map(favoriteFromRow),
  };
}

async function loadSnapshot(coachId: string) {
  const remote = await loadSupabaseSnapshot(coachId);
  if (remote) {
    await saveLocalSnapshot(remote);
    cached = remote;
    return remote;
  }

  const local = await loadLocalSnapshot();
  cached = local;
  return local;
}

function withGameMeta(snapshot: GamesSnapshot, coachId: string): CoachTrainingGameWithMeta[] {
  return snapshot.games.map((game) => {
    const ratings = snapshot.ratings.filter((rating) => rating.gameId === game.id);
    const ratingAverage = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;
    const myRating = ratings.find((rating) => rating.coachId === coachId)?.rating ?? null;
    const isFavorite = snapshot.favorites.some((favorite) => favorite.gameId === game.id && favorite.coachId === coachId);
    return { ...game, ratingAverage, ratingCount: ratings.length, myRating, isFavorite };
  });
}

export function useCoachTrainingGames() {
  const { session, loading } = useAuth();
  const coachId = session?.userId ?? 'coach-demo';
  const [snapshot, setSnapshot] = useState<GamesSnapshot>(cached ?? emptySnapshot);
  const [coachName, setCoachName] = useState('Trenér');
  const [ready, setReady] = useState(cached !== null);
  const [busy, setBusy] = useState(false);

  const refreshGames = useCallback(async () => {
    setBusy(true);
    try {
      const [loadedSnapshot, loadedName] = await Promise.all([loadSnapshot(coachId), loadCoachName(coachId)]);
      setSnapshot(loadedSnapshot);
      setCoachName(loadedName);
      setReady(true);
      return loadedSnapshot;
    } finally {
      setBusy(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (loading) return;

    let mounted = true;
    loadSnapshot(coachId).then(async (loadedSnapshot) => {
      const loadedName = await loadCoachName(coachId);
      if (!mounted) return;
      setSnapshot(loadedSnapshot);
      setCoachName(loadedName);
      setReady(true);
    });

    const listener = (nextSnapshot: GamesSnapshot) => setSnapshot(nextSnapshot);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, [coachId, loading]);

  const games = useMemo(() => withGameMeta(snapshot, coachId), [snapshot, coachId]);

  const createGame = useCallback(async (input: SaveCoachTrainingGameInput) => {
    const timestamp = nowText();
    const game: CoachTrainingGame = {
      id: `game-${coachId}-${Date.now()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      rules: input.rules.trim(),
      ageGroup: input.ageGroup.trim(),
      playerCount: input.playerCount.trim(),
      spaceNeeded: input.spaceNeeded.trim(),
      skillGoal: input.skillGoal.trim(),
      type: input.type,
      createdBy: coachId,
      createdByName: coachName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextSnapshot = { ...snapshot, games: [game, ...snapshot.games.filter((item) => item.id !== game.id)] };

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('coach_training_games').insert(rowFromGame(game));
      if (error) await saveLocalSnapshot(nextSnapshot);
    } else {
      await saveLocalSnapshot(nextSnapshot);
    }

    emit(nextSnapshot);
    return game;
  }, [coachId, coachName, snapshot]);

  const rateGame = useCallback(async (gameId: string, value: number) => {
    const rating: CoachTrainingGameRating = {
      id: `game-rating-${gameId}-${coachId}`,
      gameId,
      coachId,
      coachName,
      rating: normalizeRating(value),
      createdAt: nowText(),
    };
    const nextSnapshot = {
      ...snapshot,
      ratings: [rating, ...snapshot.ratings.filter((item) => !(item.gameId === gameId && item.coachId === coachId))],
    };

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('coach_training_game_ratings').upsert(rowFromRating(rating), { onConflict: 'game_id,coach_id' });
      if (error) await saveLocalSnapshot(nextSnapshot);
    } else {
      await saveLocalSnapshot(nextSnapshot);
    }

    emit(nextSnapshot);
    return rating;
  }, [coachId, coachName, snapshot]);

  const toggleFavorite = useCallback(async (gameId: string) => {
    const existing = snapshot.favorites.find((item) => item.gameId === gameId && item.coachId === coachId);
    const nextSnapshot = existing
      ? { ...snapshot, favorites: snapshot.favorites.filter((item) => item.id !== existing.id) }
      : {
          ...snapshot,
          favorites: [{ id: `game-favorite-${gameId}-${coachId}`, gameId, coachId, createdAt: nowText() }, ...snapshot.favorites],
        };

    if (hasSupabaseConfig && supabase) {
      const { error } = existing
        ? await supabase.from('coach_training_game_favorites').delete().eq('id', existing.id).eq('coach_id', coachId)
        : await supabase.from('coach_training_game_favorites').insert(rowFromFavorite(nextSnapshot.favorites[0]));
      if (error) await saveLocalSnapshot(nextSnapshot);
    } else {
      await saveLocalSnapshot(nextSnapshot);
    }

    emit(nextSnapshot);
    return !existing;
  }, [coachId, snapshot]);

  return {
    games,
    ready,
    busy,
    coachId,
    coachName,
    createGame,
    rateGame,
    refreshGames,
    toggleFavorite,
  };
}