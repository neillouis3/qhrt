// ============================================================================
// QHRT Conversation Engine — Core Logic
// Generic engine that executes Knowledge Models stored in the database.
// Clinical knowledge is never hard-coded.
// ============================================================================

import { supabaseServer } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  KnowledgeModelFull,
  Prompt,
  BranchRule,
  CompletionRule,
  EvidenceField,
  Conversation,
  ConversationResponse,
  PromptResponseOption,
  EvidenceRecord,
  ConversationState,
  DimensionCompletionState,
  ConditionExpression,
  RuleExpression,
} from '@/lib/types/conversation';

// ----------------------------------------------------------------------------
// Load a complete Knowledge Model from the database
// ----------------------------------------------------------------------------
export async function loadKnowledgeModel(
  knowledgeModelId: string,
  client?: SupabaseClient
): Promise<KnowledgeModelFull | null> {
  const db = client ?? supabaseServer;
  // Fetch dimensions
  const { data: dimensions, error: dimError } = await db
    .from('evidence_dimensions')
    .select('*')
    .eq('knowledge_model_id', knowledgeModelId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (dimError || !dimensions) {
    console.error('[conversationEngine] Failed to load dimensions:', dimError);
    return null;
  }

  // Fetch prompts
  const { data: prompts, error: promptError } = await db
    .from('prompts')
    .select('*')
    .eq('knowledge_model_id', knowledgeModelId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (promptError || !prompts) {
    console.error('[conversationEngine] Failed to load prompts:', promptError);
    return null;
  }

  // --- Parallel fetch: all remaining queries are independent ---
  const promptIds: string[] = prompts.map((p: { id: string }) => p.id);
  const dimIds: string[] = dimensions.map((d: { id: string }) => d.id);

  const [optionsResult, branchRulesResult, compRulesResult, fieldsResult] = await Promise.all([
    // Response options
    promptIds.length > 0
      ? db
          .from('prompt_response_options')
          .select('*')
          .in('prompt_id', promptIds)
          .order('display_order', { ascending: true })
      : Promise.resolve({ data: null }),
    // Branch rules
    promptIds.length > 0
      ? db
          .from('branch_rules')
          .select('*')
          .in('prompt_id', promptIds)
          .eq('is_active', true)
          .order('priority', { ascending: true })
      : Promise.resolve({ data: null }),
    // Completion rules
    dimIds.length > 0
      ? db
          .from('completion_rules')
          .select('*')
          .in('evidence_dimension_id', dimIds)
          .eq('is_active', true)
      : Promise.resolve({ data: null }),
    // Evidence fields
    promptIds.length > 0
      ? db.from('evidence_fields').select('*').in('prompt_id', promptIds)
      : Promise.resolve({ data: null }),
  ]);

  // Build responseOptions map
  const responseOptions = new Map<string, PromptResponseOption[]>();
  if (optionsResult.data) {
    for (const opt of optionsResult.data as PromptResponseOption[]) {
      const list = responseOptions.get(opt.prompt_id);
      if (list) {
        list.push(opt);
      } else {
        responseOptions.set(opt.prompt_id, [opt]);
      }
    }
  }

  // Build branchRules map
  const branchRules = new Map<string, BranchRule[]>();
  if (branchRulesResult.data) {
    for (const rule of branchRulesResult.data) {
      const list = branchRules.get(rule.prompt_id);
      if (list) {
        list.push(rule);
      } else {
        branchRules.set(rule.prompt_id, [rule]);
      }
    }
  }

  // Build completionRules map
  const completionRules = new Map<string, CompletionRule[]>();
  if (compRulesResult.data) {
    for (const rule of compRulesResult.data) {
      const list = completionRules.get(rule.evidence_dimension_id);
      if (list) {
        list.push(rule);
      } else {
        completionRules.set(rule.evidence_dimension_id, [rule]);
      }
    }
  }

  const evidenceFields: EvidenceField[] = fieldsResult.data ?? [];

  return {
    model: null, // Not loaded here; caller can fetch separately
    dimensions,
    prompts,
    responseOptions,
    branchRules,
    completionRules,
    evidenceFields,
  };
}

// ----------------------------------------------------------------------------
// Start a new conversation for a user with a Knowledge Model
// ----------------------------------------------------------------------------
export async function startConversation(
  userId: string,
  knowledgeModelId: string,
  client?: SupabaseClient
): Promise<{ conversationId: string; state: ConversationState } | null> {
  const db = client ?? supabaseServer;
  const km = await loadKnowledgeModel(knowledgeModelId, db);
  if (!km) return null;

  // Find the opening prompt (first prompt with no evidence_dimension_id, or first by display_order)
  const openingPrompt = km.prompts.find((p) => p.evidence_dimension_id === null) ?? km.prompts[0];

  if (!openingPrompt) return null;

  // Create conversation record
  const { data: conversation, error: convError } = await db
    .from('conversations')
    .insert({
      user_id: userId,
      knowledge_model_id: knowledgeModelId,
      status: 'active',
      current_prompt_id: openingPrompt.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (convError || !conversation) {
    console.error('[conversationEngine] Failed to create conversation:', convError);
    return null;
  }

  const state = await getConversationState(conversation.id, km, db);
  if (!state) return null;
  return { conversationId: conversation.id, state };
}

// ----------------------------------------------------------------------------
// Process a user response — the core engine function
// Saves response → creates evidence → evaluates branch rules → determines next prompt
// ----------------------------------------------------------------------------
export async function processResponse(
  conversationId: string,
  promptId: string,
  responseValue: string,
  client?: SupabaseClient
): Promise<ConversationState | null> {
  const db = client ?? supabaseServer;
  const km = await loadKnowledgeModelForConversation(conversationId, db);
  if (!km) return null;

  // 1. Save the response
  const { data: response, error: respError } = await db
    .from('conversation_responses')
    .insert({
      conversation_id: conversationId,
      prompt_id: promptId,
      response_value: responseValue,
    })
    .select()
    .single();

  if (respError || !response) {
    console.error('[conversationEngine] Failed to save response:', respError);
    return null;
  }

  // 2. Create evidence record from the response
  await createEvidenceFromResponse(conversationId, response.id, promptId, responseValue, km, db);

  // 3. Evaluate branch rules for this prompt
  const nextPromptId = evaluateBranchRulesForPrompt(promptId, responseValue, km);

  // 4. Fetch all responses (including the one we just saved) for skip detection
  const { data: prevResponses } = await db
    .from('conversation_responses')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  const answeredKeys = new Set<string>();
  const answeredIds = new Set<string>();
  if (prevResponses) {
    for (const resp of prevResponses) {
      const p = km.prompts.find((pm) => pm.id === resp.prompt_id);
      if (p) answeredKeys.add(p.prompt_key);
      answeredIds.add(resp.prompt_id);
    }
  }
  // Always compute skipped prompts from response history, regardless of whether
  // a branch rule fired — this ensures they're available for both navigation
  // and state computation immediately.
  const currentPromptInfo = km.prompts.find((p) => p.id === promptId);
  const skippedIds = computeSkippedPrompts(km, answeredIds, prevResponses ?? []);

  // 5. Update conversation current_prompt_id
  let resolvedNextPromptId = nextPromptId;
  if (!resolvedNextPromptId) {
    // No branch rule matched — advance to next sequential prompt
    const nextPrompt = findNextPrompt(
      km,
      answeredKeys,
      currentPromptInfo?.display_order,
      skippedIds
    );
    resolvedNextPromptId = nextPrompt?.id ?? null;
  }

  if (resolvedNextPromptId) {
    await db
      .from('conversations')
      .update({
        current_prompt_id: resolvedNextPromptId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  // 6. Check if all required dimensions are complete (using skipped prompts for completion)
  const state = await getConversationState(conversationId, km, db);

  // If all required dimensions are complete and no next prompt from branching, mark complete
  if (state && allRequiredDimensionsComplete(state.completedDimensions)) {
    await db
      .from('conversations')
      .update({
        status: 'completed',
        current_prompt_id: null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    state.isComplete = true;
    state.currentPrompt = null;
    state.responseOptions = [];
  }

  return state;
}

// ----------------------------------------------------------------------------
// Get the full conversation state (for resume or current view)
// ----------------------------------------------------------------------------
export async function getConversationState(
  conversationId: string,
  km: LoadedKM,
  client?: SupabaseClient
): Promise<ConversationState | null> {
  const db = client ?? supabaseServer;
  // Fetch conversation record
  const { data: conversation, error: convError } = await db
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    console.error('[conversationEngine] Failed to load conversation:', convError);
    return null;
  }

  // Fetch all responses for this conversation
  const { data: responses } = await db
    .from('conversation_responses')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Build set of answered prompt keys
  const answeredPromptKeys = new Set<string>();
  if (responses) {
    for (const resp of responses) {
      const prompt = km.prompts.find((p) => p.id === resp.prompt_id);
      if (prompt) {
        answeredPromptKeys.add(prompt.prompt_key);
      }
    }
  }

  // Build set of skipped prompt IDs (prompts that were jumped over by branching)
  // A prompt is "skipped" if it belongs to a dimension whose branch rule jumped past it,
  // and it has never been answered.
  const answeredPromptIds = new Set<string>();
  if (responses) {
    for (const resp of responses) {
      answeredPromptIds.add(resp.prompt_id);
    }
  }
  const skippedPromptIds = computeSkippedPrompts(km, answeredPromptIds, responses ?? []);

  // Evaluate dimension completion (skipped prompts count as satisfied)
  const completedDimensions = evaluateDimensionCompletion(km, answeredPromptKeys, skippedPromptIds);

  // Determine current prompt
  let currentPrompt: Prompt | null = null;
  let responseOptions: PromptResponseOption[] = [];

  if (conversation.status !== 'completed') {
    // If there's a current_prompt_id set, use it
    if (conversation.current_prompt_id) {
      currentPrompt = km.prompts.find((p) => p.id === conversation.current_prompt_id) ?? null;
    }

    // If no current prompt or it was already answered, find next prompt
    if (!currentPrompt || answeredPromptKeys.has(currentPrompt.prompt_key)) {
      const nextPrompt = findNextPrompt(
        km,
        answeredPromptKeys,
        currentPrompt?.display_order,
        skippedPromptIds
      );
      currentPrompt = nextPrompt;
    }

    if (currentPrompt) {
      responseOptions = km.responseOptions.get(currentPrompt.id) ?? [];
    }
  }

  return {
    conversation,
    currentPrompt,
    responseOptions,
    responses: responses ?? [],
    completedDimensions,
    isComplete: conversation.status === 'completed',
    prompts: km.prompts, // Include all prompts for response history display
  };
}

// ----------------------------------------------------------------------------
// Complete a conversation explicitly
// ----------------------------------------------------------------------------
export async function completeConversation(
  conversationId: string,
  client?: SupabaseClient
): Promise<{
  conversation: Conversation;
  evidenceRecords: EvidenceRecord[];
  dimensionSummary: DimensionCompletionState[];
} | null> {
  const db = client ?? supabaseServer;
  // Update status
  const { data: conversation, error: convError } = await db
    .from('conversations')
    .update({
      status: 'completed',
      current_prompt_id: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (convError || !conversation) {
    console.error('[conversationEngine] Failed to complete conversation:', convError);
    return null;
  }

  // Fetch evidence records
  const { data: evidenceRecords } = await db
    .from('evidence_records')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Load KM for dimension summary
  const km = await loadKnowledgeModelForConversation(conversationId, db);
  if (!km) return null;

  const state = await getConversationState(conversationId, km, db);
  const dimensionSummary = state?.completedDimensions ?? [];

  return {
    conversation,
    evidenceRecords: evidenceRecords ?? [],
    dimensionSummary,
  };
}

// ----------------------------------------------------------------------------
// List conversations for a user
// ----------------------------------------------------------------------------
export interface ConversationListItem extends Conversation {
  knowledge_model_name: string;
}

export async function listUserConversations(
  userId: string,
  client?: SupabaseClient
): Promise<ConversationListItem[]> {
  const db = client ?? supabaseServer;
  const { data, error } = await db
    .from('conversations')
    .select(
      `
      *,
      knowledge_models (name)
    `
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('[conversationEngine] Failed to list conversations:', error);
    return [];
  }

  // Flatten the nested knowledge_models into knowledge_model_name
  return (data ?? []).map((conv: Record<string, unknown>) => ({
    ...conv,
    knowledge_model_name: ((conv.knowledge_models as { name?: string })?.name ??
      'Unknown') as string,
  })) as ConversationListItem[];
}

// ============================================================================
// Internal Helpers
// ============================================================================

type LoadedKM = NonNullable<Awaited<ReturnType<typeof loadKnowledgeModel>>>;

/** Load Knowledge Model for a conversation by resolving the knowledge_model_id */
async function loadKnowledgeModelForConversation(
  conversationId: string,
  client?: SupabaseClient
): Promise<LoadedKM | null> {
  const db = client ?? supabaseServer;
  const { data: conv } = await db
    .from('conversations')
    .select('knowledge_model_id')
    .eq('id', conversationId)
    .single();

  if (!conv) return null;
  const km = await loadKnowledgeModel(conv.knowledge_model_id, db);
  if (!km) return null;
  return km;
}

/** Create evidence record from a response using evidence field mappings */
async function createEvidenceFromResponse(
  conversationId: string,
  responseId: string,
  promptId: string,
  responseValue: string,
  km: LoadedKM,
  client?: SupabaseClient
): Promise<void> {
  const db = client ?? supabaseServer;
  const evidenceField = km.evidenceFields.find((ef) => ef.prompt_id === promptId);
  if (!evidenceField) return;

  await db.from('evidence_records').insert({
    conversation_id: conversationId,
    conversation_response_id: responseId,
    evidence_dimension_id: evidenceField.evidence_dimension_id,
    field_name: evidenceField.field_name,
    field_value: responseValue,
    evidence_type: 'raw',
  });
}

/** Evaluate branch rules for a prompt + response. Returns target prompt ID or null. */
function evaluateBranchRulesForPrompt(
  promptId: string,
  responseValue: string,
  km: LoadedKM
): string | null {
  const rules = km.branchRules.get(promptId);
  if (!rules || rules.length === 0) return null;

  // Evaluate rules in priority order (lowest number = highest priority)
  for (const rule of rules) {
    const expr = rule.condition_expression as ConditionExpression;
    if (evaluateCondition(expr, responseValue)) {
      return rule.target_prompt_id;
    }
  }

  return null;
}

/** Evaluate a single condition expression against a response value */
function evaluateCondition(expr: ConditionExpression, responseValue: string): boolean {
  const normalized = responseValue.trim().toLowerCase();
  const target = String(expr.response_value).trim().toLowerCase();

  switch (expr.operator) {
    case 'equals':
      return normalized === target;
    case 'not_equals':
      return normalized !== target;
    case 'contains':
      return normalized.includes(target);
    case 'greater_than':
      return Number(normalized) > Number(target);
    case 'less_than':
      return Number(normalized) < Number(target);
    case 'in': {
      const values = expr.values?.map((v) => v.trim().toLowerCase()) ?? [];
      return values.includes(normalized);
    }
    default:
      return false;
  }
}

/** Evaluate completion state for all dimensions */
function evaluateDimensionCompletion(
  km: LoadedKM,
  answeredPromptKeys: Set<string>,
  skippedPromptIds?: Set<string>
): DimensionCompletionState[] {
  // Skipped prompts are treated as "satisfied" for completion purposes
  const satisfiedKeys = new Set([...answeredPromptKeys]);
  if (skippedPromptIds) {
    for (const pid of skippedPromptIds) {
      const p = km.prompts.find((pm) => pm.id === pid);
      if (p) satisfiedKeys.add(p.prompt_key);
    }
  }

  return km.dimensions.map((dim) => {
    const rules = km.completionRules.get(dim.id);
    const requiredKeys: string[] = [];

    if (rules && rules.length > 0) {
      // Use the first (most specific) completion rule
      const rule = rules[0];
      if (rule) {
        const expr = rule.rule_expression as RuleExpression;
        requiredKeys.push(...(expr.required_prompt_keys ?? []));
      }
    }

    const respondedKeys: string[] = [];
    for (const key of requiredKeys) {
      if (satisfiedKeys.has(key)) {
        respondedKeys.push(key);
      }
    }

    return {
      dimension_id: dim.id,
      dimension_name: dim.name,
      is_complete: respondedKeys.length === requiredKeys.length && requiredKeys.length > 0,
      responded_prompt_keys: respondedKeys,
      required_prompt_keys: requiredKeys,
    };
  });
}

/** Check if all required dimensions are complete */
function allRequiredDimensionsComplete(dimensions: DimensionCompletionState[]): boolean {
  return dimensions.filter((d) => d.required_prompt_keys.length > 0).every((d) => d.is_complete);
}

/**
 * Compute which prompts were skipped by branching.
 * A prompt is "skipped" if a branch rule jumped past it and it was never answered.
 * We detect this by comparing the conversation response sequence against display_order:
 * - Intra-dimension jumps: if two consecutive responses show a forward jump within the same dimension,
 *   all prompts between them that weren't answered are marked skipped.
 * - Cross-dimension jumps: if a response jumps to a different dimension, all unanswered prompts
 *   in the source dimension are marked skipped (the branch rule effectively completed that dimension).
 */
function computeSkippedPrompts(
  km: LoadedKM,
  answeredPromptIds: Set<string>,
  responses: ConversationResponse[]
): Set<string> | undefined {
  if (responses.length < 2) return undefined;

  // Build prompt_id -> {display_order, evidence_dimension_id} map
  const promptInfo = new Map<string, { displayOrder: number; dimId: string | null }>();
  for (const p of km.prompts) {
    promptInfo.set(p.id, { displayOrder: p.display_order, dimId: p.evidence_dimension_id });
  }

  // Order responses by creation time to get the actual conversation flow
  const orderedResponses = [...responses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const skippedIds = new Set<string>();

  // Walk through consecutive response pairs and detect jumps
  for (let i = 0; i < orderedResponses.length - 1; i++) {
    const currentResp = orderedResponses[i];
    const nextResp = orderedResponses[i + 1];
    if (!currentResp || !nextResp) continue;

    const currentInfo = promptInfo.get(currentResp.prompt_id);
    const nextInfo = promptInfo.get(nextResp.prompt_id);

    if (!currentInfo || !nextInfo) continue;

    if (currentInfo.dimId !== nextInfo.dimId) {
      // Cross-dimension jump: mark all unanswered prompts in the source dimension as skipped
      if (currentInfo.dimId) {
        for (const p of km.prompts) {
          if (p.evidence_dimension_id === currentInfo.dimId && !answeredPromptIds.has(p.id)) {
            skippedIds.add(p.id);
          }
        }
      }
    } else if (nextInfo.displayOrder > currentInfo.displayOrder) {
      // Intra-dimension forward jump — mark unanswered prompts in between as skipped
      for (const p of km.prompts) {
        if (
          p.evidence_dimension_id === currentInfo.dimId &&
          p.display_order > currentInfo.displayOrder &&
          p.display_order < nextInfo.displayOrder &&
          !answeredPromptIds.has(p.id)
        ) {
          skippedIds.add(p.id);
        }
      }
    }
  }

  return skippedIds.size > 0 ? skippedIds : undefined;
}

/**
 * Find the next prompt to present based on answered prompts and dimension priority.
 * Iterates FORWARD from currentDisplayOrder within each dimension, so skipped prompts
 * (from branching) are not revisited. Only falls back to scanning from the start if
 * we reach the end without finding anything.
 *
 * @param skippedPromptIds - Set of prompt IDs that were skipped by branching and should
 *                          be treated as "satisfied" for completion but never re-presented.
 */
function findNextPrompt(
  km: LoadedKM,
  answeredPromptKeys: Set<string>,
  currentDisplayOrder?: number,
  skippedPromptIds?: Set<string>
): Prompt | null {
  const satisfiedKeys = new Set([...answeredPromptKeys]);
  // Add skipped prompt keys to the satisfied set so they won't be found as "unanswered"
  if (skippedPromptIds) {
    for (const pid of skippedPromptIds) {
      const p = km.prompts.find((pm) => pm.id === pid);
      if (p) satisfiedKeys.add(p.prompt_key);
    }
  }

  if (currentDisplayOrder != null) {
    // --- Forward pass: iterate from current position onward ---
    const openingPrompt = km.prompts.find(
      (p) => p.evidence_dimension_id === null && !satisfiedKeys.has(p.prompt_key)
    );
    if (openingPrompt) return openingPrompt;

    for (const dim of km.dimensions) {
      const dimPrompts = km.prompts
        .filter(
          (p) =>
            p.evidence_dimension_id === dim.id &&
            !satisfiedKeys.has(p.prompt_key) &&
            p.display_order > currentDisplayOrder
        )
        .sort((a, b) => a.display_order - b.display_order);

      if (dimPrompts.length > 0) {
        return dimPrompts[0] ?? null;
      }
    }
  }

  // --- Fallback: scan from the beginning (catches edge cases / backward jumps) ---
  const openingPrompt = km.prompts.find(
    (p) => p.evidence_dimension_id === null && !satisfiedKeys.has(p.prompt_key)
  );
  if (openingPrompt) return openingPrompt;

  for (const dim of km.dimensions) {
    const dimPrompts = km.prompts
      .filter((p) => p.evidence_dimension_id === dim.id && !satisfiedKeys.has(p.prompt_key))
      .sort((a, b) => a.display_order - b.display_order);

    if (dimPrompts.length > 0) {
      return dimPrompts[0] ?? null;
    }
  }

  return null;
}
