import { supabaseServer } from '@/lib/supabaseClient';
import { missingRelation } from '@/lib/apiError';

export type LessonKind = 'guide' | 'assessment';

export interface GuideStep {
  title: string;
  paragraphs: string[];
  points: string[];
}

export interface ModuleLesson {
  id: string;
  moduleId: string;
  position: number;
  title: string;
  description: string | null;
  kind: LessonKind;
  assessmentId: string | null;
  assessmentSlug: string | null;
  steps: GuideStep[];
  minutes: number;
  isActive: boolean;
  href: string;
  completedAt: string | null;
}

export interface LearningModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  lessons: ModuleLesson[];
}

interface LessonRow {
  id: string;
  module_id: string;
  position: number;
  title: string;
  description: string | null;
  kind: string;
  assessment_id: string | null;
  steps: unknown;
  is_active: boolean;
  assessments?:
    | { slug?: string; title?: string; questions?: unknown }
    | { slug?: string; title?: string; questions?: unknown }[]
    | null;
}

interface ModuleRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  module_lessons?: LessonRow[] | null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function parseGuideSteps(raw: unknown): GuideStep[] {
  if (!Array.isArray(raw)) return [];
  const steps: GuideStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) continue;
    const paragraphs = Array.isArray(record.paragraphs)
      ? record.paragraphs.filter((line): line is string => typeof line === 'string' && line.trim() !== '').map((line) => line.trim())
      : [];
    const points = Array.isArray(record.points)
      ? record.points.filter((line): line is string => typeof line === 'string' && line.trim() !== '').map((line) => line.trim())
      : [];
    steps.push({ title, paragraphs, points });
  }
  return steps;
}

/** Quiet estimate so a lesson can show how long it usually takes. */
export function estimateLessonMinutes(input: {
  kind: LessonKind;
  steps: GuideStep[];
  questionCount?: number;
}): number {
  if (input.kind === 'assessment') {
    const questions = input.questionCount ?? 0;
    return Math.max(4, Math.round(questions * 0.5) || 6);
  }
  const steps = input.steps.length;
  if (steps === 0) return 5;
  return Math.max(3, steps);
}

export function minutesLabel(minutes: number): string {
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

export function lessonHref(moduleSlug: string, lesson: { position: number; kind: LessonKind; assessmentSlug: string | null }): string {
  if (lesson.kind === 'assessment' && lesson.assessmentSlug) {
    return `/assessments/${lesson.assessmentSlug}`;
  }
  return `/modules/${moduleSlug}/${lesson.position}`;
}

function lessonFromRow(moduleSlug: string, row: LessonRow): ModuleLesson {
  const nested = row.assessments;
  const assessment = Array.isArray(nested) ? nested[0] : nested;
  const kind: LessonKind = row.kind === 'assessment' ? 'assessment' : 'guide';
  const assessmentSlug = assessment?.slug || null;
  const steps = parseGuideSteps(row.steps);
  const questionCount = Array.isArray(assessment?.questions) ? assessment.questions.length : 0;
  const lesson = {
    position: row.position,
    kind,
    assessmentSlug,
  };
  return {
    id: row.id,
    moduleId: row.module_id,
    position: row.position,
    title: row.title,
    description: row.description,
    kind,
    assessmentId: row.assessment_id,
    assessmentSlug,
    steps,
    minutes: estimateLessonMinutes({ kind, steps, questionCount }),
    isActive: row.is_active,
    href: lessonHref(moduleSlug, lesson),
    completedAt: null,
  };
}

function moduleFromRow(row: ModuleRow, includeInactive: boolean): LearningModule {
  const lessons = (row.module_lessons ?? [])
    .filter((lesson) => includeInactive || lesson.is_active)
    .map((lesson) => lessonFromRow(row.slug, lesson))
    .sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    displayOrder: row.display_order,
    isActive: row.is_active,
    lessons,
  };
}

const MODULE_SELECT =
  'id, slug, title, description, display_order, is_active, module_lessons(id, module_id, position, title, description, kind, assessment_id, steps, is_active, assessments(slug, title, questions))';

export async function loadModules(options: { includeInactive?: boolean } = {}): Promise<
  { modules: LearningModule[] } | { missing: true }
> {
  const { data, error } = await supabaseServer
    .from('learning_modules')
    .select(MODULE_SELECT)
    .order('display_order', { ascending: true });

  if (error) {
    if (missingRelation(error)) return { missing: true };
    throw error;
  }

  const includeInactive = options.includeInactive === true;
  const modules = ((data ?? []) as ModuleRow[])
    .filter((row) => includeInactive || row.is_active)
    .map((row) => moduleFromRow(row, includeInactive));
  return { modules };
}

export async function loadModule(slug: string, options: { includeInactive?: boolean } = {}): Promise<
  { module: LearningModule | null } | { missing: true }
> {
  const { data, error } = await supabaseServer
    .from('learning_modules')
    .select(MODULE_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    if (missingRelation(error)) return { missing: true };
    throw error;
  }
  if (!data) return { module: null };
  const row = data as ModuleRow;
  if (!options.includeInactive && !row.is_active) return { module: null };
  return { module: moduleFromRow(row, options.includeInactive === true) };
}

export async function withUserCompletions(
  modules: LearningModule[],
  userId: string
): Promise<LearningModule[]> {
  const lessons = modules.flatMap((module) => module.lessons);
  if (lessons.length === 0) return modules;

  const lessonIds = lessons.map((lesson) => lesson.id);
  const assessmentIds = lessons
    .map((lesson) => lesson.assessmentId)
    .filter((id): id is string => Boolean(id));

  const [guideRes, assessmentRes] = await Promise.all([
    supabaseServer
      .from('module_lesson_completions')
      .select('lesson_id, completed_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds),
    assessmentIds.length > 0
      ? supabaseServer
          .from('assessment_submissions')
          .select('assessment_id, created_at')
          .eq('user_id', userId)
          .in('assessment_id', assessmentIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { assessment_id: string; created_at: string }[], error: null }),
  ]);

  const guideMap = new Map<string, string>();
  if (!guideRes.error && guideRes.data) {
    for (const row of guideRes.data) {
      if (typeof row.lesson_id === 'string' && typeof row.completed_at === 'string') {
        guideMap.set(row.lesson_id, row.completed_at);
      }
    }
  }

  const assessmentMap = new Map<string, string>();
  if (!assessmentRes.error && assessmentRes.data) {
    for (const row of assessmentRes.data) {
      if (typeof row.assessment_id === 'string' && typeof row.created_at === 'string' && !assessmentMap.has(row.assessment_id)) {
        assessmentMap.set(row.assessment_id, row.created_at);
      }
    }
  }

  return modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      completedAt:
        guideMap.get(lesson.id) ??
        (lesson.assessmentId ? assessmentMap.get(lesson.assessmentId) ?? null : null) ??
        null,
    })),
  }));
}

export async function completeGuideLesson(
  userId: string,
  lessonId: string
): Promise<{ completedAt: string } | { missing: true }> {
  const { data, error } = await supabaseServer
    .from('module_lesson_completions')
    .insert({ user_id: userId, lesson_id: lessonId })
    .select('completed_at')
    .single();

  if (!error && data?.completed_at) {
    return { completedAt: data.completed_at as string };
  }
  if (error && missingRelation(error)) return { missing: true };
  if (error && error.code === '23505') {
    const existing = await supabaseServer
      .from('module_lesson_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    if (existing.data?.completed_at) return { completedAt: existing.data.completed_at as string };
  }
  if (error) throw error;
  throw new Error('Could not save completion.');
}
