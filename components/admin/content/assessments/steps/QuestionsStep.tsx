'use client';

import { QuestionEditor } from '../QuestionEditor';
import { AssessmentWizardFrame, useAssessmentDraft } from '../AssessmentDraftProvider';
import { questionsReady } from '../wizard';
import { secondaryButtonClass } from '../fields';

export function QuestionsStep() {
  const { draft, updateQuestion, removeQuestion, moveQuestion, addQuestion } = useAssessmentDraft();

  return (
    <AssessmentWizardFrame step="questions" onContinue={() => questionsReady(draft)}>
      <div className="space-y-4">
        {draft.questions.length === 0 ? (
          <p className="text-sm text-muted">No questions yet. Add the first one, then continue to results.</p>
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
        <button type="button" onClick={addQuestion} className={secondaryButtonClass}>
          + Add question
        </button>
      </div>
    </AssessmentWizardFrame>
  );
}
