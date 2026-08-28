-- ============================================================================
-- QHRT Therapeutic Engine Schema v1.0
-- Universal Therapeutic Engine — Phases, Engines, Modular Content, Observations
-- Run this entire script in Supabase SQL Editor after 001–004
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: Admin check (reused across policies)
-- Admin check: EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
-- ----------------------------------------------------------------------------

-- ============================================================================
-- 1. phase_templates
-- Admin-manageable templates for the 8 universal phases
-- Defines default phase_key, name, description, client_script, practitioner_protocol
-- New engine instances are initialized from these templates
-- (No dependencies on other new tables)
-- ============================================================================
CREATE TABLE IF NOT EXISTS phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_order INT NOT NULL CHECK (phase_order >= 1 AND phase_order <= 8),
  phase_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  client_script TEXT,
  practitioner_protocol TEXT,
  transition_rule_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE phase_templates ENABLE ROW LEVEL SECURITY;

-- Admin full access only (phase templates are configuration)
CREATE POLICY "Admin full access on phase_templates"
  ON phase_templates FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Authenticated users can view active templates
CREATE POLICY "Authenticated can view active phase_templates"
  ON phase_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 2. functional_domain_protocols
-- Modular domain content (Body Composition, Pain, Energy, etc.)
-- Each protocol contains delivery content keyed by phase for client-facing prompts
-- (No dependencies on other new tables)
-- ============================================================================
CREATE TABLE IF NOT EXISTS functional_domain_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  delivery_content JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE functional_domain_protocols ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on functional_domain_protocols"
  ON functional_domain_protocols FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Authenticated users can view active protocols
CREATE POLICY "Authenticated can view active functional_domain_protocols"
  ON functional_domain_protocols FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 3. archetypal_emotional_energetics
-- AEE catalog — each entry contains resolution prompts for Phase 2
-- (No dependencies on other new tables)
-- ============================================================================
CREATE TABLE IF NOT EXISTS archetypal_emotional_energetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  resolution_prompts JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE archetypal_emotional_energetics ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on archetypal_emotional_energetics"
  ON archetypal_emotional_energetics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Authenticated users can view active AEEs
CREATE POLICY "Authenticated can view active archetypal_emotional_energetics"
  ON archetypal_emotional_energetics FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 4. personal_implementation_programs
-- Personal implementation content linked to a Functional Domain
-- (Depends on: functional_domain_protocols)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_implementation_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  functional_domain_id UUID REFERENCES functional_domain_protocols(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  delivery_content JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE personal_implementation_programs ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on personal_implementation_programs"
  ON personal_implementation_programs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Authenticated users can view active programs
CREATE POLICY "Authenticated can view active personal_implementation_programs"
  ON personal_implementation_programs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 5. therapeutic_engines
-- Top-level engine instances linking a conversation to modular content objects
-- (Depends on: functional_domain_protocols, archetypal_emotional_energetics, personal_implementation_programs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS therapeutic_engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  functional_domain_protocol_id UUID REFERENCES functional_domain_protocols(id) ON DELETE SET NULL,
  aee_id UUID REFERENCES archetypal_emotional_energetics(id) ON DELETE SET NULL,
  personal_program_id UUID REFERENCES personal_implementation_programs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized', 'running', 'paused', 'completed')),
  current_phase_order INT NOT NULL DEFAULT 1,
  observations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE therapeutic_engines ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on therapeutic_engines"
  ON therapeutic_engines FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Users can view and manage their own engines
CREATE POLICY "Users can view own therapeutic_engines"
  ON therapeutic_engines FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own therapeutic_engines"
  ON therapeutic_engines FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. therapeutic_phases
-- The 8 configurable phases of the Universal Therapeutic Engine
-- Each engine instance gets its own set of phase rows tracking status
-- (Depends on: therapeutic_engines)
-- ============================================================================
CREATE TABLE IF NOT EXISTS therapeutic_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id UUID NOT NULL REFERENCES therapeutic_engines(id) ON DELETE CASCADE,
  phase_order INT NOT NULL CHECK (phase_order >= 1 AND phase_order <= 8),
  phase_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'completed', 'requires_attention', 'skipped_by_rule')),
  client_script TEXT,
  practitioner_protocol TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(engine_id, phase_order)
);

ALTER TABLE therapeutic_phases ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on therapeutic_phases"
  ON therapeutic_phases FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Users can view and manage phases for their own engines
CREATE POLICY "Users can view own therapeutic_phases"
  ON therapeutic_phases FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = therapeutic_phases.engine_id AND therapeutic_engines.user_id = auth.uid()));

CREATE POLICY "Users can manage own therapeutic_phases"
  ON therapeutic_phases FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = therapeutic_phases.engine_id AND therapeutic_engines.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = therapeutic_phases.engine_id AND therapeutic_engines.user_id = auth.uid()));

-- ============================================================================
-- 7. phase_observations
-- Structured observation capture per phase at session completion
-- (Depends on: therapeutic_engines)
-- ============================================================================
CREATE TABLE IF NOT EXISTS phase_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapeutic_engine_id UUID NOT NULL REFERENCES therapeutic_engines(id) ON DELETE CASCADE,
  phase_order INT NOT NULL CHECK (phase_order >= 1 AND phase_order <= 8),
  immediate_expression_change TEXT,
  implementation_status TEXT,
  remaining_organizational_uncertainty TEXT,
  another_cycle_required BOOLEAN DEFAULT false,
  domain_specific_observations TEXT,
  client_reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(therapeutic_engine_id, phase_order)
);

ALTER TABLE phase_observations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on phase_observations"
  ON phase_observations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Users can view and manage observations for their own engines
CREATE POLICY "Users can view own phase_observations"
  ON phase_observations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = phase_observations.therapeutic_engine_id AND therapeutic_engines.user_id = auth.uid()));

CREATE POLICY "Users can manage own phase_observations"
  ON phase_observations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = phase_observations.therapeutic_engine_id AND therapeutic_engines.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM therapeutic_engines WHERE therapeutic_engines.id = phase_observations.therapeutic_engine_id AND therapeutic_engines.user_id = auth.uid()));
