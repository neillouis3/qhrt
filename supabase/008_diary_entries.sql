-- ============================================================================
-- QHRT Diary — personal notes keyed to a calendar day
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS before CREATE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.diary_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date  DATE NOT NULL,
  title       TEXT,
  body        TEXT NOT NULL,
  mood        SMALLINT CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date
  ON public.diary_entries (user_id, entry_date DESC);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can view their own diary entries"
  ON public.diary_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can insert their own diary entries"
  ON public.diary_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can update their own diary entries"
  ON public.diary_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can delete their own diary entries"
  ON public.diary_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;
