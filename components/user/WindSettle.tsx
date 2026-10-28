'use client';

import { useState } from 'react';
import { Button, Typography } from '@heroui/react';
import { usePhaseTimer } from '@/components/user/usePhaseTimer';

const STEP_MS = 5000;
const STEPS = [
  'soften your gaze',
  'drop your shoulders',
  'let the jaw go',
  'stay with the quiet',
] as const;

const STARS = [
  { x: 12, y: 18, s: 1.4 },
  { x: 28, y: 11, s: 1 },
  { x: 41, y: 22, s: 0.8 },
  { x: 63, y: 14, s: 1.2 },
  { x: 78, y: 9, s: 0.9 },
  { x: 88, y: 24, s: 1.1 },
  { x: 8, y: 42, s: 0.7 },
  { x: 22, y: 36, s: 1 },
  { x: 54, y: 31, s: 0.8 },
  { x: 71, y: 38, s: 1.3 },
  { x: 91, y: 44, s: 0.9 },
  { x: 16, y: 58, s: 1.1 },
  { x: 37, y: 51, s: 0.7 },
  { x: 59, y: 62, s: 1 },
  { x: 84, y: 56, s: 0.8 },
  { x: 7, y: 74, s: 1.2 },
  { x: 33, y: 78, s: 0.9 },
  { x: 48, y: 70, s: 0.7 },
  { x: 69, y: 81, s: 1.1 },
  { x: 93, y: 72, s: 1 },
] as const;

function WindMoon({ fill, depth }: { fill: number; depth: number }) {
  const glow = 0.22 + depth * 0.08 + fill * 0.2;
  return (
    <svg viewBox="0 0 200 200" className="size-[min(58vmin,22rem)]" aria-hidden>
      <defs>
        <radialGradient id="wind-moon-fill" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="78" fill="currentColor" opacity={glow * 0.18} />
      <circle cx="100" cy="100" r="52" fill="url(#wind-moon-fill)" />
      <circle cx="84" cy="86" r="8" fill="currentColor" opacity="0.12" />
      <circle cx="112" cy="104" r="12" fill="currentColor" opacity="0.1" />
      <circle cx="96" cy="118" r="6" fill="currentColor" opacity="0.14" />
    </svg>
  );
}

function Ring({ fill }: { fill: number }) {
  return (
    <svg viewBox="0 0 120 120" className="absolute size-[min(68vmin,26rem)]" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * 2 * 54}`}
        strokeDashoffset={`${Math.PI * 2 * 54 * (1 - fill)}`}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

export default function WindSettle({ onFinished }: { onFinished?: () => void } = {}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const running = started && step < STEPS.length;
  const rest = started && step >= STEPS.length;
  const { fill, remaining } = usePhaseTimer(running, STEP_MS, () => setWaiting(true), step);
  const depth = rest ? 1 : Math.min(step, STEPS.length) / STEPS.length;
  const night = rest ? 0.55 : 0.08 + depth * 0.35 + (waiting ? 0.12 : fill * 0.12);
  const cue = rest
    ? 'stay here as long as you like'
    : running
      ? STEPS[step]
      : 'click to start';

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-700"
        style={{ opacity: night }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 text-white" aria-hidden>
        {STARS.map((star, index) => (
          <span
            key={index}
            className="wind-star absolute rounded-full bg-current"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.s * 2,
              height: star.s * 2,
              opacity: 0.15 + depth * 0.55 + fill * 0.2,
            }}
          />
        ))}
      </div>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">
        <button
          type="button"
          disabled={started}
          onClick={() => setStarted(true)}
          aria-label={cue}
          className="relative flex flex-col items-center gap-10 outline-none disabled:cursor-default"
        >
          <span className="relative flex size-[min(72vmin,30rem)] items-center justify-center text-foreground">
            <Ring fill={running ? fill : rest ? 1 : 0} />
            <span
              className={!started ? 'wind-moon--idle' : ''}
              style={
                started
                  ? {
                      transform: `scale(${1 - depth * 0.12 - fill * 0.06})`,
                      opacity: 1 - depth * 0.15,
                      transition: 'transform 400ms ease, opacity 400ms ease',
                    }
                  : undefined
              }
            >
              <WindMoon fill={running ? fill : 0} depth={depth} />
            </span>
            {running ? (
              <span className="pointer-events-none absolute text-3xl tabular-nums text-foreground">
                {waiting ? 0 : remaining}
              </span>
            ) : null}
          </span>
          <Typography type="body" color="muted" className="italic lowercase" aria-live="polite">
            {cue}
          </Typography>
        </button>
        {waiting && !rest ? (
          <Button
            variant="primary"
            onPress={() => {
              setWaiting(false);
              setStep((value) => value + 1);
            }}
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
          </Button>
        ) : null}
        {rest && onFinished ? (
          <Button variant="primary" onPress={onFinished}>
            Continue
          </Button>
        ) : null}
      </main>
    </>
  );
}
