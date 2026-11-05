-- ============================================================================
-- Pathway before a session: store allow-sessions + acknowledgement on progress.
-- Also stamp allowSessions on existing program-readiness outcomes if missing.
-- ============================================================================

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS readiness_allow_sessions BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS readiness_ack_at TIMESTAMPTZ;

UPDATE public.assessments
SET outcomes = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN o ? 'allowSessions' THEN o
        WHEN o->>'key' IN ('additional_time', 'immediate') THEN o || '{"allowSessions": false}'::jsonb
        ELSE o || '{"allowSessions": true}'::jsonb
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(outcomes) AS o
)
WHERE slug = 'program-readiness';

UPDATE public.user_progress
SET readiness_allow_sessions = false
WHERE readiness_pathway IN ('additional_time', 'immediate');
