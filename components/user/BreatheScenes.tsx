'use client';

import { useEffect, useState } from 'react';

export const BREATHE_SCENES = [
  { id: 'orb', label: 'Orb' },
  { id: 'flower', label: 'Flower' },
  { id: 'balloon', label: 'Balloon' },
] as const;

export type BreatheSceneId = (typeof BREATHE_SCENES)[number]['id'];

const FLOWER_PETALS = [0, 45, 90, 135, 180, 225, 270, 315];

export function BreatheFlower() {
  return (
    <svg viewBox="0 0 200 200" className="breathe-flower size-[min(64vmin,24rem)]" aria-hidden>
      {FLOWER_PETALS.map((deg) => (
        <ellipse
          key={`outer-${deg}`}
          cx="100"
          cy="56"
          rx="18"
          ry="38"
          fill="oklch(0.84 0.06 350)"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
      {FLOWER_PETALS.map((deg) => (
        <ellipse
          key={`inner-${deg}`}
          cx="100"
          cy="68"
          rx="12"
          ry="26"
          fill="oklch(0.74 0.1 12)"
          transform={`rotate(${deg + 22} 100 100)`}
        />
      ))}
      <circle cx="100" cy="100" r="16" fill="oklch(0.88 0.08 92)" />
      <circle cx="100" cy="100" r="7" fill="oklch(0.72 0.09 72)" />
    </svg>
  );
}

export function BreatheBalloon() {
  return (
    <svg
      viewBox="0 0 220 270"
      className="breathe-balloon h-[min(62vmin,24rem)] w-auto overflow-visible"
      aria-hidden
    >
      <defs>
        <clipPath id="breathe-balloon-envelope">
          <path d="M110 16c42 0 74 38 74 84 0 42-30 78-60 90-8 4-20 4-28 0-30-12-60-48-60-90 0-46 32-84 74-84z" />
        </clipPath>
        <linearGradient id="breathe-balloon-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath="url(#breathe-balloon-envelope)">
        <rect x="28" y="8" width="164" height="200" fill="oklch(0.86 0.045 42)" />
        <rect x="56" y="8" width="24" height="200" fill="oklch(0.76 0.09 28)" />
        <rect x="100" y="8" width="24" height="200" fill="oklch(0.82 0.06 78)" />
        <rect x="144" y="8" width="24" height="200" fill="oklch(0.8 0.05 210)" />
        <ellipse cx="84" cy="72" rx="24" ry="40" fill="url(#breathe-balloon-sheen)" />
      </g>
      <path d="M96 188c5 12 23 12 28 0" fill="oklch(0.72 0.06 40)" />
      <path
        d="M90 190 L106 220 M130 190 L114 220"
        stroke="oklch(0.55 0.03 60)"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="94" y="216" width="32" height="24" rx="4" fill="oklch(0.64 0.06 68)" />
      <path d="M94 223h32M94 230h32" stroke="oklch(0.5 0.04 62)" strokeWidth="1" />
    </svg>
  );
}

export function BreatheClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="breathe-cloud breathe-cloud--a" />
      <span className="breathe-cloud breathe-cloud--b" />
      <span className="breathe-cloud breathe-cloud--c" />
    </div>
  );
}

type BirdFlight = {
  id: number;
  top: string;
  duration: number;
  scale: number;
  reverse: boolean;
};

function BirdMark() {
  return (
    <svg viewBox="0 0 48 18" className="breathe-bird-shape h-4 w-10" aria-hidden>
      <path d="M24 11C18 11 9 3 1 6c10 1 16 7 23 5z" />
      <path d="M24 11c6 0 15-8 23-5-10 1-16 7-23 5z" />
    </svg>
  );
}

export function BreatheBirds() {
  const [birds, setBirds] = useState<BirdFlight[]>([]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;

    let alive = true;
    const timers = new Set<number>();
    let nextId = 0;

    const launch = () => {
      if (!alive) return;
      const id = nextId;
      nextId += 1;
      const duration = 9 + Math.random() * 11;
      const bird: BirdFlight = {
        id,
        top: `${4 + Math.random() * 46}%`,
        duration,
        scale: 0.55 + Math.random() * 0.75,
        reverse: Math.random() > 0.5,
      };
      setBirds((current) => [...current, bird].slice(-5));
      timers.add(
        window.setTimeout(() => {
          setBirds((current) => current.filter((item) => item.id !== id));
        }, duration * 1000),
      );
      timers.add(window.setTimeout(launch, 1600 + Math.random() * 4800));
    };

    timers.add(window.setTimeout(launch, 300 + Math.random() * 1400));
    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {birds.map((bird) => (
        <span
          key={bird.id}
          className={`breathe-bird${bird.reverse ? ' breathe-bird--reverse' : ''}`}
          style={{
            top: bird.top,
            animationDuration: `${bird.duration}s`,
            ['--breathe-bird-scale' as string]: String(bird.scale),
          }}
        >
          <BirdMark />
        </span>
      ))}
    </div>
  );
}
