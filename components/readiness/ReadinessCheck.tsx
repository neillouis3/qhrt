'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Radio, RadioGroup, Typography, buttonVariants } from '@heroui/react';
import InfoBody from '@/components/readiness/InfoBody';
import { clearSessionCache, useSession } from '@/hooks/useSession';
import {
  groupQuestionsBySection,
  type AssessmentAnswers,
  type PublicAssessment,
  type PublicQuestion,
} from '@/lib/assessments';
import { CONFIRM_PATHS, PATHWAY_COPY, WELCOME_BODY, WELCOME_NOTICE, WELCOME_PATHS, pathwayCopy } from '@/lib/initialAccess';

type PageId = 'welcome' | 'safety' | 'independence' | 'expect' | 'suitability' | 'result' | 'confirm';

type PreparationActivity = { title: string; items: string[] };

const DRAFT_KEY = 'qhrt.readiness.draft';
const SECTION_ORDER = ['safety', 'independence', 'expect', 'suitability'] as const;

function sectionCode(section: string, index: number): string | null {
  if (section === 'safety') return `IR${index + 1}`;
  if (section === 'independence') return `R${index + 1}`;
  if (section === 'suitability') return `S${index + 1}`;
  return null;
}

function answerStops(question: PublicQuestion, answers: AssessmentAnswers): boolean {
  const value = answers[question.key];
  return Boolean(question.stopIf && value && question.stopIf.values.includes(value));
}

function sectionReady(items: PublicQuestion[], answers: AssessmentAnswers): boolean {
  return items.every((question) => {
    if (question.type === 'info' || question.type === 'practice' || !question.required) return true;
    return Boolean((answers[question.key] ?? '').trim());
  });
}

function readDraft(): { page: PageId; answers: AssessmentAnswers } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { page?: unknown; answers?: unknown };
    if (!parsed || typeof parsed.page !== 'string' || !parsed.answers || typeof parsed.answers !== 'object') {
      return null;
    }
    const answers: AssessmentAnswers = {};
    for (const [key, value] of Object.entries(parsed.answers as Record<string, unknown>)) {
      if (typeof value === 'string') answers[key] = value;
    }
    return { page: parsed.page as PageId, answers };
  } catch {
    return null;
  }
}

function writeDraft(page: PageId, answers: AssessmentAnswers) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ page, answers }));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function answersFromUnknown(value: unknown): AssessmentAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const answers: AssessmentAnswers = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') answers[key] = item;
  }
  return answers;
}

function activitiesFrom(value: unknown): PreparationActivity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const title = 'title' in item && typeof item.title === 'string' ? item.title : '';
    const rawItems = 'items' in item && Array.isArray(item.items) ? (item.items as unknown[]) : [];
    const items = rawItems.filter((entry): entry is string => typeof entry === 'string');
    return title ? [{ title, items }] : [];
  });
}

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
    <RadioGroup value={value || undefined} onChange={onChange} aria-label={label} className="flex flex-col gap-2" name={name}>
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

export default function ReadinessCheck() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState<PageId>('welcome');
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [pathway, setPathway] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [learnMore, setLearnMore] = useState(false);
  const [supportNote, setSupportNote] = useState(false);
  const [focus, setFocus] = useState<PreparationActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const attemptRef = useRef<string | null>(null);
  const againRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/readiness', { credentials: 'same-origin' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not load the check.');
        if (cancelled) return;
        setAssessment(data.assessment);
        const again = new URLSearchParams(window.location.search).has('again');
        againRef.current = again;
        if (again) {
          clearDraft();
          return;
        }
        const status = await fetch('/api/readiness/complete', { credentials: 'same-origin' });
        const saved = await status.json().catch(() => ({}));
        if (cancelled) return;
        if (saved?.complete && typeof saved.pathway === 'string') {
          setPathway(saved.pathway);
          setFocus(Array.isArray(saved.preparationFocus) ? saved.preparationFocus : []);
          setPage('result');
          return;
        }
        const open = await fetch('/api/readiness/attempt', { credentials: 'same-origin' });
        const openBody = await open.json().catch(() => ({}));
        if (cancelled) return;
        const attempt = openBody?.attempt;
        if (attempt && typeof attempt.attemptId === 'string') {
          attemptRef.current = attempt.attemptId;
          const restored = answersFromUnknown(attempt.answers);
          if (Object.keys(restored).length > 0) setAnswers(restored);
          if (typeof attempt.page === 'string' && attempt.page !== 'welcome' && attempt.page !== 'result' && attempt.page !== 'confirm') {
            setPage(attempt.page as PageId);
          }
          return;
        }
        const draft = readDraft();
        if (!draft) return;
        setAnswers(draft.answers);
        if (draft.page !== 'welcome' && draft.page !== 'result' && draft.page !== 'confirm') setPage(draft.page);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load the check.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (page === 'welcome' || page === 'result' || page === 'confirm') return;
    writeDraft(page, answers);
  }, [page, answers]);

  const saveAttempt = async (action: 'start' | 'save' | 'pause' | 'resume', nextPage: string = page, nextAnswers = answers) => {
    if (!session?.user) return;
    try {
      const response = await fetch('/api/readiness/attempt', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          attemptId: attemptRef.current,
          page: nextPage,
          answers: nextAnswers,
          forceNew: action === 'start' && againRef.current,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (typeof data.attemptId === 'string') attemptRef.current = data.attemptId;
    } catch {
      // The browser draft still keeps this attempt.
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    if (page === 'welcome' || page === 'result' || page === 'confirm') return;
    const timer = window.setTimeout(() => {
      void saveAttempt('save');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [page, answers, session?.user]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && attemptRef.current) void saveAttempt('pause');
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [page, answers, session?.user]);

  const sections = useMemo(
    () => (assessment ? groupQuestionsBySection(assessment.questions) : []),
    [assessment]
  );
  const ordered = SECTION_ORDER.map((key) => sections.find((section) => section.key === key)).filter(
    (section): section is (typeof sections)[number] => Boolean(section)
  );
  const current = ordered.find((section) => section.key === page) ?? null;

  const submit = async (nextAnswers: AssessmentAnswers) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/readiness/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ answers: nextAnswers, attemptId: attemptRef.current }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save those answers.');
        return;
      }
      clearDraft();
      setPathway(typeof data.pathway === 'string' ? data.pathway : null);
      setFocus(activitiesFrom(data.preparationFocus));
      setLearnMore(false);
      setSupportNote(false);
      setConfirmed(false);
      setPage('result');
    } catch {
      setError('Could not save those answers. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const goSection = (key: string) => {
    setError('');
    setPage(key as PageId);
  };

  const continueSection = () => {
    if (!current) return;
    const questions = current.items.filter((item) => item.type !== 'info');
    if (current.key === 'safety' && questions.some((question) => answerStops(question, answers))) {
      void submit(answers);
      return;
    }
    const index = ordered.findIndex((section) => section.key === current.key);
    const next = ordered[index + 1];
    if (next) goSection(next.key);
    else void submit(answers);
  };

  const backSection = () => {
    setError('');
    const index = ordered.findIndex((section) => section.key === page);
    if (index <= 0) setPage('welcome');
    else setPage(ordered[index - 1]!.key as PageId);
  };

  const choosePreparation = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/pathway', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'choose', pathway: 'preparation' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not switch to Preparation & Readiness.');
        return;
      }
      setPathway('preparation');
      setLearnMore(false);
      setPage('result');
    } catch {
      setError('Could not switch to Preparation & Readiness. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const finish = async (href: string) => {
    if (pathway && CONFIRM_PATHS.has(pathway)) {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/user/pathway', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'continue' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Could not continue just now.');
          return;
        }
        clearSessionCache();
        const next = pathway === 'additional_time' ? '/home' : typeof data.nextHref === 'string' ? data.nextHref : href;
        router.push(next);
        router.refresh();
      } catch {
        setError('Could not continue just now. Try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    router.push(href);
  };

  const frame = (children: React.ReactNode, stepKey: string) => (
    <div className="flex min-h-[calc(100svh-var(--app-navbar-height))] w-full flex-col items-center px-6 py-8">
      <div key={stepKey} className="readiness-step my-auto flex w-full max-w-lg flex-col gap-6">
        {children}
      </div>
    </div>
  );

  if (sessionLoading || (!assessment && !loadError)) {
    return frame(
      <Typography type="body-sm" color="muted">
        Loading…
      </Typography>,
      'loading'
    );
  }

  if (!session?.user) {
    return frame(
      <>
        <Typography type="h1" weight="normal">
          Create an account
        </Typography>
        <Typography type="body-sm" color="muted">
          The Program Readiness & Suitability Check comes after you create an account. It helps find the right starting point for self-directed QHRT.
        </Typography>
        <div>
          <Link href="/signup" className={buttonVariants({ variant: 'primary' })}>
            Create an account
          </Link>
        </div>
      </>,
      'account'
    );
  }

  if (loadError) {
    return frame(<p className="text-sm text-danger">{loadError}</p>, 'error');
  }

  if (page === 'welcome') {
    return frame(
      <>
        <div className="flex flex-col gap-3">
          <Typography type="h1" weight="normal">
            Are You Ready for Self-Directed QHRT?
          </Typography>
          <InfoBody text={WELCOME_BODY} />
          <Typography type="body-sm" color="muted">
            Your responses may recommend one of the following:
          </Typography>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {WELCOME_PATHS.map((item) => (
              <li key={item}>
                <Typography type="body-sm" color="muted">
                  {item}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Typography type="body" weight="medium">
            Important Notice
          </Typography>
          <InfoBody text={WELCOME_NOTICE} />
        </div>
        <div>
          <Button
            variant="primary"
            onPress={() => {
              const next = ordered[0]?.key ?? 'safety';
              void saveAttempt('start', next, {}).then(() => goSection(next));
            }}
          >
            Begin Program Readiness Check
          </Button>
        </div>
      </>,
      'welcome'
    );
  }

  if (page === 'confirm' && pathway) {
    const copy = pathwayCopy(pathway);
    return frame(
      <>
        <div className="flex flex-col gap-3">
          <Typography type="h1" weight="normal">
            Your Recommended Starting Point
          </Typography>
          <Typography type="body">
            Recommended Path: {copy.title}
          </Typography>
          <Typography type="body-sm" color="muted">
            This recommendation reflects your responses today. Your readiness and suitability may change over time. You may repeat the Program Readiness & Suitability Check whenever your circumstances or level of readiness change.
          </Typography>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>I understand my recommended starting point and wish to continue.</span>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onPress={() => setPage('result')}>
            Back
          </Button>
          <Button variant="primary" isPending={loading} isDisabled={!confirmed || loading} onPress={() => void finish('/onboarding')}>
            Continue
          </Button>
        </div>
      </>,
      'confirm'
    );
  }

  if (page === 'result' && pathway) {
    const copy = PATHWAY_COPY[pathway] ?? pathwayCopy(pathway);
    const lead = copy.body.split(/\n\n+/)[0] ?? '';
    return frame(
      <>
        <div className="flex flex-col gap-4">
          <Typography type="h1" weight="normal">
            {copy.title}
          </Typography>
          {lead ? <InfoBody text={pathway === 'preparation' && !learnMore ? lead : copy.body} /> : null}
        </div>
        {pathway === 'preparation' && focus.length > 0 ? (
          <div className="flex flex-col gap-4">
            {focus.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <Typography type="body" weight="medium">
                  {group.title}
                </Typography>
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Typography type="body-sm" color="muted">
                        {item}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {pathway === 'preparation' ? (
          <Typography type="body-sm" color="muted">
            After completing Preparation & Readiness, repeat the Program Readiness & Suitability Check.
          </Typography>
        ) : null}
        {supportNote ? (
          <Typography type="body-sm" color="muted">
            Think about who or what would help you participate independently. You can return when that support is in place.
          </Typography>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-col items-start gap-2">
          {pathway === 'self_directed' ? (
            <>
              <Button variant="primary" isDisabled={loading} onPress={() => setPage('confirm')}>
                Begin My QHRT Journey
              </Button>
              <Button variant="ghost" isDisabled={loading} onPress={() => void choosePreparation()}>
                Explore Preparation & Readiness First
              </Button>
            </>
          ) : null}
          {pathway === 'preparation' ? (
            <>
              <Button variant="primary" isDisabled={loading} onPress={() => setPage('confirm')}>
                Begin Preparation & Readiness
              </Button>
              <Button variant="ghost" onPress={() => setLearnMore((value) => !value)}>
                Learn More About This Recommendation
              </Button>
            </>
          ) : null}
          {pathway === 'additional_time' ? (
            <>
              <Button variant="primary" isDisabled={loading} onPress={() => void choosePreparation()}>
                Begin Preparation & Readiness
              </Button>
              <Button variant="ghost" onPress={() => router.push('/home')}>
                Pause and Return When I Feel More Ready
              </Button>
              <Button variant="ghost" onPress={() => setSupportNote(true)}>
                Consider What Additional Personal Support Would Help Me Participate Independently
              </Button>
            </>
          ) : null}
          {pathway === 'practical' ? (
            <>
              <Button variant="primary" onPress={() => router.push('/home')}>
                I’ll Prepare My Space and Return
              </Button>
              <Link href="/home" className={buttonVariants({ variant: 'ghost' })}>
                Return to My Account
              </Link>
            </>
          ) : null}
          {pathway === 'immediate' ? (
            <>
              <Typography type="body" weight="medium">
                Important Notice
              </Typography>
              <Link href="/" className={buttonVariants({ variant: 'primary' })}>
                Exit Program Readiness Check
              </Link>
            </>
          ) : null}
        </div>
      </>,
      `result-${pathway}-${learnMore ? 'more' : 'less'}`
    );
  }

  if (!current) return frame(null, 'empty');

  const intro = current.items.find((item) => item.type === 'info') ?? null;
  const questions = current.items.filter((item) => item.type !== 'info');
  const ready = sectionReady(current.items, answers);
  const continueLabel =
    current.key === 'expect'
      ? 'Continue to Suitability Check'
      : current.key === 'suitability'
        ? 'See My Recommended Starting Point'
        : 'Continue';

  return frame(
    <>
      <div className="flex flex-col gap-2">
        <Typography type="h2" weight="normal">
          {intro?.heading || current.key}
        </Typography>
        {intro?.text ? <InfoBody text={intro.text} /> : null}
      </div>
      {questions.length > 0 ? (
        <div className="flex flex-col gap-6">
          {questions.map((question, index) => {
            const code = sectionCode(current.key, index);
            return (
              <div key={question.key} className="flex flex-col gap-3 border-t border-border/40 pt-6 first:border-t-0 first:pt-0">
                <div className="flex flex-col gap-1">
                  <Typography type="body-sm" color="muted">
                    {code}
                    {question.heading ? ` — ${question.heading}` : ''}
                  </Typography>
                  <Typography type="body">{question.text}</Typography>
                </div>
                {question.type === 'choice' ? (
                  <RadioList
                    name={question.key}
                    label={question.text}
                    value={answers[question.key] ?? ''}
                    options={question.options}
                    onChange={(value) => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onPress={backSection}>
          Back
        </Button>
        <Button variant="primary" isPending={loading} isDisabled={!ready || loading} onPress={continueSection}>
          {continueLabel}
        </Button>
      </div>
    </>,
    page
  );
}
