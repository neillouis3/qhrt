import type { AnswerOption, AssessmentQuestion } from '@/lib/assessments/types';
import { Field, inputClass, smallButtonClass } from './fields';

const SCALE_PRESETS: { id: string; label: string; options: AnswerOption[] }[] = [
  {
    id: 'frequency-5',
    label: 'Never → Very often (0–4)',
    options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'].map((label, i) => ({
      value: String(i),
      label,
      score: i,
    })),
  },
  {
    id: 'agree-5',
    label: 'Strongly disagree → Strongly agree (1–5)',
    options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'].map((label, i) => ({
      value: String(i + 1),
      label,
      score: i + 1,
    })),
  },
  {
    id: 'frequency-3',
    label: 'Rarely → Frequently (0–2)',
    options: ['Rarely / never', 'Sometimes', 'Frequently'].map((label, i) => ({
      value: String(i),
      label,
      score: i,
    })),
  },
  {
    id: 'yes-no',
    label: 'Yes / No (1 / 0)',
    options: [
      { value: 'yes', label: 'Yes', score: 1 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
];

function nextOptionValue(options: AnswerOption[]): string {
  let n = options.length + 1;
  while (options.some((o) => o.value === `option_${n}`)) n += 1;
  return `option_${n}`;
}

export function QuestionEditor({
  question,
  index,
  total,
  earlierChoiceQuestions,
  onChange,
  onRemove,
  onMove,
}: {
  question: AssessmentQuestion;
  index: number;
  total: number;
  earlierChoiceQuestions: AssessmentQuestion[];
  onChange: (q: AssessmentQuestion) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const set = (patch: Partial<AssessmentQuestion>) => onChange({ ...question, ...patch });

  const setOption = (i: number, patch: Partial<AnswerOption>) =>
    set({ options: question.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  const conditionTarget = question.showIf
    ? earlierChoiceQuestions.find((q) => q.key === question.showIf!.questionKey)
    : undefined;

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Question {index + 1}</span>
        <div className="flex gap-1.5">
          <button type="button" className={smallButtonClass} disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </button>
          <button
            type="button"
            className={smallButtonClass}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            Down
          </button>
          <button type="button" className={`${smallButtonClass} text-red-500`} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <Field label="Question text" required>
        <textarea
          value={question.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field label="Key" required hint="Stable id for answers and rules">
          <input
            type="text"
            value={question.key}
            onChange={(e) => set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="Answer type">
          <select
            value={question.type}
            onChange={(e) => {
              const type = e.target.value as AssessmentQuestion['type'];
              set({ type, options: type === 'text' ? [] : question.options, reverse: false });
            }}
            className={inputClass}
          >
            <option value="choice">Multiple choice</option>
            <option value="text">Free text (not scored)</option>
          </select>
        </Field>
        <Field label="Category" hint="Groups scores for category routing">
          <input
            type="text"
            value={question.category ?? ''}
            onChange={(e) =>
              set({ category: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') || null })
            }
            placeholder="e.g. boundaries"
            className={`${inputClass} font-mono`}
          />
        </Field>
        <div className="flex flex-col justify-center gap-2 pt-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => set({ required: e.target.checked })}
            />
            Required
          </label>
          {question.type === 'choice' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.reverse}
                onChange={(e) => set({ reverse: e.target.checked })}
              />
              Reverse scored
            </label>
          )}
        </div>
      </div>

      {question.type === 'choice' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Answer options</span>
            <select
              value=""
              onChange={(e) => {
                const preset = SCALE_PRESETS.find((p) => p.id === e.target.value);
                if (preset) set({ options: preset.options.map((o) => ({ ...o })) });
              }}
              className={`${inputClass} w-auto py-1 text-xs`}
            >
              <option value="">Apply a scale preset…</option>
              {SCALE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_9rem_6rem_auto] gap-2 text-xs text-muted">
            <span>Label</span>
            <span>Value</span>
            <span>Score</span>
            <span />
          </div>
          {question.options.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_9rem_6rem_auto] gap-2">
              <input
                type="text"
                value={o.label}
                onChange={(e) => setOption(i, { label: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                value={o.value}
                onChange={(e) => setOption(i, { value: e.target.value.trim() })}
                className={`${inputClass} font-mono`}
              />
              <input
                type="number"
                step="any"
                value={o.score ?? ''}
                placeholder="—"
                onChange={(e) =>
                  setOption(i, { score: e.target.value === '' ? null : Number(e.target.value) })
                }
                className={inputClass}
              />
              <button
                type="button"
                className={smallButtonClass}
                onClick={() => set({ options: question.options.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={smallButtonClass}
              onClick={() =>
                set({
                  options: [
                    ...question.options,
                    { value: nextOptionValue(question.options), label: '', score: null },
                  ],
                })
              }
            >
              + Add option
            </button>
            <span className="text-xs text-muted">Leave score empty to record an answer without scoring it.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Show this question" hint="Hidden questions are skipped and not scored">
          <select
            value={question.showIf?.questionKey ?? ''}
            onChange={(e) =>
              set({ showIf: e.target.value ? { questionKey: e.target.value, values: [] } : null })
            }
            className={inputClass}
          >
            <option value="">Always</option>
            {earlierChoiceQuestions.map((q) => (
              <option key={q.key} value={q.key}>
                Only if “{q.text.slice(0, 60) || q.key}” is…
              </option>
            ))}
          </select>
        </Field>
        {conditionTarget && (
          <div>
            <span className="block text-sm font-medium mb-1.5">…one of these answers</span>
            <div className="flex flex-wrap gap-3">
              {conditionTarget.options.map((o) => (
                <label key={o.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={question.showIf!.values.includes(o.value)}
                    onChange={(e) => {
                      const values = e.target.checked
                        ? [...question.showIf!.values, o.value]
                        : question.showIf!.values.filter((v) => v !== o.value);
                      set({ showIf: { questionKey: conditionTarget.key, values } });
                    }}
                  />
                  {o.label || o.value}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
