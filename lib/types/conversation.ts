// ============================================================================
// QHRT Conversation Framework — Shared TypeScript Interfaces
// ============================================================================

// ----------------------------------------------------------------------------
// Knowledge Model
// ----------------------------------------------------------------------------
export interface KnowledgeModel {
  id: string;
  name: string;
  description: string | null;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Evidence Dimension
// ----------------------------------------------------------------------------
export interface EvidenceDimension {
  id: string;
  knowledge_model_id: string;
  name: string;
  description: string | null;
  priority: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Prompt
// ----------------------------------------------------------------------------
export type ResponseType = 'free_text' | 'single_choice' | 'multiple_choice' | 'scale';

export interface Prompt {
  id: string;
  knowledge_model_id: string;
  evidence_dimension_id: string | null;
  prompt_key: string;
  prompt_text: string;
  response_type: ResponseType;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Prompt Response Option
// ----------------------------------------------------------------------------
export interface PromptResponseOption {
  id: string;
  prompt_id: string;
  option_label: string;
  option_value: string;
  metadata: Record<string, unknown> | null;
  display_order: number;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Branch Rule
// ----------------------------------------------------------------------------
export interface BranchRule {
  id: string;
  prompt_id: string;
  condition_expression: ConditionExpression;
  target_prompt_id: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConditionExpression {
  response_value: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  values?: string[];
}

// ----------------------------------------------------------------------------
// Completion Rule
// ----------------------------------------------------------------------------
export interface CompletionRule {
  id: string;
  evidence_dimension_id: string;
  rule_expression: RuleExpression;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RuleExpression {
  required_prompt_keys: string[];
}

// ----------------------------------------------------------------------------
// Evidence Field
// ----------------------------------------------------------------------------
export interface EvidenceField {
  id: string;
  prompt_id: string;
  evidence_dimension_id: string;
  field_name: string;
  field_type: string;
  mapping_expression: Record<string, unknown> | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Conversation
// ----------------------------------------------------------------------------
export type ConversationStatus = 'active' | 'completed' | 'paused';

export interface Conversation {
  id: string;
  user_id: string;
  knowledge_model_id: string;
  status: ConversationStatus;
  current_prompt_id: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Conversation Response
// ----------------------------------------------------------------------------
export interface ConversationResponse {
  id: string;
  conversation_id: string;
  prompt_id: string;
  response_value: string;
  response_metadata: Record<string, unknown> | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Evidence Record
// ----------------------------------------------------------------------------
export type EvidenceType = 'raw' | 'derived';

export interface EvidenceRecord {
  id: string;
  conversation_id: string;
  conversation_response_id: string;
  evidence_dimension_id: string;
  field_name: string;
  field_value: string;
  evidence_type: EvidenceType;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Knowledge Model (Full — with nested data)
// ----------------------------------------------------------------------------
export interface KnowledgeModelFull {
  /** The model row itself. `null` when only the nested data is loaded (see loadKnowledgeModel). */
  model: KnowledgeModel | null;
  dimensions: EvidenceDimension[];
  prompts: Prompt[];
  responseOptions: Map<string, PromptResponseOption[]>; // keyed by prompt_id
  branchRules: Map<string, BranchRule[]>; // keyed by prompt_id
  completionRules: Map<string, CompletionRule[]>; // keyed by dimension_id
  evidenceFields: EvidenceField[];
}

// ----------------------------------------------------------------------------
// Dimension Completion State
// ----------------------------------------------------------------------------
export interface DimensionCompletionState {
  dimension_id: string;
  dimension_name: string;
  is_complete: boolean;
  responded_prompt_keys: string[];
  required_prompt_keys: string[];
}

// ----------------------------------------------------------------------------
// Conversation State (returned by API, consumed by client)
// ----------------------------------------------------------------------------
export interface ConversationState {
  conversation: Conversation;
  currentPrompt: Prompt | null;
  responseOptions: PromptResponseOption[];
  responses: ConversationResponse[];
  completedDimensions: DimensionCompletionState[];
  isComplete: boolean;
  prompts?: Prompt[]; // All prompts in the knowledge model (for response history)
}

// ----------------------------------------------------------------------------
// API Request / Response Types
// ----------------------------------------------------------------------------
export interface StartConversationRequest {
  knowledge_model_id: string;
}

export interface StartConversationResponse {
  state: ConversationState;
}

export interface RespondRequest {
  prompt_id: string;
  response_value: string;
}

export interface RespondResponse {
  state: ConversationState;
}

export interface CompleteConversationResponse {
  conversation: Conversation;
  evidenceRecords: EvidenceRecord[];
  dimensionSummary: DimensionCompletionState[];
}

export interface ListConversationsResponse {
  conversations: (Conversation & { knowledge_model_name: string })[];
}

export interface ListKnowledgeModelsResponse {
  knowledge_models: KnowledgeModel[];
}
