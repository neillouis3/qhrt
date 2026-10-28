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
  const [progress, assessmentSubmissions, moduleCompletions, diary, moodLogs, ratings] = await Promise.all([
    rows(db.from('user_progress').select('*').eq('user_id', account.id)),
    rows(
      db
        .from('assessment_submissions')
        .select('*, assessments(slug, title)')
        .eq('user_id', account.id)
        .order('created_at', { ascending: true })
    ),
    rows(
      db
        .from('module_lesson_completions')
        .select('*, module_lessons(title, position, learning_modules(slug, title))')
        .eq('user_id', account.id)
        .order('completed_at', { ascending: true })
    ),
    rows(db.from('diary_entries').select('*').eq('user_id', account.id).order('entry_date', { ascending: true })),
    rows(db.from('mood_logs').select('*').eq('user_id', account.id).order('logged_at', { ascending: true })),
    rows(db.from('session_ratings').select('*').eq('user_id', account.id)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      email: account.email ?? null,
      displayName: account.displayName,
      createdAt: account.createdAt ?? null,
    },
    progress: progress[0] ?? null,
    assessmentSubmissions,
    moduleCompletions,
    diary,
    moodLogs,
    sessionRatings: ratings,
  };
}
