export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Condition {
  id: string;
  category_id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Symptom {
  id: string;
  condition_id: string;
  symptom_name: string;
  display_order: number;
  is_active: boolean;
}

export interface AssessmentQuestion {
  id: string;
  condition_id: string;
  question_text: string;
  scale_type: string;
  minimum_value: number;
  maximum_value: number;
  display_order: number;
  is_active: boolean;
}

export interface ProgressMetric {
  id: string;
  condition_id: string;
  metric_name: string;
  metric_description: string | null;
  scale_type: string;
  minimum_value: number;
  maximum_value: number;
  display_order: number;
  is_active: boolean;
}

export interface QHRTMapping {
  id: string;
  condition_id: string;
  primary_emotional_theme: string | null;
  secondary_emotional_theme: string | null;
  organ_system: string | null;
  gland_system: string | null;
  qhrt_focus: string | null;
  internal_notes: string | null;
}

export interface SessionAssignment {
  id: string;
  condition_id: string;
  session_id: string;
  session_number: number;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
}

export interface KnowledgeModel {
  id: string;
  name: string;
  description: string | null;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface Prompt {
  id: string;
  knowledge_model_id: string;
  evidence_dimension_id: string | null;
  prompt_key: string;
  prompt_text: string;
  response_type: string;
  display_order: number;
  is_active: boolean;
}

export interface BranchRule {
  id: string;
  prompt_id: string;
  condition_expression: any;
  target_prompt_id: string;
  priority: number;
  is_active: boolean;
}

export interface EvidenceDimension {
  id: string;
  knowledge_model_id: string;
  name: string;
  description: string | null;
  priority: number;
  is_required: boolean;
  is_active: boolean;
}

export interface CompletionRule {
  id: string;
  evidence_dimension_id: string;
  rule_expression: any;
  is_active: boolean;
}

export type TabKey = 'assessment-builder' | 'workbooks' | 'modules';
