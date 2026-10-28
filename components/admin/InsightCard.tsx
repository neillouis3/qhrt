'use client';

import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';

export type InsightTone = 'meadow' | 'mist' | 'bloom' | 'dusk';

const TONE = {
  meadow: {
    bar: 'bg-emerald-500',
    spark: 'text-emerald-600 dark:text-emerald-400',
  },
  mist: {
    bar: 'bg-sky-500',
    spark: 'text-sky-600 dark:text-sky-400',
  },
  bloom: {
    bar: 'bg-rose-400',
    spark: 'text-rose-500 dark:text-rose-400',
  },
  dusk: {
    bar: 'bg-violet-400',
    spark: 'text-violet-500 dark:text-violet-300',
  },
} as const;

export function InsightSpark({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 88;
  const height = 28;
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-7 w-[5.5rem] ${className ?? 'text-foreground'}`}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InsightCard({
  tone,
  label,
  value,
  hint,
  extra,
  spark,
  active,
  onPress,
}: {
  tone: InsightTone;
  label: string;
  value: string | number;
  hint?: string;
  extra?: ReactNode;
  spark?: number[];
  active?: boolean;
  onPress?: () => void;
}) {
  const colors = TONE[tone];
  const className = `flex w-full flex-col gap-3 rounded-lg bg-default/30 p-5 text-left transition-colors ${
    active ? 'ring-1 ring-foreground/25' : onPress ? 'hover:bg-default/45' : ''
  }`;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className={`mt-0.5 size-2 shrink-0 rounded-full ${colors.bar}`} aria-hidden />
          <Typography type="body-xs" color="muted">
            {label}
          </Typography>
        </span>
        {spark && spark.length > 1 ? (
          <InsightSpark values={spark} className={colors.spark} />
        ) : null}
      </div>
      <Typography type="h3" weight="normal">
        {value}
      </Typography>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {extra}
        {hint ? (
          <Typography type="body-xs" color="muted">
            {hint}
          </Typography>
        ) : null}
      </div>
    </>
  );
  if (!onPress) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <button type="button" onClick={onPress} className={className}>
      {inner}
    </button>
  );
}
