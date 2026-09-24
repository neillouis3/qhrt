import type { SupabaseClient } from '@supabase/supabase-js';

async function rows<T>(
  query: PromiseLike<{ data: T[] | null; error: { code?: string } | null }>
): Promise<T[]> {
  const { data, error } = await query;
  if (error && (error.code === 'PGRST205' || error.code === '42P01')) return [];
  return data ?? [];
}

export async function collectAccountExport(
  db: SupabaseClient,
  account: { id: string; email: string | undefined; displayName: string; createdAt: string | undefined }
) {
  const conversations = await rows(
    db.from('conversations').select('*').eq('user_id', account.id).order('started_at', { ascending: true })
  );
  const conversationIds = conversations.map((row: { id: string }) => row.id);
  const engines = await rows(
    db.from('therapeutic_engines').select('*').eq('user_id', account.id).order('created_at', { ascending: true })
  );
  const engineIds = engines.map((row: { id: string }) => row.id);

  const [progress, selectedConditions, assessmentResults, assessmentSubmissions, diary, moodLogs, ratings, responses, evidence, phases, observations] =
    await Promise.all([
      rows(db.from('user_progress').select('*').eq('user_id', account.id)),
      rows(db.from('user_selected_conditions').select('*').eq('user_id', account.id)),
      rows(db.from('assessment_results').select('*').eq('user_id', account.id)),
      rows(
        db
          .from('assessment_submissions')
          .select('*, assessments(slug, title)')
          .eq('user_id', account.id)
          .order('created_at', { ascending: true })
      ),
      rows(db.from('diary_entries').select('*').eq('user_id', account.id).order('entry_date', { ascending: true })),
      rows(db.from('mood_logs').select('*').eq('user_id', account.id).order('logged_at', { ascending: true })),
      rows(db.from('session_ratings').select('*').eq('user_id', account.id)),
      conversationIds.length
        ? rows(db.from('conversation_responses').select('*').in('conversation_id', conversationIds))
        : Promise.resolve([]),
      conversationIds.length
        ? rows(db.from('evidence_records').select('*').in('conversation_id', conversationIds))
        : Promise.resolve([]),
      engineIds.length
        ? rows(db.from('therapeutic_phases').select('*').in('engine_id', engineIds))
        : Promise.resolve([]),
      engineIds.length
        ? rows(db.from('phase_observations').select('*').in('therapeutic_engine_id', engineIds))
        : Promise.resolve([]),
    ]);

  const responsesByConversation = new Map<string, unknown[]>();
  for (const row of responses as Array<{ conversation_id: string }>) {
    const list = responsesByConversation.get(row.conversation_id) ?? [];
    list.push(row);
    responsesByConversation.set(row.conversation_id, list);
  }
  const evidenceByConversation = new Map<string, unknown[]>();
  for (const row of evidence as Array<{ conversation_id: string }>) {
    const list = evidenceByConversation.get(row.conversation_id) ?? [];
    list.push(row);
    evidenceByConversation.set(row.conversation_id, list);
  }
  const phasesByEngine = new Map<string, unknown[]>();
  for (const row of phases as Array<{ engine_id: string }>) {
    const list = phasesByEngine.get(row.engine_id) ?? [];
    list.push(row);
    phasesByEngine.set(row.engine_id, list);
  }
  const observationsByEngine = new Map<string, unknown[]>();
  for (const row of observations as Array<{ therapeutic_engine_id: string }>) {
    const list = observationsByEngine.get(row.therapeutic_engine_id) ?? [];
    list.push(row);
    observationsByEngine.set(row.therapeutic_engine_id, list);
  }

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      email: account.email ?? null,
      displayName: account.displayName,
      createdAt: account.createdAt ?? null,
    },
    progress: progress[0] ?? null,
    selectedConditions,
    assessmentResults,
    assessmentSubmissions,
    conversations: conversations.map((conversation: { id: string }) => ({
      ...conversation,
      responses: responsesByConversation.get(conversation.id) ?? [],
      evidence: evidenceByConversation.get(conversation.id) ?? [],
    })),
    journeys: engines.map((engine: { id: string }) => ({
      ...engine,
      phases: phasesByEngine.get(engine.id) ?? [],
      observations: observationsByEngine.get(engine.id) ?? [],
    })),
    diary,
    moodLogs,
    sessionRatings: ratings,
  };
}
