/**
 * Assessment Renderer — renders assessment questions for a selected condition.
 * Generic component that reads question config from the condition API and supports 0-10 scale.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Question {
  id: string;
  question_text: string;
  scale_type: string;
  minimum_value: number;
  maximum_value: number;
}

interface AssessmentRendererProps {
  conditionId: string;
  conditionName?: string;
  onComplete: (results: Array<{ questionId: string; answerValue: number }>) => void;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Slider Input Component
// ---------------------------------------------------------------------------

function ScaleInput({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted w-6 text-center">{min}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label ? `${label} (scale ${min} to ${max})` : `Scale from ${min} to ${max}`}
        className="flex-1 accent-primary"
      />
      <span className="text-sm text-muted w-6 text-center">{max}</span>
      <span className="text-lg font-semibold text-foreground w-8 text-center">{value ?? '—'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AssessmentRenderer({
  conditionId,
  conditionName,
  onComplete,
  onCancel,
}: AssessmentRendererProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch condition details (includes assessment questions) — abort on unmount
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/conditions/${conditionId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const qs = data.condition?.assessment_questions ?? [];
        setQuestions(qs);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('Failed to load assessment questions.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [conditionId]);

  const handleAnswer = useCallback((questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const allAnswered = questions.length > 0 && questions.every((q) => q.id in answers);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSaving(true);
    setError(null);

    const results = questions.map((q) => ({
      questionId: q.id,
      answerValue: answers[q.id] ?? q.minimum_value,
    }));

    try {
      // Save to backend
      await fetch('/api/user/assessment-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionId, answers: results }),
      });

      onComplete(results);
    } catch (err) {
      setError('Failed to save assessment results.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <p className="mt-3 text-sm text-muted">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">
          No assessment questions available for this condition yet.
        </p>
        {onCancel && (
          <button onClick={onCancel} className="mt-4 text-sm text-primary hover:underline">
            Go back
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
        {conditionName ? `Assessment: ${conditionName}` : 'Assessment'}
      </h3>
      <p className="text-sm text-muted mb-6">
        Rate each question based on your experience over the past 7 days.
      </p>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-xl border border-border bg-background p-4 dark:bg-navy"
          >
            <p className="text-sm font-medium text-foreground dark:text-white mb-3">
              <span className="text-muted mr-2">{idx + 1}.</span>
              {q.question_text}
            </p>
            <ScaleInput
              min={q.minimum_value}
              max={q.maximum_value}
              value={answers[q.id] ?? null}
              onChange={(v) => handleAnswer(q.id, v)}
              label={q.question_text}
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || saving}
          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </span>
          ) : (
            'Submit Assessment'
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/5 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
