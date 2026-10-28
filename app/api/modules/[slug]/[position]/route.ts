import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { completeGuideLesson, loadModule } from '@/lib/modules';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; position: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slug, position } = await context.params;
    const result = await loadModule(slug);
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    if (!result.module) return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
    const lesson = result.module.lessons.find((item) => item.position === Number(position) && item.kind === 'guide');
    if (!lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    return NextResponse.json({
      module: { id: result.module.id, slug: result.module.slug, title: result.module.title },
      lesson,
    });
  } catch (err) {
    return apiError(err, '[api/modules/lesson] GET');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; position: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slug, position } = await context.params;
    const result = await loadModule(slug);
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    if (!result.module) return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
    const lesson = result.module.lessons.find((item) => item.position === Number(position) && item.kind === 'guide');
    if (!lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    const saved = await completeGuideLesson(userResult.user.id, lesson.id);
    if ('missing' in saved) {
      return schemaMissingResponse('Module completions', 'supabase/012_module_lesson_completions.sql');
    }
    return NextResponse.json({ completedAt: saved.completedAt });
  } catch (err) {
    return apiError(err, '[api/modules/lesson] POST');
  }
}
