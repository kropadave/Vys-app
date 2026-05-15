import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { clampCoachRating, mergeReviews, seedCoachReviews, type CoachReview } from '@/lib/coach-reviews';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.coachReviews';

type CoachReviewRow = {
  id: string;
  coach_id: string;
  coach_name: string;
  parent_id: string;
  parent_name: string;
  participant_name: string;
  rating: number;
  comment: string;
  created_at_text: string;
};

type SaveCoachReviewInput = {
  coachId: string;
  coachName: string;
  parentId: string;
  parentName: string;
  participantName: string;
  rating: number;
  comment: string;
};

let cached: CoachReview[] | null = null;
const listeners = new Set<(reviews: CoachReview[]) => void>();

function emit(reviews: CoachReview[]) {
  cached = reviews;
  for (const listener of listeners) listener(reviews);
}

function nowText() {
  return new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parseReviews(value: string | null): CoachReview[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is CoachReview => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

function reviewFromRow(row: CoachReviewRow): CoachReview {
  return {
    id: row.id,
    coachId: row.coach_id,
    coachName: row.coach_name,
    parentId: row.parent_id,
    parentName: row.parent_name,
    participantName: row.participant_name,
    rating: clampCoachRating(Number(row.rating)),
    comment: row.comment,
    createdAt: row.created_at_text,
  };
}

function rowFromReview(review: CoachReview): CoachReviewRow {
  return {
    id: review.id,
    coach_id: review.coachId,
    coach_name: review.coachName,
    parent_id: review.parentId,
    parent_name: review.parentName,
    participant_name: review.participantName,
    rating: clampCoachRating(review.rating),
    comment: review.comment,
    created_at_text: review.createdAt,
  };
}

async function loadLocalReviews() {
  try {
    return parseReviews(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

async function saveLocalReviews(reviews: CoachReview[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Local persistence is best-effort in the prototype.
  }
}

async function loadCoachReviews() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('coach_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const reviews = (data as CoachReviewRow[]).map(reviewFromRow);
      cached = reviews;
      return reviews;
    }
  }

  const localReviews = await loadLocalReviews();
  const reviews = mergeReviews(localReviews, seedCoachReviews);
  cached = reviews;
  return reviews;
}

export function useCoachReviews() {
  const [reviews, setReviews] = useState<CoachReview[]>(cached ?? seedCoachReviews);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadCoachReviews().then((loadedReviews) => {
        if (!mounted) return;
        setReviews(loadedReviews);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextReviews: CoachReview[]) => setReviews(nextReviews);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const saveCoachReview = async (input: SaveCoachReviewInput) => {
    const review: CoachReview = {
      ...input,
      id: `review-${input.parentId}-${input.coachId}`,
      rating: clampCoachRating(input.rating),
      comment: input.comment.trim(),
      createdAt: nowText(),
    };
    const nextReviews = [review, ...reviews.filter((item) => item.id !== review.id)];

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('coach_reviews').upsert(rowFromReview(review), { onConflict: 'id' });
      if (error) await saveLocalReviews(nextReviews);
    } else {
      await saveLocalReviews(nextReviews);
    }

    emit(nextReviews);
    return review;
  };

  return { reviews, ready, saveCoachReview };
}
