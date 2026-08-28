// ============================================================================
// QHRT Therapeutic Engine — Shared TypeScript Interfaces
// ============================================================================

// ----------------------------------------------------------------------------
// Therapeutic Engine Instance
// ----------------------------------------------------------------------------
export type EngineStatus = 'initialized' | 'running' | 'paused' | 'completed';

export interface TherapeuticEngine {
  id: string;
  conversation_id: string | null;
  user_id: string;
  functional_domain_protocol_id: string | null;
  aee_id: string | null;
  personal_program_id: string | null;
  status: EngineStatus;
  current_phase_order: number;
  observations: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Therapeutic Phase
// ----------------------------------------------------------------------------
export type PhaseStatus =
  | 'not_started'
  | 'active'
  | 'completed'
  | 'requires_attention'
  | 'skipped_by_rule';

export interface TherapeuticPhase {
  id: string;
  engine_id: string;
  phase_order: number;
  phase_key: string;
  name: string;
  description: string | null;
  status: PhaseStatus;
  client_script: string | null;
  practitioner_protocol: string | null;
  started_at: string | null;
  completed_at: string | null;
}

// ----------------------------------------------------------------------------
// Phase Template (admin-manageable)
// ----------------------------------------------------------------------------
export interface PhaseTemplate {
  id: string;
  phase_order: number;
  phase_key: string;
  name: string;
  description: string | null;
  client_script: string | null;
  practitioner_protocol: string | null;
  transition_rule_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Functional Domain Protocol
// ----------------------------------------------------------------------------
export interface FunctionalDomainProtocol {
  id: string;
  name: string;
  description: string | null;
  delivery_content: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Archetypal Emotional Energetic (AEE)
// ----------------------------------------------------------------------------
export interface ArchetypalEmotionalEnergetic {
  id: string;
  name: string;
  description: string | null;
  resolution_prompts: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Personal Implementation Program
// ----------------------------------------------------------------------------
export interface PersonalImplementationProgram {
  id: string;
  functional_domain_id: string | null;
  name: string;
  description: string | null;
  delivery_content: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Phase Observation
// ----------------------------------------------------------------------------
export interface PhaseObservation {
  id: string;
  therapeutic_engine_id: string;
  phase_order: number;
  immediate_expression_change: string | null;
  implementation_status: string | null;
  remaining_organizational_uncertainty: string | null;
  another_cycle_required: boolean;
  domain_specific_observations: string | null;
  client_reflection: string | null;
}

// ----------------------------------------------------------------------------
// Engine Session State (runtime composition returned by API)
// ----------------------------------------------------------------------------
export interface EngineSessionState {
  engine: TherapeuticEngine;
  currentPhase: TherapeuticPhase | null;
  allPhases: TherapeuticPhase[];
  functionalDomain: FunctionalDomainProtocol | null;
  aee: ArchetypalEmotionalEnergetic | null;
  personalProgram: PersonalImplementationProgram | null;
  observations: PhaseObservation[];
  canTransitionToNext: boolean;
}

// ----------------------------------------------------------------------------
// API Request / Response Types
// ----------------------------------------------------------------------------
export interface CreateEngineRequest {
  functional_domain_protocol_id: string;
  aee_id?: string;
  personal_program_id?: string;
}

export interface TransitionPhaseRequest {
  target_phase_order: number;
}

export interface CompletePhaseRequest {
  phase_order: number;
  observations?: Partial<PhaseObservation>;
}

export interface SaveObservationRequest {
  phase_order: number;
  immediate_expression_change?: string | null;
  implementation_status?: string | null;
  remaining_organizational_uncertainty?: string | null;
  another_cycle_required?: boolean;
  domain_specific_observations?: string | null;
  client_reflection?: string | null;
}

// ----------------------------------------------------------------------------
// Phase Delivery Content (structured JSONB shape)
// ----------------------------------------------------------------------------
export interface PhaseDeliveryContent {
  [phaseKey: string]: {
    client_script?: string;
    practitioner_protocol?: string;
    prompts?: Array<{
      key: string;
      text: string;
      response_type?: 'free_text' | 'single_choice' | 'scale';
    }>;
  };
}
