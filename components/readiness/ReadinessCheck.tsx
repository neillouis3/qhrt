'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Radio, RadioGroup, Typography, buttonVariants } from '@heroui/react';
import Logo from '@/components/ui/Logo';
import AppCard from '@/components/ui/AppCard';
import InfoBody from '@/components/readiness/InfoBody';
import { useSession } from '@/hooks/useSession';
import {
  groupQuestionsBySection,
  type AssessmentAnswers,
  type PublicAssessment,
  type PublicQuestion,
} from '@/lib/assessments';

type Step = 'welcome' | `section:${string}` | 'result';

function RadioList({
  name,
  value,
  options,
  onChange,
  label,
}: {
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <RadioGroup
      value={value || undefined}
      onChange={onChange}
      aria-label={label}
      className="flex flex-col gap-2"
      name={name}
    >
      {options.map((opt) => (
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
  );
}

function sectionComplete(items: PublicQuestion[], answers: AssessmentAnswers): boolean {
  const stopped = items.some(
    (q) => q.stopIf && answers[q.key] && q.stopIf.values.includes(answers[q.key]!)
  );
  if (stopped) return true;
  return items.every((q) => {
    if (q.type === 'info' || q.type === 'practice' || !q.required) return true;
    return Boolean((answers[q.key] ?? '').trim());
  });
}

function sectionTitle(items: PublicQuestion[], fallback: string): string {
  return items.find((item) => item.heading)?.heading || items[0]?.text || fallback;
}

export default function ReadinessCheck() {
  const { session } = useSession();
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<Step>('welcome');
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [result, setResult] = useState<{
    title: string;
    body: string;
    allowSignup: boolean;
    allowSessions?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/readiness', { credentials: 'same-origin' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not load the check.');
        if (cancelled) return;
        setAssessment(data.assessment);
        const again =
          typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('again');
        if (again) return;
        const status = await fetch('/api/readiness/complete', { credentials: 'same-origin' });
        const saved = await status.json().catch(() => ({}));
        if (cancelled || !saved?.complete || !saved.copy) return;
        setResult(saved.copy);
        setStep('result');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load the check.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => (assessment ? groupQuestionsBySection(assessment.questions) : []),
    [assessment]
  );
  const sectionKeys = sections.map((section) => section.key);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/readiness/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ answers }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save those answers.');
        return;
      }
      setResult(data.copy ?? { title: 'Recommended starting point', body: '', allowSignup: data.allowSignup });
      setStep('result');
    } catch {
      setError('Could not save those answers. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const goNext = (fromKey: string) => {
    const items = sections.find((section) => section.key === fromKey)?.items ?? [];
    const stopped = items.some(
      (q) => q.stopIf && answers[q.key] && q.stopIf.values.includes(answers[q.key]!)
    );
    if (stopped) {
      void submit();
      return;
    }
    const index = sectionKeys.indexOf(fromKey);
    const next = sectionKeys[index + 1];
    if (next) setStep(`section:${next}`);
    else void submit();
  };

  const goBack = (fromKey: string) => {
    const index = sectionKeys.indexOf(fromKey);
    if (index <= 0) setStep('welcome');
    else setStep(`section:${sectionKeys[index - 1]}`);
  };

  if (loadError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
        <p className="max-w-md text-sm text-danger">{loadError}</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Typography type="body-sm" color="muted">
          Loading…
        </Typography>
      </div>
    );
  }

  const currentKey = step.startsWith('section:') ? step.slice('section:'.length) : null;
  const current = currentKey ? sections.find((section) => section.key === currentKey) : null;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-[var(--app-navbar-height)] items-center px-6">
        <Link href="/" className="flex items-center gap-3 text-foreground hover:opacity-80">
          <Logo className="h-9 w-9" decorative />
          <Typography type="body" weight="medium">
            QHRT
          </Typography>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-10 pb-20">
        {step === 'welcome' ? (
          <>
            <div className="flex flex-col gap-4">
              <Typography type="h1" weight="normal">
                {assessment.title}
              </Typography>
              {assessment.description ? (
                <Typography type="body" color="muted">
                  {assessment.description}
                </Typography>
              ) : null}
              {assessment.instructions ? (
                <div className="flex flex-col gap-2">
                  <Typography type="body" color="muted">
                    {assessment.instructions}
                  </Typography>
                  {assessment.outcomes.length > 0 ? (
                    <ul className="flex list-disc flex-col gap-1 pl-5">
                      {assessment.outcomes.map((outcome) => (
                        <li key={outcome.key}>
                          <Typography type="body" color="muted">
                            {outcome.label}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
            {assessment.disclaimer ? (
              <AppCard className="flex flex-col gap-2 p-5">
                <Typography type="body" weight="medium">
                  Important Notice
                </Typography>
                <Typography type="body-sm" color="muted">
                  {assessment.disclaimer}
                </Typography>
              </AppCard>
            ) : null}
            <Button
              variant="primary"
              onPress={() => {
                setResult(null);
                setStep(sectionKeys[0] ? `section:${sectionKeys[0]}` : 'result');
              }}
            >
              Begin Program Readiness Check
            </Button>
          </>
        ) : null}

        {current ? (
          <>
            {(() => {
              const questionItems = current.items.filter((item) => item.type !== 'info');
              const introItems = current.items.filter((item) => item.type === 'info');
              if (questionItems.length === 0) {
                return introItems.map((item) => (
                  <div key={item.key} className="flex flex-col gap-4">
                    <Typography type="h2" weight="normal">
                      {item.heading || item.text}
                    </Typography>
                    {item.heading ? <InfoBody text={item.text} /> : null}
                  </div>
                ));
              }
              return (
                <>
                  <div className="flex flex-col gap-3">
                    <Typography type="h2" weight="normal">
                      {introItems[0]?.heading || sectionTitle(current.items, current.key)}
                    </Typography>
                    {introItems[0]?.text ? <InfoBody text={introItems[0].text} /> : null}
                  </div>
                  <div className="flex flex-col gap-4">
                    {questionItems.map((question) => (
                      <AppCard key={question.key} className="flex flex-col gap-4 p-5">
                        <div className="flex flex-col gap-1">
                          {question.heading ? (
                            <Typography type="body" weight="medium">
                              {question.heading}
                            </Typography>
                          ) : null}
                          <Typography type="body">{question.text}</Typography>
                        </div>
                        {question.type === 'choice' ? (
                          <RadioList
                            name={question.key}
                            label={question.text}
                            value={answers[question.key] ?? ''}
                            options={question.options}
                            onChange={(value) =>
                              setAnswers((prev) => ({ ...prev, [question.key]: value }))
                            }
                          />
                        ) : null}
                      </AppCard>
                    ))}
                  </div>
                </>
              );
            })()}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onPress={() => goBack(current.key)}>
                Back
              </Button>
              <Button
                variant="primary"
                isPending={loading}
                isDisabled={loading || !sectionComplete(current.items, answers)}
                onPress={() => goNext(current.key)}
              >
                {sectionKeys[sectionKeys.length - 1] === current.key
                  ? 'See My Recommended Starting Point'
                  : current.items.every((item) => item.type === 'info')
                    ? 'Continue'
                    : 'Continue'}
              </Button>
            </div>
          </>
        ) : null}

        {step === 'result' && result ? (
          <>
            <div className="flex flex-col gap-4">
              <Typography type="h1" weight="normal">
                {result.title}
              </Typography>
              {result.body ? (
                <InfoBody text={result.body} />
              ) : null}
            </div>
            {session?.user ? (
              <div className="flex flex-wrap gap-2">
                <Link href="/starting-point" className={buttonVariants({ variant: 'primary' })}>
                  Continue
                </Link>
                <Button variant="ghost" onPress={() => setStep('welcome')}>
                  Answer again
                </Button>
              </div>
            ) : result.allowSignup ? (
              <div className="flex flex-wrap gap-2">
                <Link href="/signup" className={buttonVariants({ variant: 'primary' })}>
                  Create an account
                </Link>
                <Button variant="ghost" onPress={() => setStep('welcome')}>
                  Answer again
                </Button>
              </div>
            ) : (
              <Link href="/" className={buttonVariants({ variant: 'primary' })}>
                Exit Program Readiness Check
              </Link>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
