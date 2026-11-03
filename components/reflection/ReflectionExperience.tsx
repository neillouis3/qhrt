'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import ProgressNav from '@/components/session/ProgressNav';
import { isReflectionLesson, type GuideStep } from '@/lib/modules';
import {
  NEXT_STEPS,
  OBSERVATION_OUTCOMES,
  PERSONAL_TIME_STATEMENTS,
  reflectionLessonPath,
  reflectionThemePath,
  cleanReflectionField,
  cleanReflectionNote,
  reflectionCue,
  reflectionSpeech,
  screenForState,
  stateForScreen,
  type NextStepId,
  type ObservationOutcomeId,
  type ReflectionCue,
} from '@/lib/reflection';

type BreathPhase = 'ask' | 'breathe' | 'zero';

const REFLECTION_NAV = [
  ['reflection-selected', 'Guided QHRT Reflection'],
  ['reflection-evening', 'Picture One Specific Evening'],
  ['reflection-morning', 'Picture the Following Morning'],
  ['reflection-frustration', 'Hold Only the Morning Picture'],
  ['reflection-breathing', 'Keep the Morning Picture in Mind'],
  ['reflection-rerate', 'What Do You Notice Now?'],
  ['reflection-evening-return', 'Look at the Evening Picture Again'],
  ['reflection-morning-return', 'Look at the Morning Picture Again'],
  ['reflection-perspective', 'What Fits the Pictures Now?'],
  ['reflection-daily-life', 'Notice What Happens Naturally'],
  ['reflection-noticed', 'What Did You Notice?'],
  ['reflection-next', 'Your QHRT Reflection Is Complete'],
] as const;

type ContinueAction = { label: string; onPress: () => void; disabled?: boolean };

function ReflectionText({
  step,
  title,
  fallback,
  hidePoints = false,
}: {
  step?: GuideStep;
  title: string;
  fallback: string[];
  hidePoints?: boolean;
}) {
  const paragraphs = step && step.paragraphs.length > 0 ? step.paragraphs : fallback;
  const points = hidePoints ? [] : (step?.points ?? []);
  return (
    <>
      <Typography type="h1" weight="normal">{step?.title || title}</Typography>
      {paragraphs.map((line) => (
        <Typography key={line} type="body-sm" color="muted">{line}</Typography>
      ))}
      {points.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {points.map((item) => (
            <li key={item}>
              <Typography type="body-sm" color="muted">{item}</Typography>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function labeledPoint(point: string, fallbackTitle: string, fallbackBody: string) {
  const split = point.indexOf(':');
  if (split < 1) return { title: fallbackTitle, body: point || fallbackBody };
  return { title: point.slice(0, split).trim(), body: point.slice(split + 1).trim() || fallbackBody };
}

type SessionPayload = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  state: string;
  themeKey: string;
  sourceDomain?: string;
  themeSnapshot: string;
  clarifierSnapshot: string;
  customClarifierText: string;
  breathPhase: BreathPhase;
  ratings: number[];
  perspectiveText: string;
  observationChoice: string;
  observationNote: string;
  nextStep: string;
};

function speakInBrowser(text: string, onend: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onend();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.84;
  utterance.pitch = 0.95;
  utterance.onend = onend;
  utterance.onerror = onend;
  window.speechSynthesis.speak(utterance);
}

function BreathRhythm({ paused }: { paused: boolean }) {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (paused) return;
    const limit = phase === 'inhale' ? 3 : 5;
    const timer = window.setTimeout(() => {
      if (count >= limit) {
        setPhase((current) => (current === 'inhale' ? 'exhale' : 'inhale'));
        setCount(1);
      } else {
        setCount((current) => current + 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [count, paused, phase]);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="grid size-36 place-items-center rounded-full border border-foreground/15 bg-foreground/5 transition-transform duration-1000"
        style={{ transform: phase === 'inhale' && !paused ? 'scale(1.12)' : 'scale(0.86)' }}
        aria-hidden
      >
        <Typography type="body-sm">{phase === 'inhale' ? 'Inhale' : 'Exhale'}</Typography>
      </div>
      <Typography type="body">
        {phase === 'inhale' ? 'Inhale' : 'Exhale'} {count}
        {paused ? ' · Paused' : ''}
      </Typography>
      <Typography type="body-sm" color="muted" className="text-center">
        Inhale gently through your nose for 3. Exhale gently through your mouth for 5. During the exhale, gently engage your lower abdominal muscles.
      </Typography>
    </div>
  );
}

function RatingControl({
  value,
  onChange,
  prompt = 'How strong does the frustration feel right now?',
}: {
  value: number | null;
  onChange: (value: number) => void;
  prompt?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Typography type="body">{prompt}</Typography>
      <Typography type="body-sm" color="muted">
        0 = No frustration. 10 = Extremely strong frustration.
      </Typography>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, number) => (
          <button
            key={number}
            type="button"
            aria-pressed={value === number}
            className={`grid size-9 place-items-center rounded-md border text-sm ${
              value === number ? 'border-foreground bg-foreground text-background' : 'border-foreground/15'
            }`}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}

function isObservationId(value: string): value is ObservationOutcomeId {
  return OBSERVATION_OUTCOMES.some((item) => item.id === value);
}

function isNextStepId(value: string): value is NextStepId {
  return NEXT_STEPS.some((item) => item.id === value);
}

export default function ReflectionExperience({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState('');
  const [locked, setLocked] = useState(false);
  const [themeKey, setThemeKey] = useState('');
  const [sourceDomain, setSourceDomain] = useState('SLEEP');
  const [theme, setTheme] = useState('');
  const [statement, setStatement] = useState('');
  const [screen, setScreen] = useState(1);
  const [script, setScript] = useState<GuideStep[]>([]);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('ask');
  const [rating, setRating] = useState<number | null>(null);
  const [ratings, setRatings] = useState<number[]>([]);
  const [choice, setChoice] = useState('');
  const [custom, setCustom] = useState('');
  const [observation, setObservation] = useState<ObservationOutcomeId | ''>('');
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState<NextStepId | ''>('');
  const [breathPaused, setBreathPaused] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const playToken = useRef(0);
  const pausedRef = useRef(false);
  const saving = useRef(false);
  const lessonSlug = reflectionLessonPath(sourceDomain).split('/').filter(Boolean)[1] ?? '';

  useEffect(() => {
    if (!lessonSlug) return;
    const controller = new AbortController();
    void fetch(`/api/modules/${encodeURIComponent(lessonSlug)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { module?: { lessons?: { steps?: GuideStep[] }[] } };
        const lesson = body.module?.lessons?.find((item) => isReflectionLesson(item.steps ?? []));
        if (!controller.signal.aborted) setScript(lesson?.steps ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setScript([]);
      });
    return () => controller.abort();
  }, [lessonSlug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (sessionId === 'local') {
          const raw = sessionStorage.getItem('qhrt.reflection.local');
          const session = raw ? (JSON.parse(raw) as SessionPayload) : null;
          if (cancelled) return;
          if (!session) {
            setMissing('Choose a perspective in Life Transitions before starting a reflection.');
            return;
          }
          const spoken = cleanReflectionField(session.customClarifierText || session.clarifierSnapshot);
          setThemeKey(session.themeKey);
          setSourceDomain(session.sourceDomain || 'LIFE_TRANSITIONS');
          setTheme(session.themeSnapshot);
          setStatement(spoken);
          setScreen(1);
          setLoaded(true);
          return;
        }
        const response = await fetch(`/api/reflection/sessions/${sessionId}`, { credentials: 'same-origin' });
        const body = (await response.json()) as { session?: SessionPayload; error?: string };
        if (cancelled) return;
        if (!response.ok || !body.session) {
          setMissing(body.error || 'Choose a theme in Sleep Education before starting a reflection.');
          return;
        }
        const session = body.session;
        const spoken = cleanReflectionField(session.customClarifierText || session.clarifierSnapshot);
        setThemeKey(session.themeKey);
        setSourceDomain(session.sourceDomain || 'SLEEP');
        setTheme(session.themeSnapshot);
        setStatement(spoken);
        setScreen(screenForState(session.state));
        setBreathPhase(session.breathPhase);
        setRatings(session.ratings);
        setNote(session.observationNote);
        if (isObservationId(session.observationChoice)) setObservation(session.observationChoice);
        if (isNextStepId(session.nextStep)) setNextStep(session.nextStep);
        if (session.perspectiveText) {
          if ((PERSONAL_TIME_STATEMENTS as readonly string[]).includes(session.perspectiveText)) {
            setChoice(session.perspectiveText);
          } else {
            setChoice('custom');
            setCustom(session.perspectiveText);
          }
        }
        setLocked(session.status !== 'ACTIVE');
        setLoaded(true);
      } catch {
        if (!cancelled) setMissing('Choose a theme in Sleep Education before starting a reflection.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    pausedRef.current = breathPaused;
  }, [breathPaused]);

  const stopVoice = useCallback(() => {
    playToken.current += 1;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.pause();
      audio.removeAttribute('src');
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const playCue = useCallback(
    (cue: ReflectionCue) => {
      const spokenTheme = cleanReflectionField(theme);
      const spokenStatement = cleanReflectionField(statement);
      if (!spokenTheme || !spokenStatement) return Promise.resolve();
      const token = playToken.current + 1;
      playToken.current = token;
      setSpeaking(true);
      setVoiceNote('');
      const fallback = reflectionSpeech(cue, spokenTheme, spokenStatement, sourceDomain);
      return new Promise<void>((resolve) => {
        const finish = () => {
          if (playToken.current === token) setSpeaking(false);
          resolve();
        };
        void (async () => {
          try {
            const params = new URLSearchParams({
              cue,
              theme: spokenTheme,
              statement: spokenStatement,
              domain: sourceDomain,
              slug: reflectionLessonPath(sourceDomain).split('/').filter(Boolean)[1] ?? '',
            });
            const response = await fetch(`/api/reflection/voice?${params.toString()}`, { credentials: 'same-origin' });
            if (playToken.current !== token) {
              resolve();
              return;
            }
            if (response.ok && response.status === 200) {
              const blob = await response.blob();
              if (playToken.current !== token) {
                resolve();
                return;
              }
              if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
              const url = URL.createObjectURL(blob);
              objectUrlRef.current = url;
              const audio = audioRef.current ?? new Audio();
              audioRef.current = audio;
              audio.onended = null;
              audio.pause();
              audio.src = url;
              audio.onended = finish;
              audio.playbackRate = 1;
              await audio.play();
              if (pausedRef.current) audio.pause();
              return;
            }
            if (response.status === 204) setVoiceNote('Voice is not available right now. You can still read and continue.');
          } catch {
            setVoiceNote('Voice could not play. You can still read and continue.');
          }
          if (playToken.current !== token) {
            resolve();
            return;
          }
          speakInBrowser(fallback, finish);
        })();
      });
    },
    [sourceDomain, statement, theme]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (breathPaused) {
      audio?.pause();
      window.speechSynthesis?.pause();
      return;
    }
    window.speechSynthesis?.resume();
    if (audio && audio.src && audio.paused && !audio.ended) {
      void audio.play().catch(() => undefined);
    }
  }, [breathPaused]);

  useEffect(() => {
    if (!loaded) return;
    const cue = reflectionCue(screen, breathPhase);
    if (!cue) return;
    void playCue(cue);
    return () => stopVoice();
  }, [breathPhase, loaded, playCue, screen, stopVoice]);

  const perspectiveText = () => (choice === 'custom' ? cleanReflectionField(custom, 400) : choice);

  const persist = useCallback(
    async (patch: {
      state?: string;
      breathPhase?: BreathPhase;
      ratings?: number[];
      perspectiveText?: string;
      observationChoice?: string;
      observationNote?: string;
      nextStep?: string;
      status?: 'COMPLETED';
    }) => {
      if (locked || sessionId === 'local') return;
      const response = await fetch(`/api/reflection/sessions/${sessionId}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) setVoiceNote('This place in the reflection could not be saved.');
    },
    [locked, sessionId]
  );

  const leave = async (href: string, patch?: Parameters<typeof persist>[0]) => {
    stopVoice();
    if (patch) await persist(patch);
    router.push(href);
  };

  const go = (next: number, phase: BreathPhase = next === 6 ? 'ask' : breathPhase) => {
    stopVoice();
    setRating(null);
    setBreathPaused(false);
    if (next === 6) setBreathPhase('ask');
    setScreen(next);
    void persist({
      state: stateForScreen(next),
      breathPhase: phase,
      ratings,
      perspectiveText: perspectiveText(),
      observationChoice: observation,
      observationNote: cleanReflectionNote(note),
      nextStep,
    });
  };

  const saveRating = () => {
    if (rating === null || saving.current || locked) return;
    const value = rating;
    const nextRatings = [...ratings, value];
    setRatings(nextRatings);
    if (screen === 4) {
      saving.current = true;
      void playCue('after-rating').then(() => {
        saving.current = false;
        setRating(null);
        setBreathPaused(false);
        setScreen(5);
        void persist({ state: 'BREATHING', breathPhase: 'ask', ratings: nextRatings });
      });
      return;
    }
    if (value === 0) {
      setBreathPhase('zero');
      void persist({ state: 'RERATE', breathPhase: 'zero', ratings: nextRatings });
    } else {
      setRating(null);
      setBreathPhase('breathe');
      void persist({ state: 'RERATE', breathPhase: 'breathe', ratings: nextRatings });
    }
  };

  let pending: ContinueAction | null = null;
  const lessonHref = reflectionLessonPath(sourceDomain);
  const themesHref = missing.includes('Life Transitions')
    ? reflectionThemePath('LIFE_TRANSITIONS')
    : reflectionThemePath(sourceDomain);
  const place = () => ({
    state: stateForScreen(screen),
    breathPhase,
    ratings,
    perspectiveText: perspectiveText(),
    observationChoice: observation,
    observationNote: cleanReflectionNote(note),
    nextStep,
  });

  const progress = (
    <ProgressNav
      items={REFLECTION_NAV.map(([key, fallback], index) => ({
        id: String(index + 1),
        index: String(index + 1),
        label: script.find((item) => item.key === key)?.title || fallback,
        status: !loaded
          ? index === 0
            ? 'current'
            : 'upcoming'
          : index + 1 < screen
            ? 'complete'
            : index + 1 === screen
              ? 'current'
              : 'upcoming',
      }))}
      onSelect={(id) => {
        const next = Number(id);
        if (loaded && next >= 1 && next < screen) go(next);
      }}
    />
  );

  const frame = (children: React.ReactNode, key: string) => {
    const action = pending;
    pending = null;
    return (
      <FocusSessionLayout
        key={key}
        progressLabel="Guided QHRT Reflection"
        progress={progress}
        leadingActions={
          missing ? (
            <Link href={themesHref} className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
              Leave
            </Link>
          ) : loaded && screen <= 1 ? (
            <Button size="sm" variant="tertiary" onPress={() => void leave(lessonHref, place())}>
              Leave
            </Button>
          ) : loaded ? (
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                if (screen === 6 && breathPhase !== 'ask') {
                  stopVoice();
                  setRating(null);
                  setBreathPhase('ask');
                  void persist({ ...place(), state: 'RERATE', breathPhase: 'ask' });
                  return;
                }
                go(Math.max(1, screen - 1));
              }}
            >
              Back
            </Button>
          ) : null
        }
        actions={
          loaded && action ? (
            <>
              <Button size="sm" variant="ghost" onPress={() => setBreathPaused((current) => !current)}>
                {breathPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={speaking && !breathPaused}
                onPress={() => {
                  setBreathPaused(false);
                  const cue = reflectionCue(screen, breathPhase);
                  if (cue) void playCue(cue);
                }}
              >
                Replay
              </Button>
              <Button size="sm" variant="primary" isDisabled={action.disabled || locked} onPress={action.onPress}>
                {action.label}
              </Button>
            </>
          ) : null
        }
      >
        <div key={key} className="flex flex-col gap-6">
          {children}
          {voiceNote ? (
            <Typography type="body-xs" color="muted">
              {voiceNote}
            </Typography>
          ) : null}
        </div>
      </FocusSessionLayout>
    );
  };

  const controls = (onContinue: () => void, label = 'Continue', disabled = false) => {
    pending = { onPress: onContinue, label, disabled };
    return null;
  };

  if (missing) {
    return frame(
      <>
        <Typography type="h1" weight="normal">
          Choose a theme first
        </Typography>
        <Typography type="body-sm" color="muted">
          {missing} The guided reflection does not choose a theme for you.
        </Typography>
      </>,
      'missing'
    );
  }

  if (!loaded) {
    return frame(<Typography type="body-sm" color="muted">Loading this reflection…</Typography>, 'loading');
  }

  const step = (key: string) => script.find((item) => item.key === key);
  const button = (key: string, fallback: string) => step(key)?.section || fallback;

  if (screen === 1) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-selected')}
          title="Guided QHRT Reflection"
          fallback={[
            'You chose this because it feels relevant to something you have noticed in your own experience.',
            'You are not trying to determine why anything is happening.',
            'You are simply exploring something you have noticed.',
          ]}
        />
        <Typography type="body">Your selected theme: {theme}</Typography>
        <Typography type="body-sm" color="muted">You selected: {statement}</Typography>
        {controls(() => go(2), button('reflection-selected', 'Begin Guided Reflection'))}
      </>,
      'screen-1'
    );
  }

  if (screen === 2) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-evening')}
          title="Picture One Specific Evening"
          fallback={[
            'Bring to mind one real evening that represents the theme you selected.',
            'Create a single still-frame picture of that moment.',
          ]}
        />
        {controls(() => go(3), button('reflection-evening', 'I Have My Evening Picture'))}
      </>,
      'screen-2'
    );
  }

  if (screen === 3) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-morning')}
          title="Picture the Following Morning"
          fallback={['Now create a second still-frame picture.', 'Picture yourself the following morning.']}
        />
        {controls(() => go(4), button('reflection-morning', 'I Have My Morning Picture'))}
      </>,
      'screen-3'
    );
  }

  if (screen === 4) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-frustration')}
          title="Hold Only the Morning Picture"
          fallback={[
            'Let the evening picture go for now.',
            'Keep only the next-morning still-frame picture in mind.',
            'How strong does this frustration feel right now?',
          ]}
        />
        <RatingControl value={rating} onChange={setRating} />
        {controls(saveRating, button('reflection-frustration', 'Continue'), rating === null)}
      </>,
      'screen-4'
    );
  }

  if (screen === 5) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-breathing')}
          title="Keep the Morning Picture in Mind"
          fallback={[
            'Continue holding only the morning still-frame picture.',
            'Inhale gently through your nose for 3. Exhale gently through your mouth for 5.',
            'As you exhale, gently engage your lower abdominal muscles.',
          ]}
        />
        <BreathRhythm paused={breathPaused} />
        {controls(() => go(6), button('reflection-breathing', 'Continue When Ready'))}
      </>,
      'screen-5'
    );
  }

  if (screen === 6) {
    return frame(
      <>
        <Typography type="h1" weight="normal">
          {breathPhase === 'zero' ? 'Your frustration rating is now zero' : step('reflection-rerate')?.title || 'What Do You Notice Now?'}
        </Typography>
        {breathPhase === 'breathe' ? (
          <>
            <Typography type="body-sm" color="muted">
              {step('reflection-rerate')?.paragraphs[2] || 'If the number is above 0, return to the QHRT breathing sequence and repeat.'}
            </Typography>
            <BreathRhythm paused={breathPaused} />
            {controls(() => {
              setBreathPhase('ask');
              setRating(null);
              void persist({ state: 'RERATE', breathPhase: 'ask', ratings });
            })}
          </>
        ) : breathPhase === 'zero' ? (
          <>
            <Typography type="body-sm" color="muted">
              Let the morning picture rest for a moment. When you are ready, look again at the original evening picture.
            </Typography>
            {controls(() => go(7))}
          </>
        ) : (
          <>
            <Typography type="body-sm" color="muted">
              {step('reflection-rerate')?.paragraphs[0] || 'Keep the same morning picture in mind.'}
            </Typography>
            <Typography type="body">
              {step('reflection-rerate')?.paragraphs[1] || 'How strong does the frustration feel now?'}
            </Typography>
            <RatingControl value={rating} onChange={setRating} prompt="How strong does it feel now?" />
            {ratings.length > 0 ? (
              <Typography type="body-xs" color="muted">Earlier ratings: {ratings.join(', ')}</Typography>
            ) : null}
            {controls(saveRating, 'Continue', rating === null)}
          </>
        )}
      </>,
      `screen-6-${breathPhase}`
    );
  }

  if (screen === 7) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-evening-return')}
          title="Look at the Evening Picture Again"
          fallback={[
            'Bring the original evening still-frame picture back to mind.',
            'Notice it without trying to make anything happen.',
            'Do not choose a new perspective yet. Simply notice the picture.',
          ]}
        />
        {controls(() => go(8), button('reflection-evening-return', 'Continue'))}
      </>,
      'screen-7'
    );
  }

  if (screen === 8) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-morning-return')}
          title="Look at the Morning Picture Again"
          fallback={[
            'Bring the original morning still-frame picture back to mind.',
            'Notice it without trying to make anything happen.',
            'There is no need to force either picture to change. Simply notice what is different, similar, or new.',
          ]}
        />
        {controls(() => go(9), button('reflection-morning-return', 'Continue'))}
      </>,
      'screen-8'
    );
  }

  if (screen === 9) {
    const statements = themeKey === 'PERSONAL_TIME' ? PERSONAL_TIME_STATEMENTS : [];
    const ready = statements.length === 0 ? Boolean(cleanReflectionField(custom)) : choice === 'custom' ? Boolean(cleanReflectionField(custom)) : Boolean(choice);
    return frame(
      <>
        <ReflectionText
          step={step('reflection-perspective')}
          title="What Fits the Pictures Now?"
          fallback={['Consider the change you noticed in the evening and morning pictures.', 'Which statement best reflects what you noticed?']}
          hidePoints
        />
        <div className="flex flex-col gap-2">
          {statements.map((item) => (
            <label key={item} className="flex items-start gap-3 text-sm">
              <input type="radio" name="perspective" checked={choice === item} onChange={() => setChoice(item)} />
              <span>{item}</span>
            </label>
          ))}
          <label className="flex items-start gap-3 text-sm">
            <input type="radio" name="perspective" checked={choice === 'custom'} onChange={() => setChoice('custom')} />
            <span>Something different</span>
          </label>
          {statements.length === 0 || choice === 'custom' ? (
            <textarea
              className="min-h-20 rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
            />
          ) : null}
        </div>
        {controls(() => go(10), 'Continue', !ready)}
      </>,
      'screen-9'
    );
  }

  if (screen === 10) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-daily-life')}
          title="Notice What Happens Naturally"
          fallback={[
            'You have completed this Guided QHRT Reflection.',
            'There is nothing you need to force yourself to do differently.',
            'Let your everyday experience provide the information.',
          ]}
        />
        {controls(
          () => void leave('/home', { state: 'OBSERVATION', breathPhase: 'ask', ratings, perspectiveText: perspectiveText() }),
          button('reflection-daily-life', 'Begin Observation')
        )}
      </>,
      'screen-10'
    );
  }

  if (screen === 11) {
    return frame(
      <>
        <ReflectionText
          step={step('reflection-noticed')}
          title="What Did You Notice?"
          fallback={['When you return, choose the description that fits your experience best.']}
          hidePoints
        />
        <div className="flex flex-col gap-3">
          {OBSERVATION_OUTCOMES.map((item) => (
            <label key={item.id} className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="observation"
                checked={observation === item.id}
                onChange={() => setObservation(item.id)}
              />
              <span>
                <span className="block">{item.title}</span>
                <span className="block text-muted">{item.body}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-2 text-sm">
          What did I notice about my evening choices and my next-morning experience?
          <textarea
            className="min-h-24 rounded-md border border-foreground/15 bg-transparent px-3 py-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {controls(() => {
          if (!observation) return;
          if (observation === 'not-enough') {
            void leave('/home', {
              state: 'OBSERVATION',
              observationChoice: observation,
              observationNote: cleanReflectionNote(note),
              ratings,
              perspectiveText: perspectiveText(),
            });
            return;
          }
          setScreen(12);
          void persist({
            state: 'NEXT_STEP',
            observationChoice: observation,
            observationNote: cleanReflectionNote(note),
            ratings,
            perspectiveText: perspectiveText(),
          });
        }, 'Continue', !observation)}
      </>,
      'screen-11'
    );
  }

  return frame(
    <>
      <ReflectionText
        step={step('reflection-next')}
        title="Your QHRT Reflection Is Complete"
        fallback={['You can now choose what you would like to do next.', `You explored: ${theme}`]}
        hidePoints
      />
      <div className="flex flex-col gap-3">
        {NEXT_STEPS.map((item, index) => {
          const fromLesson = step('reflection-next')?.points[index];
          const labeled = fromLesson ? labeledPoint(fromLesson, item.title, item.body) : { title: item.title, body: item.body };
          const title = labeled.title;
          const body = labeled.body;
          return (
          <label key={item.id} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="next"
              checked={nextStep === item.id}
              onChange={() => setNextStep(item.id)}
            />
            <span>
              <span className="block">{title}</span>
              <span className="block text-muted">{body}</span>
            </span>
          </label>
          );
        })}
      </div>
      <Typography type="body-sm" color="muted">
        Work with one theme at a time. Observe what you notice in real life. Return whenever another aspect feels worth exploring.
      </Typography>
      {controls(() => {
        if (!nextStep) return;
        const href = nextStep === 'another' ? reflectionThemePath(sourceDomain) : nextStep === 'sleep' ? reflectionLessonPath(sourceDomain) : '/home';
        void leave(href, {
          state: 'NEXT_STEP',
          status: 'COMPLETED',
          nextStep,
          observationChoice: observation,
          observationNote: cleanReflectionNote(note),
          perspectiveText: perspectiveText(),
          ratings,
        });
      }, 'Continue', !nextStep)}
    </>,
    'screen-12'
  );
}
