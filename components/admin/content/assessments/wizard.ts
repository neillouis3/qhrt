import type { AssessmentDefinition } from '@/lib/assessments';

export type AssessmentDraft = Omit<AssessmentDefinition, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type WizardStep = 'details' | 'questions' | 'results';

export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'questions', label: 'Questions' },
  { key: 'results', label: 'Results' },
];

export function wizardHref(assessmentId: string, step: WizardStep): string {
  return `/content/assessments/${assessmentId}/${step}`;
}

export function emptyDraft(displayOrder: number): AssessmentDraft {
  return {
    slug: '',
    title: '',
    description: null,
    instructions: null,
    disclaimer:
      'Educational self-check only. This is not a diagnosis and does not replace professional care.',
    cover_image: null,
    scoring_method: 'sum',
    questions: [],
    outcomes: [],
    display_order: displayOrder,
    is_active: true,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueKey(prefix: string, taken: string[]): string {
  let n = taken.length + 1;
  while (taken.includes(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

export function optionalText(value: string): string | null {
  return value.trim() ? value : null;
}

export function detailsReady(draft: AssessmentDraft): string | null {
  if (!draft.title.trim()) return 'Add a title before continuing.';
  if (!draft.slug.trim()) return 'Add a URL slug before continuing.';
  return null;
}

export function questionsReady(draft: AssessmentDraft): string | null {
  if (draft.questions.length === 0) return 'Add at least one question before continuing.';
  return null;
}
