import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { loadModule, withUserCompletions } from '@/lib/modules';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slug } = await context.params;
    const result = await loadModule(slug);
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    if (!result.module) return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
    const [module] = await withUserCompletions([result.module], userResult.user.id);
    return NextResponse.json({
      module: {
        ...module,
        lessons: (module ?? result.module).lessons.map(({ steps, ...lesson }) => lesson),
      },
    });
  } catch (err) {
    return apiError(err, '[api/modules/slug] GET');
  }
}
