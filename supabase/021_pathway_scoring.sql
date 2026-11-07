-- Pathway Scoring Rules v1.0.
-- Each completed Program Readiness attempt is its own row.
-- A later attempt increments assessment_sequence and leaves earlier rows unchanged.
-- Scores stay on these tables. Participant pages do not read them.

CREATE TABLE IF NOT EXISTS public.readiness_attempts (
  assessment_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  questionnaire_id           UUID REFERENCES public.assessments (id) ON DELETE SET NULL,
  assessment_sequence        INTEGER NOT NULL,
  questionnaire_version      TEXT NOT NULL,
  scoring_rule_version       TEXT NOT NULL,
  assessment_status          TEXT NOT NULL CHECK (
                               assessment_status IN (
                                 'NOT_STARTED',
                                 'IN_PROGRESS',
                                 'PAUSED',
                                 'COMPLETED',
                                 'EXITED_IMMEDIATE_ASSISTANCE'
                               )
                             ),
  started_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_saved_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at               TIMESTAMPTZ,
  resume_page                TEXT,
  answers                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  immediate_readiness_override BOOLEAN,
  preparation_flag           BOOLEAN,
  critical_zero_count        INTEGER,
  critical_one_count         INTEGER,
  critical_gate_passed       BOOLEAN,
  domain_1_score             INTEGER,
  domain_1_percentage        DOUBLE PRECISION,
  domain_1_classification    TEXT,
  domain_2_score             INTEGER,
  domain_2_percentage        DOUBLE PRECISION,
  domain_2_classification    TEXT,
  domain_3_score             INTEGER,
  domain_3_percentage        DOUBLE PRECISION,
  domain_3_classification    TEXT,
  domain_4_score             INTEGER,
  domain_4_percentage        DOUBLE PRECISION,
  domain_4_classification    TEXT,
  domain_5_score             INTEGER,
  domain_5_percentage        DOUBLE PRECISION,
  domain_5_classification    TEXT,
  domain_6_score             INTEGER,
  domain_6_percentage        DOUBLE PRECISION,
  domain_6_classification    TEXT,
  overall_score              DOUBLE PRECISION,
  recommended_pathway        TEXT,
  final_rule_trigger         TEXT,
  reassessment_required      BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, assessment_sequence)
);

CREATE TABLE IF NOT EXISTS public.readiness_responses (
  response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       UUID NOT NULL REFERENCES public.readiness_attempts (assessment_id) ON DELETE CASCADE,
  question_id         TEXT NOT NULL,
  question_code       TEXT NOT NULL,
  question_text       TEXT NOT NULL,
  response_value      TEXT NOT NULL,
  numeric_score       INTEGER,
  is_required         BOOLEAN NOT NULL,
  is_critical         BOOLEAN NOT NULL,
  domain_membership   INTEGER[] NOT NULL DEFAULT '{}',
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.readiness_scoring_rules (
  scoring_rule_version              TEXT PRIMARY KEY,
  effective_date                    DATE NOT NULL,
  status                            TEXT NOT NULL,
  domain_ready_threshold            NUMERIC NOT NULL,
  domain_preparation_threshold      NUMERIC NOT NULL,
  overall_self_directed_threshold   NUMERIC NOT NULL,
  overall_preparation_threshold     NUMERIC NOT NULL,
  critical_minimum_score            NUMERIC NOT NULL
);

INSERT INTO public.readiness_scoring_rules (
  scoring_rule_version,
  effective_date,
  status,
  domain_ready_threshold,
  domain_preparation_threshold,
  overall_self_directed_threshold,
  overall_preparation_threshold,
  critical_minimum_score
) VALUES (
  '1.0',
  DATE '2026-11-01',
  'published',
  80,
  60,
  80,
  60,
  2
)
ON CONFLICT (scoring_rule_version) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_readiness_attempts_user
  ON public.readiness_attempts (user_id, assessment_sequence DESC);

ALTER TABLE public.readiness_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_scoring_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view readiness attempts" ON public.readiness_attempts;
CREATE POLICY "Admin can view readiness attempts"
  ON public.readiness_attempts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin can view readiness responses" ON public.readiness_responses;
CREATE POLICY "Admin can view readiness responses"
  ON public.readiness_responses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

GRANT ALL ON public.readiness_attempts TO service_role;
GRANT ALL ON public.readiness_responses TO service_role;
GRANT ALL ON public.readiness_scoring_rules TO service_role;
