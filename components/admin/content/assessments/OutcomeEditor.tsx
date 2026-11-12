import type { AssessmentOutcome, Workbook } from '@/lib/assessments';
import { Field, inputClass, smallButtonClass } from './fields';

function numberOrNull(value: string): number | null {
  return value === '' ? null : Number(value);
}

export function OutcomeEditor({
  outcome,
  index,
  categories,
  choiceQuestions,
  workbooks,
  scoreHint,
  onChange,
  onRemove,
}: {
  outcome: AssessmentOutcome;
  index: number;
  categories: string[];
  choiceQuestions: { key: string; text: string; options: { value: string; label: string }[] }[];
  workbooks: Workbook[];
  scoreHint: string;
  onChange: (o: AssessmentOutcome) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<AssessmentOutcome>) => onChange({ ...outcome, ...patch });

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Outcome {index + 1}</span>
        <button type="button" className={`${smallButtonClass} text-red-500`} onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Label" required className="md:col-span-2">
          <input
            type="text"
            value={outcome.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="e.g. Moderate perceived stress"
            className={inputClass}
          />
        </Field>
        <Field label="Key" required>
          <input
            type="text"
            value={outcome.key}
            onChange={(e) => set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            className={`${inputClass} font-mono`}
          />
        </Field>
      </div>

      <Field label="Message shown to the user">
        <textarea
          value={outcome.summary}
          onChange={(e) => set({ summary: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field label="Show when">
          <select
            value={outcome.match}
            onChange={(e) => set({ match: e.target.value as AssessmentOutcome['match'] })}
            className={inputClass}
          >
            <option value="score_range">Score is in a range</option>
            <option value="top_category">A category scores highest</option>
            <option value="fallback">Nothing else matches</option>
            <option value="stop">Stop the check (emergency)</option>
          </select>
        </Field>
        {outcome.match === 'top_category' && (
          <Field label="Category">
            <select
              value={outcome.category ?? ''}
              onChange={(e) => set({ category: e.target.value || null })}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        )}
        {outcome.match !== 'fallback' && outcome.match !== 'stop' && (
          <>
            <Field
              label={outcome.match === 'top_category' ? 'Min category score' : 'Min score'}
              hint={outcome.match === 'score_range' ? scoreHint : 'Leave empty for any'}
            >
              <input
                type="number"
                step="any"
                value={outcome.min ?? ''}
                onChange={(e) => set({ min: numberOrNull(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label={outcome.match === 'top_category' ? 'Max category score' : 'Max score'}>
              <input
                type="number"
                step="any"
                value={outcome.max ?? ''}
                onChange={(e) => set({ max: numberOrNull(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Skip this result when" hint="e.g. skip self-directed if a safety follow-up is Yes">
          <select
            value={outcome.excludeIf?.questionKey ?? ''}
            onChange={(e) =>
              set({
                excludeIf: e.target.value ? { questionKey: e.target.value, values: [] } : null,
              })
            }
            className={inputClass}
          >
            <option value="">Never skip</option>
            {choiceQuestions.map((question) => (
              <option key={question.key} value={question.key}>
                {question.text.slice(0, 60) || question.key}
              </option>
            ))}
          </select>
        </Field>
        {outcome.excludeIf ? (
          <div>
            <span className="mb-1.5 block text-sm font-medium">…if the answer is</span>
            <div className="flex flex-wrap gap-3">
              {(
                choiceQuestions.find((question) => question.key === outcome.excludeIf?.questionKey)
                  ?.options ?? []
              ).map((option) => (
                <label key={option.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={outcome.excludeIf!.values.includes(option.value)}
                    onChange={(e) => {
                      const values = e.target.checked
                        ? [...outcome.excludeIf!.values, option.value]
                        : outcome.excludeIf!.values.filter((value) => value !== option.value);
                      set({
                        excludeIf: { questionKey: outcome.excludeIf!.questionKey, values },
                      });
                    }}
                  />
                  {option.label || option.value}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <span className="block text-sm font-medium mb-1.5">Workbooks to recommend</span>
        {workbooks.length === 0 ? (
          <p className="text-xs text-muted">No workbooks yet — add some in the Workbooks tab.</p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {workbooks.map((w) => (
              <label key={w.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={outcome.workbookIds.includes(w.id)}
                  onChange={(e) =>
                    set({
                      workbookIds: e.target.checked
                        ? [...outcome.workbookIds, w.id]
                        : outcome.workbookIds.filter((id) => id !== w.id),
                    })
                  }
                />
                <span className={w.is_active ? '' : 'text-muted line-through'}>{w.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
