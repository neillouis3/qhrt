-- ============================================================================
-- Program Readiness & Suitability Check (pre-account), attached on signup
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.readiness_checks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  pathway              TEXT NOT NULL CHECK (
                         pathway IN ('self_directed', 'preparation', 'additional_time')
                       ),
  preparation_review   BOOLEAN NOT NULL DEFAULT false,
  safety               JSONB NOT NULL DEFAULT '{}'::jsonb,
  independence         JSONB NOT NULL DEFAULT '{}'::jsonb,
  suitability          JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_checks_pathway
  ON public.readiness_checks (pathway);

ALTER TABLE public.readiness_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own readiness check" ON public.readiness_checks;
CREATE POLICY "Users can view their own readiness check"
  ON public.readiness_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT ALL ON public.readiness_checks TO service_role;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS readiness_pathway TEXT,
  ADD COLUMN IF NOT EXISTS readiness_at TIMESTAMPTZ;
