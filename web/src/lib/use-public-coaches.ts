'use client';

import { useEffect, useState } from 'react';

import { loadPublicCoaches, type PublicCoachSummary } from '@/lib/api-client';

export type { PublicCoachSummary };

export function usePublicCoaches() {
  const [coaches, setCoaches] = useState<PublicCoachSummary[]>([]);

  useEffect(() => {
    loadPublicCoaches()
      .then((data) => setCoaches(data))
      .catch(() => { /* Silently fail — coaches section just stays empty */ });
  }, []);

  function coachesForIds(ids: string[]): PublicCoachSummary[] {
    return ids.flatMap((id) => {
      const coach = coaches.find((c) => c.id === id);
      return coach ? [coach] : [];
    });
  }

  return { coaches, coachesForIds };
}
