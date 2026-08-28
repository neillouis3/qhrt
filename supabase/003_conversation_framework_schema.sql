-- ============================================================================
-- QHRT Conversation Framework Schema v1.0
-- Generic Conversation Engine — Knowledge Models, Prompts, Evidence
-- Run this entire script in Supabase SQL Editor after 001 and 002
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: Admin check (reused across policies)
-- Admin check: EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
-- ----------------------------------------------------------------------------

-- ============================================================================
-- 1. knowledge_models
-- Top-level Knowledge Model definitions (Sleep, Pain, Energy, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_models ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on knowledge_models" ON knowledge_models;
CREATE POLICY "Admin full access on knowledge_models"
  ON knowledge_models FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view active knowledge_models" ON knowledge_models;
CREATE POLICY "Authenticated can view active knowledge_models"
  ON knowledge_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 2. evidence_dimensions
-- Dimensions a Knowledge Model tracks (e.g., "Sleep Initiation", "Sleep Maintenance")
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_model_id UUID NOT NULL REFERENCES knowledge_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE evidence_dimensions ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on evidence_dimensions" ON evidence_dimensions;
CREATE POLICY "Admin full access on evidence_dimensions"
  ON evidence_dimensions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view active evidence_dimensions" ON evidence_dimensions;
CREATE POLICY "Authenticated can view active evidence_dimensions"
  ON evidence_dimensions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 3. prompts
-- Individual prompts displayed to the user during a conversation
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_model_id UUID NOT NULL REFERENCES knowledge_models(id) ON DELETE CASCADE,
  evidence_dimension_id UUID REFERENCES evidence_dimensions(id) ON DELETE SET NULL,
  prompt_key TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'free_text',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(knowledge_model_id, prompt_key)
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on prompts" ON prompts;
CREATE POLICY "Admin full access on prompts"
  ON prompts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view active prompts" ON prompts;
CREATE POLICY "Authenticated can view active prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 4. prompt_response_options
-- Possible responses for non-free-text prompts
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_response_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  option_value TEXT NOT NULL,
  metadata JSONB,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prompt_response_options ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on prompt_response_options" ON prompt_response_options;
CREATE POLICY "Admin full access on prompt_response_options"
  ON prompt_response_options FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view prompt_response_options" ON prompt_response_options;
CREATE POLICY "Authenticated can view prompt_response_options"
  ON prompt_response_options FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM prompts WHERE prompts.id = prompt_response_options.prompt_id AND prompts.is_active = true));

-- ============================================================================
-- 5. branch_rules
-- Conditional navigation rules evaluated after each response
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  condition_expression JSONB NOT NULL,
  target_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE branch_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on branch_rules" ON branch_rules;
CREATE POLICY "Admin full access on branch_rules"
  ON branch_rules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view active branch_rules" ON branch_rules;
CREATE POLICY "Authenticated can view active branch_rules"
  ON branch_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 6. completion_rules
-- Rules that determine when an Evidence Dimension is complete
-- ============================================================================
CREATE TABLE IF NOT EXISTS completion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_dimension_id UUID NOT NULL REFERENCES evidence_dimensions(id) ON DELETE CASCADE,
  rule_expression JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE completion_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on completion_rules" ON completion_rules;
CREATE POLICY "Admin full access on completion_rules"
  ON completion_rules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view active completion_rules" ON completion_rules;
CREATE POLICY "Authenticated can view active completion_rules"
  ON completion_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 7. evidence_fields
-- Maps prompt responses to evidence fields for structured storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  evidence_dimension_id UUID REFERENCES evidence_dimensions(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  mapping_expression JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure evidence_dimension_id is nullable (in case table was created before this fix)
ALTER TABLE evidence_fields ALTER COLUMN evidence_dimension_id DROP NOT NULL;

ALTER TABLE evidence_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on evidence_fields" ON evidence_fields;
CREATE POLICY "Admin full access on evidence_fields"
  ON evidence_fields FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Authenticated can view evidence_fields" ON evidence_fields;
CREATE POLICY "Authenticated can view evidence_fields"
  ON evidence_fields FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM prompts WHERE prompts.id = evidence_fields.prompt_id AND prompts.is_active = true));

-- ============================================================================
-- 8. conversations
-- A user's conversation session instance
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_model_id UUID NOT NULL REFERENCES knowledge_models(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on conversations" ON conversations;
CREATE POLICY "Admin full access on conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Users can access own conversations" ON conversations;
CREATE POLICY "Users can access own conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 9. conversation_responses
-- Individual immutable user responses within a conversation
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE RESTRICT,
  response_value TEXT NOT NULL,
  response_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversation_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on conversation_responses" ON conversation_responses;
CREATE POLICY "Admin full access on conversation_responses"
  ON conversation_responses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Users can access responses from own conversations" ON conversation_responses;
CREATE POLICY "Users can access responses from own conversations"
  ON conversation_responses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_responses.conversation_id AND conversations.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_responses.conversation_id AND conversations.user_id = auth.uid()));

-- ============================================================================
-- 10. evidence_records
-- Evidence derived from conversation responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  conversation_response_id UUID NOT NULL REFERENCES conversation_responses(id) ON DELETE CASCADE,
  evidence_dimension_id UUID NOT NULL REFERENCES evidence_dimensions(id) ON DELETE RESTRICT,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'raw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;

DROP POLICY "Admin full access on evidence_records" ON evidence_records;
CREATE POLICY "Admin full access on evidence_records"
  ON evidence_records FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY "Users can access evidence from own conversations" ON evidence_records;
CREATE POLICY "Users can access evidence from own conversations"
  ON evidence_records FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = evidence_records.conversation_id AND conversations.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = evidence_records.conversation_id AND conversations.user_id = auth.uid()));

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_evidence_dimensions_knowledge_model ON evidence_dimensions(knowledge_model_id);
CREATE INDEX IF NOT EXISTS idx_prompts_knowledge_model ON prompts(knowledge_model_id);
CREATE INDEX IF NOT EXISTS idx_prompts_evidence_dimension ON prompts(evidence_dimension_id);
CREATE INDEX IF NOT EXISTS idx_prompt_response_options_prompt ON prompt_response_options(prompt_id);
CREATE INDEX IF NOT EXISTS idx_branch_rules_prompt ON branch_rules(prompt_id);
CREATE INDEX IF NOT EXISTS idx_completion_rules_dimension ON completion_rules(evidence_dimension_id);
CREATE INDEX IF NOT EXISTS idx_evidence_fields_prompt ON evidence_fields(prompt_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_knowledge_model ON conversations(knowledge_model_id);
CREATE INDEX IF NOT EXISTS idx_conversation_responses_conversation ON conversation_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_records_conversation ON evidence_records(conversation_id);
