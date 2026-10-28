'use client';

import { QuestionEditor } from '../QuestionEditor';
import { AssessmentWizardFrame, useAssessmentDraft } from '../AssessmentDraftProvider';
import { questionsReady } from '../wizard';
import { inputClass, secondaryButtonClass } from '../fields';
import { PRACTICE_CATALOG, isPracticeId } from '@/lib/practices';

export function QuestionsStep() {
  const { draft, updateQuestion, removeQuestion, moveQuestion, addQuestion, addPractice } =
    useAssessmentDraft();

  return (
    <AssessmentWizardFrame step="questions" onContinue={() => questionsReady(draft)}>
      <div className="space-y-4">
        {draft.questions.length === 0 ? (
          <p className="text-sm text-muted">
            Build the flow in order. Add a question, then a practice, then more questions if you want.
          </p>
        ) : null}
        {draft.questions.map((question, index) => (
          <QuestionEditor
            key={question.key || index}
            question={question}
            index={index}
            total={draft.questions.length}
            earlierChoiceQuestions={draft.questions.slice(0, index).filter((item) => item.type === 'choice')}
            onChange={(next) => updateQuestion(index, next)}
            onRemove={() => removeQuestion(index)}
            onMove={(direction) => moveQuestion(index, direction)}
          />
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={addQuestion} className={secondaryButtonClass}>
            + Add question
          </button>
          <select
            value=""
            onChange={(event) => {
              const id = event.target.value;
              if (isPracticeId(id)) addPractice(id);
            }}
            className={`${inputClass} w-auto`}
          >
            <option value="">+ Add practice…</option>
            {PRACTICE_CATALOG.map((practice) => (
              <option key={practice.id} value={practice.id}>
                {practice.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </AssessmentWizardFrame>
  );
}
