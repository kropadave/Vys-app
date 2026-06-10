-- Add structured metadata fields to training_spots
-- - spot_type: closed enum (chosen from dropdown) to prevent free-text junk
-- - environment: outdoor | indoor | both
-- - opening_hours: optional human-readable hours

ALTER TABLE training_spots
  ADD COLUMN IF NOT EXISTS spot_type      TEXT
    CHECK (spot_type IS NULL OR spot_type IN (
      'gym', 'parkour_park', 'skatepark', 'playground',
      'foam_pit_hall', 'trampoline_park', 'workout_park', 'other'
    )),
  ADD COLUMN IF NOT EXISTS environment    TEXT
    CHECK (environment IS NULL OR environment IN ('outdoor', 'indoor', 'both')),
  ADD COLUMN IF NOT EXISTS opening_hours  TEXT;

-- Restrict spot creation to coaches and admins. Children (participants) must NOT
-- create spots — they can still leave reviews via the existing spot_reviews policy.
DROP POLICY IF EXISTS "spots_insert" ON training_spots;
CREATE POLICY "spots_insert" ON training_spots
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = added_by
    AND EXISTS (
      SELECT 1 FROM app_profiles p
      WHERE p.id::uuid = auth.uid()
        AND p.role IN ('coach', 'admin')
    )
  );

-- Allow the original author (coach) to update their own spot's metadata.
DROP POLICY IF EXISTS "spots_update_own" ON training_spots;
CREATE POLICY "spots_update_own" ON training_spots
  FOR UPDATE TO authenticated
  USING (auth.uid() = added_by)
  WITH CHECK (auth.uid() = added_by);
