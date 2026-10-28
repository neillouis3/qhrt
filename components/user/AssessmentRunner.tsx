'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Radio, RadioGroup, TextArea, Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon } from '@hugeicons/core-free-icons';
import AppCard from '@/components/ui/AppCard';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import { FocusContentSkeleton } from '@/components/layout/PageSkeleton';
import ProgressNav, { linearProgressStatus, type ProgressStep } from '@/components/session/ProgressNav';
import { useSession } from '@/hooks/useSession';
import { assessmentLayoutFromUser } from '@/lib/userSettings';
import {
  visibleQuestions,
  type AssessmentAnswers,
  type AssessmentResult,
  type PublicAssessment,
  type PublicQuestion,
  type ResultWorkbook,
} from '@/lib/assessments';

const INTRO_ID = '__intro';

function questionAnchor(key: string) {
  return `assessment-q-${key}`;
}

function scrollToQuestion(key: string) {
  document.getElementById(questionAnchor(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div id={questionAnchor(question.key)} className="scroll-mt-8">
    <AppCard className="flex flex-col gap-4 p-5">
      <Typography type="body">
        {question.text}
        {!question.required && <span className="ml-2 text-xs text-muted">(optional)</span>}
      </Typography>
      {question.type === 'text' ? (
        <TextArea
          fullWidth
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          aria-label={question.text}
        />
      ) : (
        <RadioGroup
          value={value || undefined}
          onChange={onChange}
          aria-label={question.text}
          className="flex flex-col gap-2"
        >
          {question.options.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                {opt.label}
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      )}
    </AppCard>
    </div>
  );
}

function draftKey(slug: string) {
  return `qhrt.assessment.${slug}.draft`;
}

function readDraft(slug: string): { answers: AssessmentAnswers; step: number } | null {
  try {
    const raw = localStorage.getItem(draftKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { answers?: unknown; step?: unknown };
    if (!parsed || typeof parsed.answers !== 'object' || parsed.answers === null) return null;
    return {
      answers: parsed.answers as AssessmentAnswers,
      step: typeof parsed.step === 'number' && parsed.step >= 0 ? parsed.step : 0,
    };
  } catch {
    return null;
  }
}

function writeDraft(slug: string, answers: AssessmentAnswers, step: number) {
  localStorage.setItem(draftKey(slug), JSON.stringify({ answers, step }));
}

function clearDraft(slug: string) {
  localStorage.removeItem(draftKey(slug));
}

function WorkbookLink({ workbook }: { workbook: ResultWorkbook }) {
  const internal = workbook.url.startsWith('/');
  const body = (
    <AppCard className="flex flex-col gap-1 p-4 transition-colors hover:bg-default/50">
      <AppCard.Title className="font-normal tracking-tight">{workbook.title}</AppCard.Title>
      {workbook.description && <AppCard.Description>{workbook.description}</AppCard.Description>}
    </AppCard>
  );
  return internal ? (
    <Link href={workbook.url}>{body}</Link>
  ) : (
    <a href={workbook.url} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  );
}

function ResultView({
  assessment,
  result,
}: {
  assessment: PublicAssessment;
  result: AssessmentResult;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography type="h3" weight="normal">
          {assessment.title}
        </Typography>
        <Typography type="body-sm" color="muted">
          Your suggested workbooks
        </Typography>
      </div>
      {result.outcomes.length === 0 ? (
        <AppCard className="p-5">
          <Typography type="body-sm" color="muted">
            Thanks for completing this check-in. There are no workbook suggestions for these answers yet.
          </Typography>
        </AppCard>
      ) : (
        result.outcomes.map((outcome) => (
          <section key={outcome.key} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Typography type="h5" weight="normal">
                {outcome.label}
              </Typography>
              {outcome.summary && (
                <Typography type="body-sm" color="muted">
                  {outcome.summary}
                </Typography>
              )}
            </div>
            {outcome.workbooks.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {outcome.workbooks.map((w) => (
                  <WorkbookLink key={w.id} workbook={w} />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {assessment.disclaimer && (
        <Typography type="body-xs" color="muted">
          {assessment.disclaimer}
        </Typography>
      )}
    </div>
  );
}

export default function AssessmentRunner({ slug, showResult }: { slug: string; showResult: boolean }) {
  const { session } = useSession();
  const formLayout = assessmentLayoutFromUser(session?.user) === 'form';
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/assessments/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'Failed to load assessment');
        setAssessment(data.assessment);
        if (showResult && data.lastResult) {
          setResult(data.lastResult);
        } else {
          const draft = readDraft(slug);
          if (draft) {
            setAnswers(draft.answers);
            setStep(draft.step);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        if (!controller.signal.aborted) {
          setReady(true);
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [slug, showResult]);

  const visible = useMemo(
    () => (assessment ? visibleQuestions(assessment.questions, answers) : []),
    [assessment, answers]
  );

  const lastStep = visible.length;
  const onIntro = step === 0;
  const questionIndex = Math.min(Math.max(step - 1, 0), Math.max(lastStep - 1, 0));

  useEffect(() => {
    if (step > lastStep) setStep(lastStep);
  }, [step, lastStep]);

  useEffect(() => {
    if (!ready || !assessment || result) return;
    writeDraft(slug, answers, step);
  }, [ready, assessment, answers, step, result, slug]);

  const progressItems: ProgressStep[] = [
    {
      id: INTRO_ID,
      label: 'Introduction',
      status: result ? 'complete' : onIntro ? 'current' : 'complete',
    },
    ...visible.map((question, i) => {
      const answered = Boolean((answers[question.key] ?? '').trim());
      const status = result
        ? ('complete' as const)
        : onIntro
          ? ('upcoming' as const)
          : formLayout
            ? answered
              ? ('complete' as const)
              : ('upcoming' as const)
            : linearProgressStatus(i, questionIndex, answered);
      return {
        id: question.key,
        index: String(i + 1),
        label: question.text,
        status,
      };
    }),
  ];

  const progress = (
    <ProgressNav
      items={progressItems}
      onSelect={
        result || paused
          ? undefined
          : (id) => {
              if (id === INTRO_ID) {
                setStep(0);
                return;
              }
              const next = visible.findIndex((question) => question.key === id);
              if (next < 0) return;
              if (formLayout) {
                setStep(1);
                window.setTimeout(() => scrollToQuestion(id), 50);
                return;
              }
              if (next + 1 <= step) setStep(next + 1);
            }
      }
    />
  );

  const pause = () => {
    writeDraft(slug, answers, step);
    setPaused(true);
  };

  if (loading) {
    return (
      <FocusSessionLayout progress={progress}>
        <FocusContentSkeleton />
      </FocusSessionLayout>
    );
  }

  if (!assessment) {
    return (
      <FocusSessionLayout progress={progress}>
        <Typography type="body-sm" className="text-danger">
          {error ?? 'This assessment is not available.'}{' '}
          <Link href="/assessments" className="underline">
            Back to modules
          </Link>
        </Typography>
      </FocusSessionLayout>
    );
  }

  if (result) {
    return (
      <FocusSessionLayout
        progress={progress}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                clearDraft(slug);
                setResult(null);
                setAnswers({});
                setStep(0);
                setPaused(false);
              }}
            >
              Retake
            </Button>
            <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
              Back to modules
            </Link>
          </>
        }
      >
        <ResultView assessment={assessment} result={result} />
      </FocusSessionLayout>
    );
  }

  if (paused) {
    return (
      <FocusSessionLayout
        progress={progress}
        actions={
          <>
            <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
              Leave
            </Link>
            <Button size="sm" variant="primary" onPress={() => setPaused(false)}>
              Resume
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Typography type="h3" weight="normal">
            Paused
          </Typography>
          <Typography type="body" color="muted">
            Your place is saved on this device. Come back when you are ready.
          </Typography>
        </div>
      </FocusSessionLayout>
    );
  }

  const question = onIntro ? undefined : visible[questionIndex];
  const isLast = !onIntro && questionIndex === visible.length - 1;
  const answer = question ? (answers[question.key] ?? '') : '';
  const canContinue = !question || !question.required || answer.trim() !== '';
  const formReady = visible.every((q) => !q.required || (answers[q.key] ?? '').trim() !== '');

  const setAnswer = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const visibleKeys = new Set(visible.map((q) => q.key));
      const payload = Object.fromEntries(Object.entries(answers).filter(([k]) => visibleKeys.has(k)));
      const res = await fetch(`/api/assessments/${encodeURIComponent(slug)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      clearDraft(slug);
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = formLayout && !onIntro;

  return (
    <FocusSessionLayout
      progress={progress}
      onPause={pause}
      contentAlign={showForm ? 'start' : 'center'}
      leadingActions={
        onIntro ? (
          <Button size="sm" variant="ghost" onPress={pause}>
            <HugeiconsIcon icon={PauseIcon} size={16} strokeWidth={1.5} />
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={submitting}
            onPress={() => setStep(formLayout ? 0 : step - 1)}
          >
            Back
          </Button>
        )
      }
      actions={
        onIntro ? (
          <Button size="sm" variant="primary" onPress={() => setStep(1)}>
            Begin
          </Button>
        ) : formLayout || isLast ? (
          <Button
            size="sm"
            variant="primary"
            isPending={submitting}
            isDisabled={!(formLayout ? formReady : canContinue) || submitting}
            onPress={handleSubmit}
          >
            Submit
          </Button>
        ) : (
          <Button size="sm" variant="primary" isDisabled={!canContinue} onPress={() => setStep(step + 1)}>
            Next
          </Button>
        )
      }
    >
      {onIntro ? (
        <div className="flex flex-col gap-4">
          <Typography type="h3" weight="normal">
            {assessment.title}
          </Typography>
          {assessment.description ? (
            <Typography type="body">{assessment.description}</Typography>
          ) : null}
          {assessment.instructions ? (
            <Typography type="body" color="muted">
              {assessment.instructions}
            </Typography>
          ) : null}
          {assessment.disclaimer ? (
            <Typography type="body-xs" color="muted">
              {assessment.disclaimer}
            </Typography>
          ) : null}
        </div>
      ) : formLayout ? (
        <div className="flex flex-col gap-4">
          {visible.map((item) => (
            <QuestionBlock
              key={item.key}
              question={item}
              value={answers[item.key] ?? ''}
              onChange={(value) => setAnswer(item.key, value)}
            />
          ))}
        </div>
      ) : question ? (
        <QuestionBlock
          question={question}
          value={answer}
          onChange={(value) => setAnswer(question.key, value)}
        />
      ) : null}

      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      ) : null}
    </FocusSessionLayout>
  );
}
