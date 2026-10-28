'use client';

import Link from 'next/link';
import type { ScoringMethod } from '@/lib/assessments';
import { OutcomeEditor } from '../OutcomeEditor';
import { AssessmentWizardFrame, useAssessmentDraft } from '../AssessmentDraftProvider';
import { Field, inputClass, secondaryButtonClass } from '../fields';

const SCORING_LABELS: Record<ScoringMethod, string> = {
  sum: 'Total — add up option scores',
  mean: 'Average — mean of option scores',
  top_category: 'Category — route by the highest-scoring category',
};

export function ResultsStep() {
  const { draft, set, workbooks, categories, scoreHint, addOutcome, updateOutcome, removeOutcome } =
    useAssessmentDraft();

  return (
    <AssessmentWizardFrame step="results">
      <div className="space-y-8">
        <section className="space-y-3">
          <h4 className="text-sm font-medium">How answers are scored</h4>
          <Field label="Scoring method">
            <select
              value={draft.scoring_method}
              onChange={(e) => set({ scoring_method: e.target.value as ScoringMethod })}
              className={inputClass}
            >
              {(Object.keys(SCORING_LABELS) as ScoringMethod[]).map((method) => (
                <option key={method} value={method}>
                  {SCORING_LABELS[method]}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-muted">
            Every outcome whose rule matches is shown. If none match, outcomes set to “Nothing else
            matches” are shown instead.
            {scoreHint ? ` ${scoreHint}.` : ''}
          </p>
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Outcomes</h4>
            <p className="text-xs text-muted">
              Each outcome is a result people can land on. Attach workbooks here so the result has a next
              step.
            </p>
          </div>
          {workbooks.length === 0 ? (
            <p className="text-sm text-muted">
              No workbooks yet.{' '}
              <Link href="/content/workbooks/new" className="underline">
                Add a workbook
              </Link>{' '}
              first, then come back to link it.
            </p>
          ) : null}
          {draft.outcomes.map((outcome, index) => (
            <OutcomeEditor
              key={outcome.key || index}
              outcome={outcome}
              index={index}
              categories={categories}
              workbooks={workbooks}
              scoreHint={scoreHint}
              onChange={(next) => updateOutcome(index, next)}
              onRemove={() => removeOutcome(index)}
            />
          ))}
          <button type="button" onClick={addOutcome} className={secondaryButtonClass}>
            + Add outcome
          </button>
        </section>
      </div>
    </AssessmentWizardFrame>
  );
}
