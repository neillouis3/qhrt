'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography } from '@heroui/react';
import {
  NEXT_STEPS,
  OBSERVATION_OUTCOMES,
  PERSONAL_TIME_STATEMENTS,
  SLEEP_THEME_PATH,
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

type SessionPayload = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  state: string;
  themeKey: string;
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
  const [theme, setTheme] = useState('');
  const [statement, setStatement] = useState('');
  const [screen, setScreen] = useState(1);
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
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
      const fallback = reflectionSpeech(cue, spokenTheme, spokenStatement);
      return new Promise<void>((resolve) => {
        const finish = () => {
          if (playToken.current === token) setSpeaking(false);
          resolve();
        };
        void (async () => {
          try {
            const params = new URLSearchParams({ cue, theme: spokenTheme, statement: spokenStatement });
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
    [statement, theme]
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
      if (locked) return;
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

  const frame = (children: React.ReactNode, key: string) => (
    <div className="flex min-h-svh w-full flex-col items-center bg-background px-6 py-10">
      <div key={key} className="readiness-step my-auto flex w-full max-w-lg flex-col gap-6">
        <Typography type="body-xs" color="muted">
          Guided QHRT Reflection
        </Typography>
        {children}
        {voiceNote ? (
          <Typography type="body-xs" color="muted">
            {voiceNote}
          </Typography>
        ) : null}
      </div>
    </div>
  );

  const controls = (onContinue: () => void, label = 'Continue', disabled = false) => (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" onPress={() => setBreathPaused((current) => !current)}>
        {breathPaused ? 'Resume' : 'Pause'}
      </Button>
      <Button
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
      <Button variant="primary" isDisabled={disabled || locked} onPress={onContinue}>
        {label}
      </Button>
      <Button
        variant="ghost"
        onPress={() =>
          void leave('/modules/sleep', {
            state: stateForScreen(screen),
            breathPhase,
            ratings,
            perspectiveText: perspectiveText(),
            observationChoice: observation,
            observationNote: cleanReflectionNote(note),
            nextStep,
          })
        }
      >
        Exit and Return Later
      </Button>
    </div>
  );

  if (missing) {
    return frame(
      <>
        <Typography type="h1" weight="normal">
          Choose a theme first
        </Typography>
        <Typography type="body-sm" color="muted">
          {missing} The guided reflection does not choose a theme for you.
        </Typography>
        <Link href={SLEEP_THEME_PATH} className="text-sm underline-offset-4 hover:underline">
          Return to the Sleep theme selector
        </Link>
      </>,
      'missing'
    );
  }

  if (!loaded) {
    return frame(<Typography type="body-sm" color="muted">Loading this reflection…</Typography>, 'loading');
  }

  if (screen === 1) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Your Selected QHRT Reflection</Typography>
        <Typography type="body">You chose: {theme}</Typography>
        <Typography type="body-sm" color="muted">You previously selected: {statement}</Typography>
        <Typography type="body-sm" color="muted">Take a moment to read the statement again.</Typography>
        {controls(() => go(2))}
      </>,
      'screen-1'
    );
  }

  if (screen === 2) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Picture One Specific Evening</Typography>
        <Typography type="body-sm" color="muted">
          Bring to mind one real evening that represents the theme you selected. Create a single still-frame picture of one specific moment.
        </Typography>
        <Typography type="body-sm" color="muted">
          For example, with the theme Personal Time, the picture might be sitting comfortably watching a recorded show, enjoying an alcoholic drink, and deciding to continue watching rather than ending the evening. Your picture may be completely different.
        </Typography>
        {controls(() => go(3), 'I Have My Evening Picture')}
      </>,
      'screen-2'
    );
  }

  if (screen === 3) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Picture the Following Morning</Typography>
        <Typography type="body-sm" color="muted">
          Create a second still-frame picture of yourself the following morning. You may picture waking tired, wanting to stay in bed, moving more slowly than you would prefer, wishing you felt more refreshed, or noticing frustration about the choice you made the evening before.
        </Typography>
        {controls(() => go(4), 'I Have My Morning Picture')}
      </>,
      'screen-3'
    );
  }

  if (screen === 4) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Hold Only the Morning Picture</Typography>
        <Typography type="body-sm" color="muted">
          Let the evening picture go for now. Notice any frustration you feel about having made the evening choice you now associate with this next-morning experience.
        </Typography>
        <RatingControl value={rating} onChange={setRating} />
        {controls(saveRating, 'Continue', rating === null)}
      </>,
      'screen-4'
    );
  }

  if (screen === 5) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Keep the Morning Picture in Mind</Typography>
        <Typography type="body-sm" color="muted">Continue holding only the morning still-frame picture.</Typography>
        <BreathRhythm paused={breathPaused} />
        {controls(() => go(6), 'Continue When Ready')}
      </>,
      'screen-5'
    );
  }

  if (screen === 6) {
    return frame(
      <>
        <Typography type="h1" weight="normal">
          {breathPhase === 'zero' ? 'Your frustration rating is now zero' : 'What Do You Notice Now?'}
        </Typography>
        {breathPhase === 'breathe' ? (
          <>
            <Typography type="body-sm" color="muted">
              Return to the breathing sequence. Keep the same morning picture gently in mind.
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
            <Typography type="body-sm" color="muted">Continue holding the same morning still-frame picture.</Typography>
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
        <Typography type="h1" weight="normal">Look at the Evening Picture Again</Typography>
        <Typography type="body-sm" color="muted">
          Bring the original evening still-frame picture back to mind. Do not try to make anything happen. Simply notice it.
        </Typography>
        <Typography type="body">What do I notice now when I picture this evening?</Typography>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {[
            'your choice in the picture has shifted',
            'the timing has shifted',
            'what you are doing has shifted',
            'the amount of time you continue has shifted',
            'something else about the picture feels different',
            'the picture remains similar',
          ].map((item) => (
            <li key={item}><Typography type="body-sm" color="muted">{item}</Typography></li>
          ))}
        </ul>
        {controls(() => go(8))}
      </>,
      'screen-7'
    );
  }

  if (screen === 8) {
    return frame(
      <>
        <Typography type="h1" weight="normal">Look at the Morning Picture Again</Typography>
        <Typography type="body-sm" color="muted">
          Bring the original morning still-frame picture back to mind. Notice it without trying to force anything. Notice how the evening and morning pictures have shifted.
        </Typography>
        <Typography type="body">What do I notice now when I picture this morning?</Typography>
        <Typography type="body-sm" color="muted">
          In the evening picture, you may now see yourself making a different choice. In the morning picture, you may now see yourself waking without the tiredness that was present in the original picture.
        </Typography>
        {controls(() => go(9))}
      </>,
      'screen-8'
    );
  }

  if (screen === 9) {
    const statements = themeKey === 'PERSONAL_TIME' ? PERSONAL_TIME_STATEMENTS : [];
    const ready = statements.length === 0 ? Boolean(cleanReflectionField(custom)) : choice === 'custom' ? Boolean(cleanReflectionField(custom)) : Boolean(choice);
    return frame(
      <>
        <Typography type="h1" weight="normal">What Fits the Pictures Now?</Typography>
        <Typography type="body-sm" color="muted">
          Consider the change you noticed between the original pictures and the pictures you see now. Choose the statement that feels most accurate, or write your own.
        </Typography>
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
        <Typography type="h1" weight="normal">Notice What Happens Naturally</Typography>
        <Typography type="body-sm" color="muted">
          There is nothing you need to force. Over the next several evenings, simply notice your actual choices and experience.
        </Typography>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {[
            'what you choose to do',
            'when you choose to stop',
            'whether your evening activities feel different',
            'whether the perspective you selected feels relevant',
            'what you notice the following morning',
            'anything new that becomes noticeable',
          ].map((item) => (
            <li key={item}><Typography type="body-sm" color="muted">{item}</Typography></li>
          ))}
        </ul>
        {controls(
          () => void leave('/home', { state: 'OBSERVATION', breathPhase: 'ask', ratings, perspectiveText: perspectiveText() }),
          'Begin Observation'
        )}
      </>,
      'screen-10'
    );
  }

  if (screen === 11) {
    return frame(
      <>
        <Typography type="h1" weight="normal">What Happened in Everyday Life?</Typography>
        <Typography type="body-sm" color="muted">When you return, choose the description that fits best.</Typography>
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
      <Typography type="h1" weight="normal">What Would You Like to Do Next?</Typography>
      <Typography type="body-sm" color="muted">
        You have completed this Guided QHRT Reflection for: {theme}
      </Typography>
      <div className="flex flex-col gap-3">
        {NEXT_STEPS.map((item) => (
          <label key={item.id} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="next"
              checked={nextStep === item.id}
              onChange={() => setNextStep(item.id)}
            />
            <span>
              <span className="block">{item.title}</span>
              <span className="block text-muted">{item.body}</span>
            </span>
          </label>
        ))}
      </div>
      <Typography type="body-sm" color="muted">
        Work with one theme at a time. Observe what you notice in real life. Return whenever another aspect of your sleep experience feels worth exploring.
      </Typography>
      {controls(() => {
        if (!nextStep) return;
        const href = nextStep === 'another' ? SLEEP_THEME_PATH : nextStep === 'sleep' ? '/modules/sleep' : '/home';
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
