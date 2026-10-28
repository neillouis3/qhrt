'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { scoreBounds, type AssessmentOutcome, type AssessmentQuestion, type Workbook } from '@/lib/assessments';
import { BuilderShell } from '../BuilderShell';
import { Toast } from '../shared/Toast';
import {
  emptyDraft,
  uniqueKey,
  WIZARD_STEPS,
  wizardHref,
  type AssessmentDraft,
  type WizardStep,
} from './wizard';

interface AssessmentDraftContextValue {
  assessmentId: string;
  draft: AssessmentDraft;
  workbooks: Workbook[];
  loading: boolean;
  saving: boolean;
  errors: string[];
  set: (patch: Partial<AssessmentDraft>) => void;
  setDraft: (next: AssessmentDraft | ((prev: AssessmentDraft) => AssessmentDraft)) => void;
  updateQuestion: (index: number, next: AssessmentQuestion) => void;
  removeQuestion: (index: number) => void;
  moveQuestion: (index: number, direction: -1 | 1) => void;
  addQuestion: () => void;
  addOutcome: () => void;
  updateOutcome: (index: number, next: AssessmentOutcome) => void;
  removeOutcome: (index: number) => void;
  scoreHint: string;
  categories: string[];
  save: () => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const AssessmentDraftContext = createContext<AssessmentDraftContextValue | null>(null);

function storageKey(assessmentId: string) {
  return `qhrt-assessment-draft:${assessmentId}`;
}

function scoreHintFor(draft: AssessmentDraft): string {
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

export function AssessmentDraftProvider({
  assessmentId,
  children,
}: {
  assessmentId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const isNew = assessmentId === 'new';
  const [draft, setDraft] = useState<AssessmentDraft>(emptyDraft(1));
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [ready, setReady] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [aRes, wRes] = await Promise.all([
          fetch('/api/admin/assessments'),
          fetch('/api/admin/workbooks'),
        ]);
        const [aJson, wJson] = await Promise.all([aRes.json(), wRes.json()]);
        if (cancelled) return;
        setWorkbooks(wJson.workbooks ?? []);
        const cached = sessionStorage.getItem(storageKey(assessmentId));
        if (cached) {
          setDraft(JSON.parse(cached) as AssessmentDraft);
        } else if (isNew) {
          setDraft(emptyDraft((aJson.assessments?.length ?? 0) + 1));
        } else {
          const found = (aJson.assessments as AssessmentDraft[] | undefined)?.find(
            (item) => item.id === assessmentId
          );
          if (!found) {
            showToast('Assessment not found', 'error');
            router.replace('/content?tab=assessment-builder');
            return;
          }
          setDraft(found);
        }
      } catch {
        if (!cancelled) showToast('Failed to load assessment', 'error');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, isNew, router, showToast]);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(storageKey(assessmentId), JSON.stringify(draft));
  }, [assessmentId, draft, ready]);

  const set = (patch: Partial<AssessmentDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const updateQuestion = (index: number, next: AssessmentQuestion) => {
    setDraft((current) => {
      const prevKey = current.questions[index]!.key;
      const questions = current.questions.map((question, i) => {
        if (i === index) return next;
        if (prevKey !== next.key && question.showIf?.questionKey === prevKey) {
          return { ...question, showIf: { ...question.showIf, questionKey: next.key } };
        }
        return question;
      });
      return { ...current, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setDraft((current) => {
      const removedKey = current.questions[index]!.key;
      const questions = current.questions
        .filter((_, i) => i !== index)
        .map((question) =>
          question.showIf?.questionKey === removedKey ? { ...question, showIf: null } : question
        );
      return { ...current, questions };
    });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const questions = [...current.questions];
      const target = index + direction;
      [questions[index], questions[target]] = [questions[target]!, questions[index]!];
      return { ...current, questions };
    });
  };

  const addQuestion = () => {
    setDraft((current) => ({
      ...current,
      questions: [
        ...current.questions,
        {
          key: uniqueKey(
            'q',
            current.questions.map((question) => question.key)
          ),
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
    setDraft((current) => ({
      ...current,
      outcomes: [
        ...current.outcomes,
        {
          key: uniqueKey(
            'outcome_',
            current.outcomes.map((outcome) => outcome.key)
          ),
          label: '',
          summary: '',
          match: current.scoring_method === 'top_category' ? 'top_category' : 'score_range',
          min: null,
          max: null,
          category: null,
          workbookIds: [],
        },
      ],
    }));
  };

  const updateOutcome = (index: number, next: AssessmentOutcome) =>
    setDraft((current) => ({
      ...current,
      outcomes: current.outcomes.map((outcome, i) => (i === index ? next : outcome)),
    }));

  const removeOutcome = (index: number) =>
    setDraft((current) => ({
      ...current,
      outcomes: current.outcomes.filter((_, i) => i !== index),
    }));

  const save = async () => {
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
        return false;
      }
      sessionStorage.removeItem(storageKey(assessmentId));
      showToast(draft.id ? 'Assessment saved' : 'Assessment created', 'success');
      router.push('/content?tab=assessment-builder');
      return true;
    } catch {
      showToast('Save failed', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const categories = useMemo(
    () => [...new Set(draft.questions.map((question) => question.category).filter((c): c is string => !!c))],
    [draft.questions]
  );

  const value: AssessmentDraftContextValue = {
    assessmentId,
    draft,
    workbooks,
    loading,
    saving,
    errors,
    set,
    setDraft,
    updateQuestion,
    removeQuestion,
    moveQuestion,
    addQuestion,
    addOutcome,
    updateOutcome,
    removeOutcome,
    scoreHint: scoreHintFor(draft),
    categories,
    save,
    showToast,
  };

  return (
    <AssessmentDraftContext.Provider value={value}>
      {children}
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </AssessmentDraftContext.Provider>
  );
}

export function useAssessmentDraft() {
  const context = useContext(AssessmentDraftContext);
  if (!context) throw new Error('useAssessmentDraft must be used inside AssessmentDraftProvider');
  return context;
}

export function AssessmentWizardFrame({
  step,
  children,
  onContinue,
}: {
  step: WizardStep;
  children: ReactNode;
  onContinue?: () => string | null;
}) {
  const { draft, loading, errors, assessmentId, showToast } = useAssessmentDraft();
  const [stepError, setStepError] = useState<string | null>(null);

  if (loading) {
    return (
      <BuilderShell
        backHref="/content?tab=assessment-builder"
        backLabel="Assessments"
        title="Assessment"
      >
        <p className="text-sm text-muted">Loading…</p>
      </BuilderShell>
    );
  }

  return (
    <BuilderShell
      backHref="/content?tab=assessment-builder"
      backLabel="Assessments"
      title={draft.id ? draft.title || 'Edit assessment' : 'New assessment'}
      subtitle={
        step === 'details'
          ? 'Name it, then write the questions, then decide what the result should do.'
          : step === 'questions'
            ? 'People answer these in order. You can hide a question based on an earlier answer.'
            : 'Scoring decides which outcome they see, and each outcome can recommend workbooks.'
      }
      steps={WIZARD_STEPS.map((item) => ({
        key: item.key,
        label: item.label,
        href: wizardHref(assessmentId, item.key),
      }))}
      currentStep={step}
    >
      {errors.length > 0 ? (
        <ul className="list-disc space-y-1 rounded-xl border border-red-500/40 bg-red-500/5 p-4 pl-8 text-sm text-red-600">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}
      {children}
      <StepFooter
        step={step}
        onContinue={() => {
          const problem = onContinue?.() ?? null;
          setStepError(problem);
          if (problem) showToast(problem, 'error');
          return problem;
        }}
      />
    </BuilderShell>
  );
}

export function StepFooter({
  step,
  onContinue,
}: {
  step: WizardStep;
  onContinue?: () => string | null;
}) {
  const { assessmentId, saving, save } = useAssessmentDraft();
  const router = useRouter();

  const go = (next: WizardStep) => router.push(wizardHref(assessmentId, next));

  return (
    <div className="flex justify-between gap-3 border-t border-border pt-6">
      {step === 'details' ? (
        <span />
      ) : (
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5"
          onClick={() => go(step === 'results' ? 'questions' : 'details')}
        >
          Back
        </button>
      )}
      {step === 'results' ? (
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save assessment'}
        </button>
      ) : (
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark"
          onClick={() => {
            const problem = onContinue?.();
            if (problem) return;
            go(step === 'details' ? 'questions' : 'results');
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}
