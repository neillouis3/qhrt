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
  isActive: boolean;
  href: string;
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
  assessments?: { slug?: string; title?: string } | { slug?: string; title?: string }[] | null;
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
    steps: parseGuideSteps(row.steps),
    isActive: row.is_active,
    href: lessonHref(moduleSlug, lesson),
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
  'id, slug, title, description, display_order, is_active, module_lessons(id, module_id, position, title, description, kind, assessment_id, steps, is_active, assessments(slug, title))';

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
