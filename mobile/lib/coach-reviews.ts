export type CoachReview = {
  id: string;
  coachId: string;
  coachName: string;
  parentId: string;
  parentName: string;
  participantName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewableCoach = {
  id: string;
  name: string;
  locations: string[];
};

export type CoachReviewStats = {
  count: number;
  average: number;
  label: string;
};

export const reviewableCoaches: ReviewableCoach[] = [];

export const seedCoachReviews: CoachReview[] = [];

export function clampCoachRating(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function reviewsForCoach(reviews: CoachReview[], coachId: string) {
  return reviews.filter((review) => review.coachId === coachId);
}

export function coachReviewStats(reviews: CoachReview[]): CoachReviewStats {
  if (reviews.length === 0) return { count: 0, average: 0, label: 'Zatím bez hodnocení' };

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return {
    count: reviews.length,
    average,
    label: `${average.toFixed(1).replace('.', ',')} / 5`,
  };
}

export function mergeReviews(primary: CoachReview[], fallback: CoachReview[]) {
  const ids = new Set(primary.map((review) => review.id));
  return [...primary, ...fallback.filter((review) => !ids.has(review.id))];
}
