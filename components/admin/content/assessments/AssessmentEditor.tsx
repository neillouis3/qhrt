import { useMemo, useState } from 'react';
import { scoreBounds } from '@/lib/assessments/scoring';
import type {
  AssessmentDefinition,
  AssessmentOutcome,
  AssessmentQuestion,
  ScoringMethod,
  Workbook,
} from '@/lib/assessments/types';
import { QuestionEditor } from './QuestionEditor';
import { OutcomeEditor } from './OutcomeEditor';
import { Field, inputClass, primaryButtonClass, secondaryButtonClass } from './fields';

export type AssessmentDraft = Omit<AssessmentDefinition, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

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

const SCORING_LABELS: Record<ScoringMethod, string> = {
  sum: 'Total — add up option scores',
  mean: 'Average — mean of option scores',
  top_category: 'Category — route by the highest-scoring category',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueKey(prefix: string, taken: string[]): string {
  let n = taken.length + 1;
  while (taken.includes(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

function scoreHint(draft: AssessmentDraft): string {
  if (draft.scoring_method === 'top_category') return 'Score = the top category’s total';
  if (draft.scoring_method === 'sum') {
    const { min, max } = scoreBounds(draft.questions);
    return `Possible total: ${min}–${max}`;
  }
  const scores = draft.questions.flatMap((q) =>
    q.options.map((o) => o.score).filter((s): s is number => s !== null)
  );
  return scores.length ? `Average range: ${Math.min(...scores)}–${Math.max(...scores)}` : '';
}

function optionalText(value: string): string | null {
  return value.trim() ? value : null;
}

export function AssessmentEditor({
  initial,
  workbooks,
  onSaved,
  onCancel,
  showToast,
}: {
  initial: AssessmentDraft;
  workbooks: Workbook[];
  onSaved: () => void;
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [draft, setDraft] = useState<AssessmentDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<AssessmentDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const categories = useMemo(
    () => [...new Set(draft.questions.map((q) => q.category).filter((c): c is string => !!c))],
    [draft.questions]
  );

  const updateQuestion = (index: number, next: AssessmentQuestion) => {
    setDraft((d) => {
      const prevKey = d.questions[index]!.key;
      const questions = d.questions.map((q, i) => {
        if (i === index) return next;
        if (prevKey !== next.key && q.showIf?.questionKey === prevKey) {
          return { ...q, showIf: { ...q.showIf, questionKey: next.key } };
        }
        return q;
      });
      return { ...d, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setDraft((d) => {
      const removedKey = d.questions[index]!.key;
      const questions = d.questions
        .filter((_, i) => i !== index)
        .map((q) => (q.showIf?.questionKey === removedKey ? { ...q, showIf: null } : q));
      return { ...d, questions };
    });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setDraft((d) => {
      const questions = [...d.questions];
      const target = index + direction;
      [questions[index], questions[target]] = [questions[target]!, questions[index]!];
      return { ...d, questions };
    });
  };

  const addQuestion = () => {
    setDraft((d) => ({
      ...d,
      questions: [
        ...d.questions,
        {
          key: uniqueKey('q', d.questions.map((q) => q.key)),
          text: '',
          type: 'choice',
          options: [],
          reverse: false,
          category: null,
          required: true,
          showIf: null,
        },
      ],
    }));
  };

  const addOutcome = () => {
    setDraft((d) => ({
      ...d,
      outcomes: [
        ...d.outcomes,
        {
          key: uniqueKey('outcome_', d.outcomes.map((o) => o.key)),
          label: '',
          summary: '',
          match: d.scoring_method === 'top_category' ? 'top_category' : 'score_range',
          min: null,
          max: null,
          category: null,
          workbookIds: [],
        },
      ],
    }));
  };

  const updateOutcome = (index: number, next: AssessmentOutcome) =>
    setDraft((d) => ({ ...d, outcomes: d.outcomes.map((o, i) => (i === index ? next : o)) }));

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch('/api/admin/assessments', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(json.errors ?? [json.error ?? 'Save failed']);
        showToast('Fix the highlighted problems and save again', 'error');
        return;
      }
      showToast(draft.id ? 'Assessment saved' : 'Assessment created', 'success');
      onSaved();
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hint = scoreHint(draft);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">{draft.id ? `Edit: ${initial.title}` : 'New assessment'}</h3>
        <div className="flex gap-3">
          <button onClick={onCancel} className={secondaryButtonClass}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className={primaryButtonClass}>
            {saving ? 'Saving…' : 'Save assessment'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600 space-y-1 list-disc pl-8">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">Details</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" required>
            <input
              type="text"
              value={draft.title}
              onChange={(e) =>
                set({
                  title: e.target.value,
                  ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="URL slug" required hint={`Shown at /assessments/${draft.slug || '…'}`}>
            <input
              type="text"
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
              }}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Short description" className="md:col-span-2">
            <input
              type="text"
              value={draft.description ?? ''}
              onChange={(e) => set({ description: optionalText(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Instructions" hint="Shown above the questions">
            <textarea
              value={draft.instructions ?? ''}
              onChange={(e) => set({ instructions: optionalText(e.target.value) })}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Disclaimer" hint="Shown with the questions and the result">
            <textarea
              value={draft.disclaimer ?? ''}
              onChange={(e) => set({ disclaimer: optionalText(e.target.value) })}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Cover image" hint="Optional path like /sleep-assessment.jpg or an https:// URL">
            <input
              type="text"
              value={draft.cover_image ?? ''}
              onChange={(e) => set({ cover_image: optionalText(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display order">
              <input
                type="number"
                value={draft.display_order}
                onChange={(e) => set({ display_order: Number(e.target.value) || 0 })}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => set({ is_active: e.target.checked })}
              />
              Visible to users
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Questions ({draft.questions.length})
          </h4>
        </div>
        {draft.questions.map((q, i) => (
          <QuestionEditor
            key={i}
            question={q}
            index={i}
            total={draft.questions.length}
            earlierChoiceQuestions={draft.questions.slice(0, i).filter((p) => p.type === 'choice')}
            onChange={(next) => updateQuestion(i, next)}
            onRemove={() => removeQuestion(i)}
            onMove={(dir) => moveQuestion(i, dir)}
          />
        ))}
        <button type="button" onClick={addQuestion} className={secondaryButtonClass}>
          + Add question
        </button>
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">Scoring</h4>
        <Field label="How answers are scored">
          <select
            value={draft.scoring_method}
            onChange={(e) => set({ scoring_method: e.target.value as ScoringMethod })}
            className={`${inputClass} md:w-1/2`}
          >
            {(Object.keys(SCORING_LABELS) as ScoringMethod[]).map((m) => (
              <option key={m} value={m}>
                {SCORING_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted">
          Every outcome whose rule matches is shown. If none match, outcomes set to “Nothing else
          matches” are shown instead.
        </p>
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Outcomes ({draft.outcomes.length})
        </h4>
        {draft.outcomes.map((o, i) => (
          <OutcomeEditor
            key={i}
            outcome={o}
            index={i}
            categories={categories}
            workbooks={workbooks}
            scoreHint={hint}
            onChange={(next) => updateOutcome(i, next)}
            onRemove={() => set({ outcomes: draft.outcomes.filter((_, j) => j !== i) })}
          />
        ))}
        <button type="button" onClick={addOutcome} className={secondaryButtonClass}>
          + Add outcome
        </button>
      </section>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <button onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </div>
  );
}
