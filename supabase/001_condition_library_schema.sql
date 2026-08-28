-- ============================================================================
-- QHRT Condition Library Schema v1.0
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. condition_categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE condition_categories ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (server-side client bypasses RLS anyway)
CREATE POLICY "Admin full access on condition_categories"
  ON condition_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Public read for active categories (used by frontend browsing)
CREATE POLICY "Public can view active condition_categories"
  ON condition_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 2. conditions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES condition_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on conditions"
  ON conditions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Public can view active conditions"
  ON conditions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 3. qhrt_mappings (backend-only, not exposed to public APIs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qhrt_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  primary_emotional_theme TEXT,
  secondary_emotional_theme TEXT,
  organ_system TEXT,
  gland_system TEXT,
  qhrt_focus TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condition_id)
);

ALTER TABLE qhrt_mappings ENABLE ROW LEVEL SECURITY;

-- Admin-only access — no public read policy intentionally
CREATE POLICY "Admin full access on qhrt_mappings"
  ON qhrt_mappings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 4. condition_symptoms
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condition_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  symptom_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE condition_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on condition_symptoms"
  ON condition_symptoms FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Public can view active condition_symptoms"
  ON condition_symptoms FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 5. assessment_questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  scale_type TEXT NOT NULL DEFAULT '0-10',
  minimum_value INT NOT NULL DEFAULT 0,
  maximum_value INT NOT NULL DEFAULT 10,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on assessment_questions"
  ON assessment_questions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Public can view active assessment_questions"
  ON assessment_questions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 6. progress_metrics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_description TEXT,
  scale_type TEXT NOT NULL DEFAULT '0-10',
  minimum_value INT NOT NULL DEFAULT 0,
  maximum_value INT NOT NULL DEFAULT 10,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on progress_metrics"
  ON progress_metrics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Public can view active progress_metrics"
  ON progress_metrics FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 7. condition_session_assignments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condition_session_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  session_number INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE condition_session_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on condition_session_assignments"
  ON condition_session_assignments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 8. user_selected_conditions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_selected_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  date_selected TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchase_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, condition_id)
);

ALTER TABLE user_selected_conditions ENABLE ROW LEVEL SECURITY;

-- Users can view their own selections
CREATE POLICY "Users can view own selected conditions"
  ON user_selected_conditions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own selections
CREATE POLICY "Users can insert own selected conditions"
  ON user_selected_conditions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own selections
CREATE POLICY "Users can update own selected conditions"
  ON user_selected_conditions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own selections
CREATE POLICY "Users can delete own selected conditions"
  ON user_selected_conditions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full access on user_selected_conditions"
  ON user_selected_conditions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 9. assessment_results (for Phase 6 - storing user assessment scores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  answer_value INT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view own assessment results"
  ON assessment_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own results
CREATE POLICY "Users can insert own assessment results"
  ON assessment_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full access on assessment_results"
  ON assessment_results FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- Indexes for performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conditions_category_id ON conditions(category_id);
CREATE INDEX IF NOT EXISTS idx_condition_symptoms_condition_id ON condition_symptoms(condition_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_condition_id ON assessment_questions(condition_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_condition_id ON progress_metrics(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_session_assignments_condition_id ON condition_session_assignments(condition_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_conditions_user_id ON user_selected_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_condition_id ON assessment_results(condition_id);
