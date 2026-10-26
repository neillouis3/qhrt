'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Radio, RadioGroup, TextArea, Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import UserPageShell, { PageHeader } from '@/components/layout/UserPageShell';
import { FocusContentSkeleton } from '@/components/layout/PageSkeleton';
import {
  visibleQuestions,
  type AssessmentAnswers,
  type AssessmentResult,
  type PublicAssessment,
  type ResultWorkbook,
} from '@/lib/assessments';

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
  onRetake,
}: {
  assessment: PublicAssessment;
  result: AssessmentResult;
  onRetake: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
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

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onPress={onRetake}>
          Retake
        </Button>
        <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
          Back to focus areas
        </Link>
      </div>
    </div>
  );
}

export default function AssessmentRunner({ slug, showResult }: { slug: string; showResult: boolean }) {
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [step, setStep] = useState(0);
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
        if (showResult && data.lastResult) setResult(data.lastResult);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [slug, showResult]);

  const visible = useMemo(
    () => (assessment ? visibleQuestions(assessment.questions, answers) : []),
    [assessment, answers]
  );

  if (loading) return <FocusContentSkeleton />;

  if (!assessment) {
    return (
      <UserPageShell>
        <PageHeader title="Focus area" />
        <AppCard className="p-6 flex flex-col gap-3">
          <Typography type="body-sm" className="text-danger">
            {error ?? 'This assessment is not available.'}
          </Typography>
          <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            Back to focus areas
          </Link>
        </AppCard>
      </UserPageShell>
    );
  }

  if (result) {
    return (
      <UserPageShell>
        <PageHeader title={assessment.title} subtitle="Your suggested workbooks" />
        <ResultView
          assessment={assessment}
          result={result}
          onRetake={() => {
            setResult(null);
            setAnswers({});
            setStep(0);
          }}
        />
      </UserPageShell>
    );
  }

  const index = Math.min(step, Math.max(visible.length - 1, 0));
  const question = visible[index];
  const isLast = index === visible.length - 1;
  const answer = question ? (answers[question.key] ?? '') : '';
  const canContinue = !question || !question.required || answer.trim() !== '';

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
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserPageShell>
      <PageHeader title={assessment.title} subtitle={assessment.instructions ?? assessment.description ?? undefined} />

      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-default/40">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${visible.length ? ((index + 1) / visible.length) * 100 : 0}%` }}
          />
        </div>
        <Typography type="body-xs" color="muted">
          Question {index + 1} of {visible.length}
        </Typography>
      </div>

      {question && (
        <AppCard className="flex flex-col gap-4 p-5">
          <Typography type="body">
            {question.text}
            {!question.required && (
              <span className="ml-2 text-xs text-muted">(optional)</span>
            )}
          </Typography>

          {question.type === 'text' ? (
            <TextArea
              fullWidth
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(question.key, e.target.value)}
              placeholder="Type your answer…"
              aria-label={question.text}
            />
          ) : (
            <RadioGroup
              value={answer || undefined}
              onChange={(v) => setAnswer(question.key, v)}
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
      )}

      {error && (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="tertiary"
          isDisabled={index === 0 || submitting}
          onPress={() => setStep(index - 1)}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            size="sm"
            variant="primary"
            isPending={submitting}
            isDisabled={!canContinue || submitting}
            onPress={handleSubmit}
          >
            See my workbooks
          </Button>
        ) : (
          <Button size="sm" variant="primary" isDisabled={!canContinue} onPress={() => setStep(index + 1)}>
            Next
          </Button>
        )}
      </div>

      {assessment.disclaimer && (
        <Typography type="body-xs" color="muted">
          {assessment.disclaimer}
        </Typography>
      )}
    </UserPageShell>
  );
}
