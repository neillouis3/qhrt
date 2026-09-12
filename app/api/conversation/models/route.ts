import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

/**
 * GET — List available Knowledge Models
 */
export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await createUserClient(request)
      .from('knowledge_models')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json({ knowledge_models: [] });
      }
      return apiError(error, '[api/conversation/models] GET');
    }

    return NextResponse.json({ knowledge_models: data ?? [] });
  } catch (err) {
    console.error('[api/conversation/models] GET unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
