/**
 * Error sanitization for API routes.
 *
 * Goal: never leak raw Supabase/Postgres error messages (table names, constraint
 * names, SQL fragments) to the client. Log the full error server-side and return a
 * generic, user-safe message.
 *
 * Usage:
 *   const { data, error } = await supabaseServer.from('x').update(...);
 *   if (error) return apiError(error);
 *
 *   } catch (err) {
 *     return apiError(err);
 *   }
 */
import { NextResponse } from 'next/server';

export function missingRelation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String(err.code) : '';
  return code === 'PGRST205' || code === '42P01';
}

export function schemaMissingResponse(label: string, sqlFile: string): NextResponse {
  return NextResponse.json(
    {
      error: `${label} tables are missing. Run ${sqlFile} in the Supabase SQL Editor, then refresh.`,
      code: 'SCHEMA_MISSING',
    },
    { status: 503 }
  );
}

/** Map a caught/known error to a NextResponse with a generic message. */
export function apiError(err: unknown, context?: string, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
  console.error(context ? `[apiError] ${context}: ${message}` : `[apiError] ${message}`, err);
  return NextResponse.json({ error: 'Internal server error' }, { status });
}
