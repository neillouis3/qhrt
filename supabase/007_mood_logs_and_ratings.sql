-- ============================================================================
-- QHRT Mood Logs & Session Ratings — schema + RLS
--
-- These two tables are read by app/api/admin/analytics and app/api/admin/stats
-- but were previously created only in the live DB with no schema or RLS in the
-- repo. This migration makes them reproducible and enforces RLS so that:
--   - a user can only read/write their own rows (auth.uid() = user_id)
--   - admins get full access (service-role bypasses RLS anyway)
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS before CREATE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. mood_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score  SMALLINT NOT NULL,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON public.mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_logged_at ON public.mood_logs(logged_at);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood logs" ON public.mood_logs;
CREATE POLICY "Users can view their own mood logs"
  ON public.mood_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mood logs" ON public.mood_logs;
CREATE POLICY "Users can insert their own mood logs"
  ON public.mood_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mood logs" ON public.mood_logs;
CREATE POLICY "Users can delete their own mood logs"
  ON public.mood_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. session_ratings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_ratings_user_id ON public.session_ratings(user_id);

ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own session ratings" ON public.session_ratings;
CREATE POLICY "Users can view their own session ratings"
  ON public.session_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own session ratings" ON public.session_ratings;
CREATE POLICY "Users can insert their own session ratings"
  ON public.session_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own session ratings" ON public.session_ratings;
CREATE POLICY "Users can delete their own session ratings"
  ON public.session_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
