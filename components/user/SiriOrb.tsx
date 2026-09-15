'use client';

import type { CSSProperties } from 'react';

interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
}

export default function SiriOrb({
  size = '192px',
  className,
  colors,
  animationDuration = 20,
}: SiriOrbProps) {
  const defaultColors = {
    bg: 'transparent',
    c1: 'oklch(75% 0.15 350)',
    c2: 'oklch(80% 0.12 200)',
    c3: 'oklch(78% 0.14 280)',
  };

  const finalColors = { ...defaultColors, ...colors };
  const sizeValue = Number.parseInt(size, 10);
  const blurAmount = Number.isFinite(sizeValue) ? Math.max(sizeValue * 0.08, 8) : 24;
  const contrastAmount = Number.isFinite(sizeValue) ? Math.max(sizeValue * 0.003, 1.8) : 1.8;

  return (
    <div
      aria-hidden
      className={['siri-orb', className].filter(Boolean).join(' ')}
      style={
        {
          width: size,
          height: size,
          '--bg': finalColors.bg,
          '--c1': finalColors.c1,
          '--c2': finalColors.c2,
          '--c3': finalColors.c3,
          '--animation-duration': `${animationDuration}s`,
          '--blur-amount': `${blurAmount}px`,
          '--contrast-amount': contrastAmount,
        } as CSSProperties
      }
    />
  );
}
