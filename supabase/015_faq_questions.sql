-- ============================================================================
-- Questions visitors send from /faq when the listed answers are not enough
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.faq_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  question    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_questions_created
  ON public.faq_questions (created_at DESC);

ALTER TABLE public.faq_questions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.faq_questions TO service_role;
