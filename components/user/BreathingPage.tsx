'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button, Typography } from '@heroui/react';
import SiriOrb from '@/components/user/SiriOrb';
import {
  BREATHE_SCENES,
  BreatheBalloon,
  BreatheBirds,
  BreatheClouds,
  BreatheFlower,
  BreatheFlowerField,
  type BreatheSceneId,
} from '@/components/user/BreatheScenes';

const SCENE_STORAGE_KEY = 'qhrt-breathe-scene';

const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const REST_SCALE = 0.55;
const FULL_SCALE = 1;

type Phase = 'idle' | 'inhale' | 'exhale';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

function cueFor(phase: Phase): string {
  if (phase === 'inhale') return 'breathe in';
  if (phase === 'exhale') return 'breathe out';
  return "whenever you're ready";
}

export default function BreathingPage({
  embedded = false,
  title,
  onFinished,
}: {
  embedded?: boolean;
  title?: string;
  onFinished?: () => void;
} = {}) {
  const { resolvedTheme } = useTheme();
  const reduceMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [scale, setScale] = useState(REST_SCALE);
  const [scene, setScene] = useState<BreatheSceneId>('orb');
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(SCENE_STORAGE_KEY);
    if (saved === 'orb' || saved === 'flower' || saved === 'balloon') setScene(saved);
  }, []);

  useEffect(() => {
    if (phase === 'idle') return;
    const ms = phase === 'inhale' ? INHALE_MS : EXHALE_MS;
    const id = window.setTimeout(() => {
      if (phase === 'inhale') {
        setPhase('exhale');
        return;
      }
      setCycles((count) => count + 1);
      setPhase('inhale');
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'idle') {
      setScale(REST_SCALE);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setScale(phase === 'inhale' ? FULL_SCALE : REST_SCALE);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const start = () => {
    if (phase !== 'idle') return;
    setPhase('inhale');
  };

  const durationMs = phase === 'exhale' ? EXHALE_MS : INHALE_MS;
  const lift =
    scene !== 'balloon' || phase === 'idle'
      ? ''
      : phase === 'inhale'
        ? ' translateY(-18%)'
        : ' translateY(8%)';

  const chooseScene = (next: BreatheSceneId) => {
    setScene(next);
    window.localStorage.setItem(SCENE_STORAGE_KEY, next);
  };

  const readyToContinue = embedded && cycles >= 3;

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background ${
        embedded ? 'min-h-[28rem]' : ''
      }`}
    >
      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">
        {embedded && title ? (
          <Typography type="h4" weight="normal">
            {title}
          </Typography>
        ) : null}
        {scene === 'balloon' ? (
          <>
            <BreatheClouds />
            <BreatheBirds />
          </>
        ) : null}
        {scene === 'flower' ? <BreatheFlowerField /> : null}
        <button
          type="button"
          onClick={start}
          aria-label={phase === 'idle' ? 'Start breathing exercise' : cueFor(phase)}
          className="relative z-10 flex flex-col items-center gap-10 outline-none"
        >
          <span className="relative flex size-[min(72vmin,30rem)] items-center justify-center">
            <span
              className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
                phase === 'idle' && !reduceMotion ? 'breathe-bubble--idle' : ''
              }`}
              style={
                phase === 'idle'
                  ? undefined
                  : {
                      transform: `scale(${scale})${lift}`,
                      transition: reduceMotion
                        ? 'none'
                        : `transform ${durationMs}ms ease-in-out`,
                    }
              }
            >
              {scene === 'flower' ? (
                <BreatheFlower />
              ) : scene === 'balloon' ? (
                <BreatheBalloon />
              ) : (
                <SiriOrb
                  key={resolvedTheme ?? 'light'}
                  size="min(70vmin, 28rem)"
                  className="drop-shadow-2xl"
                />
              )}
            </span>
          </span>
          <Typography
            type="body"
            color="muted"
            className="italic lowercase"
            aria-live="polite"
          >
            {cueFor(phase)}
          </Typography>
        </button>
        <div role="radiogroup" aria-label="Breathing visual" className="relative z-10 flex gap-1">
          {BREATHE_SCENES.map((option) => {
            const selected = scene === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseScene(option.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-opacity hover:opacity-70 ${
                  selected ? 'bg-foreground/8 text-foreground' : 'text-muted'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {readyToContinue ? (
          <Button variant="primary" onPress={onFinished}>
            Continue
          </Button>
        ) : null}
      </main>
    </div>
  );
}
