// ============================================================================
// QHRT Therapeutic Engine — Core Logic
// Manages the 8-phase Universal Therapeutic Engine lifecycle.
// Loads modular content (Functional Domain, AEE, Personal Program) separately.
// Enforces phase transition rules.
// ============================================================================

import { supabaseServer } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Maximum phase order in the Universal Therapeutic Engine (8-phase lifecycle). */
const MAX_PHASE_ORDER = 8;
import type {
  TherapeuticEngine,
  TherapeuticPhase,
  PhaseTemplate,
  FunctionalDomainProtocol,
  ArchetypalEmotionalEnergetic,
  PersonalImplementationProgram,
  PhaseObservation,
  EngineSessionState,
  PhaseStatus,
  PhaseDeliveryContent,
  CreateEngineRequest,
  CompletePhaseRequest,
  SaveObservationRequest,
} from '@/lib/types/therapeutic-engine';

// ----------------------------------------------------------------------------
// Phase Transition Rules
// Returns true if the transition is allowed.
// ----------------------------------------------------------------------------
function canTransitionTo(
  targetOrder: number,
  phases: TherapeuticPhase[],
  engine: TherapeuticEngine
): boolean {
  // Helper: get status by order
  const getStatus = (order: number): PhaseStatus | undefined =>
    phases.find((p) => p.phase_order === order)?.status;

  switch (targetOrder) {
    case 1:
      // Entry phase — always allowed if engine is initialized
      return true;

    case 2:
      // Phase 2 requires Phase 1 completed
      return getStatus(1) === 'completed';

    case 3:
      // Phase 3A (Universal Reverse Sequential) requires AEE completion confirmed
      // AEE completion = Phase 2 is completed
      if (getStatus(2) !== 'completed') return false;
      // Also requires an AEE to be assigned
      if (!engine.aee_id) return false;
      return true;

    case 4:
      // Phase 3B (FD Reverse Sequential) requires Phase 3A completed
      return getStatus(3) === 'completed';

    case 5:
      // Phase 5 (Current Conscious Program) requires both reversal phases complete
      return getStatus(3) === 'completed' && getStatus(4) === 'completed';

    case 6:
      // Phase 6 (Universal Activation) requires Phase 5 completed
      return getStatus(5) === 'completed';

    case 7:
      // Phase 7 (FD Activation) requires FD + Personal Program activation complete
      // This means Phase 6 is completed AND the engine has both a domain and program assigned
      if (getStatus(6) !== 'completed') return false;
      if (!engine.functional_domain_protocol_id) return false;
      return true;

    case 8:
      // Phase 8 (Conscious Release) begins after Phase 7
      return getStatus(7) === 'completed';

    default:
      return false;
  }
}

// ----------------------------------------------------------------------------
// Initialize a new Therapeutic Engine
// Creates the engine record + all 8 phase rows from templates.
// ----------------------------------------------------------------------------
export async function initializeEngine(
  userId: string,
  request: CreateEngineRequest,
  client?: SupabaseClient
): Promise<TherapeuticEngine | null> {
  const db = client ?? supabaseServer;
  try {
    // 1. Fetch active phase templates (ordered)
    const { data: templates, error: tmplError } = await db
      .from('phase_templates')
      .select('*')
      .eq('is_active', true)
      .order('phase_order', { ascending: true });

    if (tmplError || !templates || templates.length === 0) {
      console.error('[therapeuticEngine] No phase templates found:', tmplError);
      return null;
    }

    // 2. Create the engine record
    const { data: engine, error: engineError } = await db
      .from('therapeutic_engines')
      .insert({
        user_id: userId,
        functional_domain_protocol_id: request.functional_domain_protocol_id,
        aee_id: request.aee_id || null,
        personal_program_id: request.personal_program_id || null,
        status: 'initialized',
        current_phase_order: 1,
      })
      .select()
      .single();

    if (engineError || !engine) {
      console.error('[therapeuticEngine] Failed to create engine:', engineError);
      return null;
    }

    // 3. Create phase rows from templates, merging with domain/AEE/program delivery content
    const phasesToInsert = await buildPhaseRows(engine.id, templates, request, db);

    const { error: phasesError } = await db.from('therapeutic_phases').insert(phasesToInsert);

    if (phasesError) {
      console.error('[therapeuticEngine] Failed to create phases:', phasesError);
      return null;
    }

    // 4. Set Phase 1 as active
    await db
      .from('therapeutic_phases')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('engine_id', engine.id)
      .eq('phase_order', 1);

    // Return the created engine with refreshed data
    return getEngineById(engine.id, db);
  } catch (err) {
    console.error('[therapeuticEngine] initializeEngine error:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// Build phase rows from templates, enriched with modular delivery content
// ----------------------------------------------------------------------------
async function buildPhaseRows(
  engineId: string,
  templates: PhaseTemplate[],
  request: CreateEngineRequest,
  client?: SupabaseClient
): Promise<Partial<TherapeuticPhase>[]> {
  const db = client ?? supabaseServer;
  // Fetch modular content in parallel
  const [domainRes, aeeRes, programRes] = await Promise.all([
    request.functional_domain_protocol_id
      ? db
          .from('functional_domain_protocols')
          .select('*')
          .eq('id', request.functional_domain_protocol_id)
          .single()
      : Promise.resolve({ data: null }),
    request.aee_id
      ? db.from('archetypal_emotional_energetics').select('*').eq('id', request.aee_id).single()
      : Promise.resolve({ data: null }),
    request.personal_program_id
      ? db
          .from('personal_implementation_programs')
          .select('*')
          .eq('id', request.personal_program_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const domain = domainRes.data as FunctionalDomainProtocol | null;
  const aee = aeeRes.data as ArchetypalEmotionalEnergetic | null;
  const program = programRes.data as PersonalImplementationProgram | null;

  return templates.map((tmpl) => {
    let clientScript = tmpl.client_script || null;
    let practitionerProtocol = tmpl.practitioner_protocol || null;

    // Enrich with domain-specific delivery content if available
    if (domain?.delivery_content && typeof domain.delivery_content === 'object') {
      const phaseContent = (domain.delivery_content as PhaseDeliveryContent)[tmpl.phase_key];
      if (phaseContent?.client_script) {
        clientScript = mergeScripts(clientScript, phaseContent.client_script);
      }
    }

    // Enrich with personal program delivery content
    if (program?.delivery_content && typeof program.delivery_content === 'object') {
      const phaseContent = (program.delivery_content as PhaseDeliveryContent)[tmpl.phase_key];
      if (phaseContent?.client_script) {
        clientScript = mergeScripts(clientScript, phaseContent.client_script);
      }
    }

    // For AEE resolution phase (order 2), inject AEE prompts into practitioner protocol
    if (tmpl.phase_order === 2 && aee?.resolution_prompts) {
      practitionerProtocol = mergeScripts(
        practitionerProtocol,
        `AEE Resolution Prompts: ${JSON.stringify(aee.resolution_prompts)}`
      );
    }

    return {
      engine_id: engineId,
      phase_order: tmpl.phase_order,
      phase_key: tmpl.phase_key,
      name: tmpl.name,
      description: tmpl.description,
      status: 'not_started' as PhaseStatus,
      client_script: clientScript,
      practitioner_protocol: practitionerProtocol,
    };
  });
}

// Helper: merge two script strings with a separator
function mergeScripts(base: string | null, addition: string | null): string | null {
  if (!base && !addition) return null;
  if (!base) return addition;
  if (!addition) return base;
  return `${base}\n\n${addition}`;
}

// ----------------------------------------------------------------------------
// Get Engine by ID
// ----------------------------------------------------------------------------
export async function getEngineById(
  engineId: string,
  client?: SupabaseClient
): Promise<TherapeuticEngine | null> {
  const db = client ?? supabaseServer;
  const { data, error } = await db
    .from('therapeutic_engines')
    .select('*')
    .eq('id', engineId)
    .single();

  if (error || !data) return null;
  return data as TherapeuticEngine;
}

// ----------------------------------------------------------------------------
// Get Full Engine Session State (composed view)
// ----------------------------------------------------------------------------
export async function getEngineSessionState(
  engineId: string,
  client?: SupabaseClient
): Promise<EngineSessionState | null> {
  const db = client ?? supabaseServer;
  try {
    // Fetch engine
    const engine = await getEngineById(engineId, db);
    if (!engine) return null;

    // Fetch phases, domain, AEE, program, observations in parallel
    const [phasesRes, domainRes, aeeRes, programRes, obsRes] = await Promise.all([
      db
        .from('therapeutic_phases')
        .select('*')
        .eq('engine_id', engineId)
        .order('phase_order', { ascending: true }),
      engine.functional_domain_protocol_id
        ? db
            .from('functional_domain_protocols')
            .select('*')
            .eq('id', engine.functional_domain_protocol_id)
            .single()
        : Promise.resolve({ data: null }),
      engine.aee_id
        ? db.from('archetypal_emotional_energetics').select('*').eq('id', engine.aee_id).single()
        : Promise.resolve({ data: null }),
      engine.personal_program_id
        ? db
            .from('personal_implementation_programs')
            .select('*')
            .eq('id', engine.personal_program_id)
            .single()
        : Promise.resolve({ data: null }),
      db.from('phase_observations').select('*').eq('therapeutic_engine_id', engineId),
    ]);

    const phases = (phasesRes.data || []) as TherapeuticPhase[];
    const currentPhase = phases.find((p) => p.status === 'active') || null;
    const observations = (obsRes.data || []) as PhaseObservation[];

    // Check if transition to next phase is allowed
    const nextOrder = engine.current_phase_order + 1;
    const canTransition =
      nextOrder <= MAX_PHASE_ORDER ? canTransitionTo(nextOrder, phases, engine) : false;

    return {
      engine,
      currentPhase,
      allPhases: phases,
      functionalDomain: domainRes.data as FunctionalDomainProtocol | null,
      aee: aeeRes.data as ArchetypalEmotionalEnergetic | null,
      personalProgram: programRes.data as PersonalImplementationProgram | null,
      observations,
      canTransitionToNext: canTransition,
    };
  } catch (err) {
    console.error('[therapeuticEngine] getEngineSessionState error:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// Transition to Next Phase
// Marks current phase completed, activates next phase if rules allow.
// ----------------------------------------------------------------------------
export async function transitionToNextPhase(
  engineId: string,
  client?: SupabaseClient
): Promise<{ success: boolean; message: string; newState?: EngineSessionState }> {
  const db = client ?? supabaseServer;
  try {
    const state = await getEngineSessionState(engineId, db);
    if (!state) return { success: false, message: 'Engine not found.' };

    const currentOrder = state.engine.current_phase_order;
    const nextOrder = currentOrder + 1;

    // Check if we've reached the end
    if (nextOrder > 8) {
      return { success: false, message: 'All phases have been completed.' };
    }

    // Validate transition rules
    if (!canTransitionTo(nextOrder, state.allPhases, state.engine)) {
      return {
        success: false,
        message: `Cannot transition to Phase ${nextOrder}. Prerequisites are not met.`,
      };
    }

    // Step 1: Mark current phase as completed
    const { error: step1Error } = await db
      .from('therapeutic_phases')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('engine_id', engineId)
      .eq('phase_order', currentOrder);

    if (step1Error) {
      console.error('[therapeuticEngine] transition step 1 failed:', step1Error);
      return { success: false, message: 'Failed to mark current phase as completed.' };
    }

    // Step 2: Activate next phase
    const { error: step2Error } = await db
      .from('therapeutic_phases')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('engine_id', engineId)
      .eq('phase_order', nextOrder);

    if (step2Error) {
      // Compensate: revert step 1
      await db
        .from('therapeutic_phases')
        .update({ status: 'active', completed_at: null })
        .eq('engine_id', engineId)
        .eq('phase_order', currentOrder);
      console.error(
        '[therapeuticEngine] transition step 2 failed (rolled back step 1):',
        step2Error
      );
      return {
        success: false,
        message: 'Failed to activate next phase. State has been rolled back.',
      };
    }

    // Step 3: Update engine current_phase_order
    const { error: step3Error } = await db
      .from('therapeutic_engines')
      .update({ current_phase_order: nextOrder, status: 'running' })
      .eq('id', engineId);

    if (step3Error) {
      // Compensate: revert steps 1 & 2
      await db
        .from('therapeutic_phases')
        .update({ status: 'active', completed_at: null })
        .eq('engine_id', engineId)
        .eq('phase_order', currentOrder);
      await db
        .from('therapeutic_phases')
        .update({ status: 'not_started', started_at: null })
        .eq('engine_id', engineId)
        .eq('phase_order', nextOrder);
      console.error(
        '[therapeuticEngine] transition step 3 failed (rolled back steps 1-2):',
        step3Error
      );
      return {
        success: false,
        message: 'Failed to update engine state. State has been rolled back.',
      };
    }

    const newState = await getEngineSessionState(engineId, db);
    return {
      success: true,
      message: `Transitioned to Phase ${nextOrder}.`,
      newState: newState ?? undefined,
    };
  } catch (err) {
    console.error('[therapeuticEngine] transitionToNextPhase error:', err);
    return { success: false, message: 'An error occurred during phase transition.' };
  }
}

// ----------------------------------------------------------------------------
// Complete Current Phase (with optional observations)
// ----------------------------------------------------------------------------
export async function completeCurrentPhase(
  engineId: string,
  request: CompletePhaseRequest,
  client?: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  const db = client ?? supabaseServer;
  try {
    const state = await getEngineSessionState(engineId, db);
    if (!state) return { success: false, message: 'Engine not found.' };

    const phaseOrder = request.phase_order || state.engine.current_phase_order;

    // Mark phase completed
    await db
      .from('therapeutic_phases')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('engine_id', engineId)
      .eq('phase_order', phaseOrder);

    // Save observations if provided
    if (request.observations) {
      await saveObservation(
        engineId,
        {
          phase_order: phaseOrder,
          ...request.observations,
        },
        db
      );
    }

    // If this was Phase 8, mark engine as completed
    if (phaseOrder === 8) {
      await db.from('therapeutic_engines').update({ status: 'completed' }).eq('id', engineId);
    }

    return { success: true, message: `Phase ${phaseOrder} completed.` };
  } catch (err) {
    console.error('[therapeuticEngine] completeCurrentPhase error:', err);
    return { success: false, message: 'An error occurred completing the phase.' };
  }
}

// ----------------------------------------------------------------------------
// Save Observation
// ----------------------------------------------------------------------------
export async function saveObservation(
  engineId: string,
  request: SaveObservationRequest,
  client?: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  const db = client ?? supabaseServer;
  try {
    // Upsert observation (insert or update)
    const { error } = await db.from('phase_observations').upsert(
      {
        therapeutic_engine_id: engineId,
        phase_order: request.phase_order,
        immediate_expression_change: request.immediate_expression_change || null,
        implementation_status: request.implementation_status || null,
        remaining_organizational_uncertainty: request.remaining_organizational_uncertainty || null,
        another_cycle_required: request.another_cycle_required ?? false,
        domain_specific_observations: request.domain_specific_observations || null,
        client_reflection: request.client_reflection || null,
      },
      { onConflict: 'therapeutic_engine_id,phase_order' }
    );

    if (error) {
      console.error('[therapeuticEngine] saveObservation error:', error);
      return { success: false, message: 'Failed to save observation.' };
    }

    return { success: true, message: 'Observation saved.' };
  } catch (err) {
    console.error('[therapeuticEngine] saveObservation error:', err);
    return { success: false, message: 'An error occurred saving the observation.' };
  }
}

// ----------------------------------------------------------------------------
// Pause Engine
// ----------------------------------------------------------------------------
export async function pauseEngine(
  engineId: string,
  client?: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  const db = client ?? supabaseServer;
  try {
    const { error } = await db
      .from('therapeutic_engines')
      .update({ status: 'paused' })
      .eq('id', engineId);

    if (error) {
      return { success: false, message: 'Failed to pause engine.' };
    }
    return { success: true, message: 'Engine paused.' };
  } catch (err) {
    console.error('[therapeuticEngine] pauseEngine error:', err);
    return { success: false, message: 'An error occurred pausing the engine.' };
  }
}

// ----------------------------------------------------------------------------
// Resume Engine
// ----------------------------------------------------------------------------
export async function resumeEngine(
  engineId: string,
  client?: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  const db = client ?? supabaseServer;
  try {
    const { error } = await db
      .from('therapeutic_engines')
      .update({ status: 'running' })
      .eq('id', engineId);

    if (error) {
      return { success: false, message: 'Failed to resume engine.' };
    }
    return { success: true, message: 'Engine resumed.' };
  } catch (err) {
    console.error('[therapeuticEngine] resumeEngine error:', err);
    return { success: false, message: 'An error occurred resuming the engine.' };
  }
}

// ----------------------------------------------------------------------------
// Get Client Delivery Content for a Specific Phase
// Returns only client-facing script (not practitioner protocol).
// ----------------------------------------------------------------------------
export async function getClientDeliveryContent(
  engineId: string,
  phaseOrder: number,
  client?: SupabaseClient
): Promise<{
  clientScript: string | null;
  prompts?: PhaseDeliveryContent[string]['prompts'];
} | null> {
  const db = client ?? supabaseServer;
  const { data, error } = await db
    .from('therapeutic_phases')
    .select('client_script')
    .eq('engine_id', engineId)
    .eq('phase_order', phaseOrder)
    .single();

  if (error || !data) return null;
  return { clientScript: data.client_script };
}

// ----------------------------------------------------------------------------
// Get All Engines for a User
// ----------------------------------------------------------------------------
export async function getEnginesByUserId(
  userId: string,
  client?: SupabaseClient
): Promise<TherapeuticEngine[]> {
  const db = client ?? supabaseServer;
  const { data, error } = await db
    .from('therapeutic_engines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as TherapeuticEngine[];
}

// ----------------------------------------------------------------------------
// Get All Engines (Admin)
// ----------------------------------------------------------------------------
export async function getAllEngines(client?: SupabaseClient): Promise<TherapeuticEngine[]> {
  const db = client ?? supabaseServer;
  const { data, error } = await db
    .from('therapeutic_engines')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as TherapeuticEngine[];
}
