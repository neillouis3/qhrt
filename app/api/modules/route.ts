import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { loadModules, withUserCompletions } from '@/lib/modules';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await loadModules();
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    const modules = await withUserCompletions(result.modules, userResult.user.id);
    return NextResponse.json({
      modules: modules.map((module) => ({
        ...module,
        lessons: module.lessons.map(({ steps, ...lesson }) => lesson),
      })),
    });
  } catch (err) {
    return apiError(err, '[api/modules] GET');
  }
}
