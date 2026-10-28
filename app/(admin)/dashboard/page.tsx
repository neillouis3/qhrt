/**
 * Admin dashboard — signups, sessions, ratings, and stress impact.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Button, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { PageHeader } from '@/components/layout/UserPageShell';
import { DashboardBodySkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';
import ErrorState from '@/components/layout/ErrorState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  // Overview
  totalUsers: number;
  totalSessions: number;
  intakeCompleted: number;
  activeUsers7d: number;
  activeUsers30d: number;

  // Trends (last 30 days)
  signupsByDay: Array<{ date: string; count: number }>;
  sessionsByDay: Array<{ date: string; count: number }>;
  moodByDay: Array<{ date: string; avg_mood: number | null }> | null;

  // Ratings & feedback
  ratingDistribution: {
    distribution: Record<number, number>;
    total: number;
    avgRating: number;
  } | null;

  // Stress metrics
  stressReduction: {
    avgBefore: number;
    avgAfter: number;
    reductionPercent: number;
    userCount: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Tooltip Portal Component
// ---------------------------------------------------------------------------

interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipContent {
  label: string;
  value: string | number;
  date: string;
}

function ChartTooltip({
  position,
  content,
}: {
  position: TooltipPosition | null;
  content: TooltipContent | null;
}) {
  if (!position || !content) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] rounded-lg bg-default/90 px-3 py-2"
      style={{
        left: position.x,
        top: position.y - 50,
        transform: 'translateX(-50%)',
      }}
    >
      <p className="text-sm">{content.value} {content.label}</p>
      <p className="text-xs text-muted">{content.date}</p>
    </div>,
    document.body
  );
}

function parseDay(date: string): Date {
  const parts = date.slice(0, 10).split('-');
  const year = Number(parts[0] ?? 0);
  const month = Number(parts[1] ?? 1);
  const day = Number(parts[2] ?? 1);
  return new Date(year, month - 1, day);
}

function formatDay(date: string): string {
  return parseDay(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatDayLong(date: string): string {
  return parseDay(date).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function integerTicks(max: number): number[] {
  const top = Math.max(Math.ceil(max), 1);
  if (top <= 1) return [1, 0];
  if (top === 2) return [2, 1, 0];
  const ticks = [top, Math.round((top * 2) / 3), Math.round(top / 3), 0];
  return ticks.filter((value, index, all) => all.indexOf(value) === index);
}

function xTickIndexes(length: number): number[] {
  if (length <= 7) return Array.from({ length }, (_, i) => i);
  const ticks = new Set<number>([0, length - 1]);
  for (let k = 1; k <= 3; k++) {
    ticks.add(Math.round((k / 4) * (length - 1)));
  }
  return [...ticks].sort((a, b) => a - b);
}

function chartXLabels(data: Array<{ date: string }>, length: number) {
  const labels: Array<{ index: number; date: string; count: number }> = [];
  for (const index of xTickIndexes(length)) {
    const point = data[index];
    if (point === undefined) continue;
    labels.push({ index, date: point.date, count: length });
  }
  return labels;
}

function AxisChart({
  height,
  yTicks,
  yMin = 0,
  yMax,
  xLabels,
  yFormat = (n) => String(n),
  children,
}: {
  height: number;
  yTicks: number[];
  yMin?: number;
  yMax: number;
  xLabels: Array<{ index: number; date: string; count: number }>;
  yFormat?: (n: number) => string;
  children: ReactNode;
}) {
  const plotTop = 16;
  const span = yMax - yMin || 1;
  const yOf = (value: number) => plotTop + (1 - (value - yMin) / span) * (height - plotTop);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative w-8 shrink-0" style={{ height }}>
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[11px] leading-none text-muted"
              style={{ top: yOf(tick) }}
            >
              {yFormat(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }}>
          {children}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-8 shrink-0" />
        <div className="relative h-5 min-w-0 flex-1">
          {xLabels.map(({ index, date, count }) => {
            const isFirst = index === 0;
            const isLast = index === count - 1;
            return (
              <span
                key={`${date}-${index}`}
                className={`absolute top-0 whitespace-nowrap text-[11px] leading-none text-muted ${
                  isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'
                }`}
                style={{ left: `${((index + 0.5) / count) * 100}%` }}
              >
                {formatDay(date)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BarChart({
  data,
  height = 180,
  barColor = 'fill-foreground',
  label,
}: {
  data: Array<{ date: string; count: number }>;
  height?: number;
  barColor?: string;
  label: string;
}) {
  const [tooltip, setTooltip] = useState<{ pos: TooltipPosition; content: TooltipContent } | null>(
    null
  );
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const ticks = integerTicks(maxCount);
  const plotTop = 16;
  const usable = height - plotTop;
  const fixedWidth = 600;
  const slotWidth = fixedWidth / Math.max(data.length, 1);
  const barWidth = Math.max(slotWidth * 0.55, 3);
  const barOffset = (slotWidth - barWidth) / 2;
  const yMax = Math.max(maxCount, ticks[0] ?? 1);

  return (
    <AxisChart
      height={height}
      yTicks={ticks}
      yMax={yMax}
      xLabels={chartXLabels(data, data.length)}
    >
      <ChartTooltip position={tooltip?.pos ?? null} content={tooltip?.content ?? null} />
      <svg
        viewBox={`0 0 ${fixedWidth} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {ticks.map((tick) => {
          const y = plotTop + (1 - tick / yMax) * usable;
          return (
            <line
              key={tick}
              x1={0}
              y1={y}
              x2={fixedWidth}
              y2={y}
              stroke="currentColor"
              className="text-muted/25"
              strokeWidth="1"
              strokeDasharray={tick === 0 ? '0' : '3 3'}
            />
          );
        })}
        {data.map((d, i) => {
          const barHeight = (d.count / yMax) * usable;
          const slotX = i * slotWidth;
          const active = tooltip?.content.date === formatDayLong(d.date);
          return (
            <g key={d.date}>
              <rect
                x={slotX + barOffset}
                y={height - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                className={barColor}
                rx={3}
                opacity={tooltip && !active ? 0.28 : 0.92}
              />
              <rect
                x={slotX}
                y={0}
                width={slotWidth}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={(e) => {
                  setTooltip({
                    pos: { x: e.clientX, y: e.clientY },
                    content: {
                      label,
                      value: d.count,
                      date: formatDayLong(d.date),
                    },
                  });
                }}
                onMouseMove={(e) => {
                  setTooltip((prev) =>
                    prev ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : null
                  );
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}
      </svg>
      {data.map((d, i) =>
        d.count > 0 ? (
          <span
            key={`value-${d.date}`}
            className="pointer-events-none absolute -translate-x-1/2 text-[11px] leading-none text-muted"
            style={{
              left: `${((i + 0.5) / data.length) * 100}%`,
              top: plotTop + (1 - d.count / yMax) * usable - 12,
            }}
          >
            {d.count}
          </span>
        ) : null
      )}
    </AxisChart>
  );
}

function LineChart({
  data,
  height = 180,
  lineColor = 'stroke-foreground',
}: {
  data: Array<{ date: string; value: number | null }>;
  height?: number;
  lineColor?: string;
}) {
  const [tooltip, setTooltip] = useState<{ pos: TooltipPosition; content: TooltipContent } | null>(
    null
  );
  const validData = data.filter((d) => d.value != null) as Array<{ date: string; value: number }>;
  if (validData.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <Typography type="body-sm" color="muted">
          Not enough data to display
        </Typography>
      </div>
    );
  }

  const values = validData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yMin = minVal === maxVal ? Math.max(0, minVal - 1) : minVal;
  const yMax = minVal === maxVal ? minVal + 1 : maxVal;
  const range = yMax - yMin || 1;
  const mid = yMin + range / 2;
  const ticks = [yMax, mid, yMin].filter((value, index, all) => all.indexOf(value) === index);
  const plotTop = 16;
  const usable = height - plotTop;
  const chartWidth = 600;
  const yFormat = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const yOf = (value: number) => plotTop + (1 - (value - yMin) / range) * usable;
  const xOf = (i: number) => (i / Math.max(validData.length - 1, 1)) * chartWidth;
  const points = validData.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');
  const area = `0,${height} ${points} ${chartWidth},${height}`;

  return (
    <AxisChart
      height={height}
      yTicks={ticks}
      yMin={yMin}
      yMax={yMax}
      yFormat={yFormat}
      xLabels={chartXLabels(validData, validData.length)}
    >
      <ChartTooltip position={tooltip?.pos ?? null} content={tooltip?.content ?? null} />
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {ticks.map((tick) => (
          <line
            key={tick}
            x1={0}
            y1={yOf(tick)}
            x2={chartWidth}
            y2={yOf(tick)}
            stroke="currentColor"
            className="text-muted/25"
            strokeWidth="1"
            strokeDasharray={tick === yMin ? '0' : '3 3'}
          />
        ))}
        <polygon points={area} className="fill-foreground/10" />
        <polyline
          points={points}
          fill="none"
          className={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {validData.map((d, i) => (
          <g key={d.date}>
            <circle cx={xOf(i)} cy={yOf(d.value)} r="3.5" className="fill-foreground" />
            <rect
              x={xOf(i) - chartWidth / Math.max(validData.length, 1) / 2}
              y={0}
              width={chartWidth / Math.max(validData.length, 1)}
              height={height}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={(e) => {
                setTooltip({
                  pos: { x: e.clientX, y: e.clientY },
                  content: { label: 'mood', value: yFormat(d.value), date: formatDayLong(d.date) },
                });
              }}
              onMouseMove={(e) => {
                setTooltip((prev) =>
                  prev ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : null
                );
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}
      </svg>
    </AxisChart>
  );
}

// ---------------------------------------------------------------------------
// Rating Distribution Bar
// ---------------------------------------------------------------------------

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = Math.round((count / maxCount) * 100);

        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-muted w-6 text-right">{star}</span>
            <svg width="20" height="20" className="flex-shrink-0">
              <path
                d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.47l-4.77 2.51.91-5.32L2.27 6.68l5.34-.78L10 1z"
                className="fill-amber-400"
              />
            </svg>
            <div className="flex-1 h-5 bg-muted/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm text-muted w-12 text-right">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------

function Sparkline({ values }: { values: number[] }) {
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
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-[5.5rem] text-foreground" aria-hidden>
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

function deltaLabel(current: number, previous: number): { text: string; up: boolean | null } {
  if (previous <= 0 && current <= 0) return { text: 'No change', up: null };
  if (previous <= 0) return { text: 'New this period', up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: 'Flat vs prior', up: null };
  return { text: `${pct > 0 ? '+' : ''}${pct}% vs prior`, up: pct > 0 };
}

function StatCard({
  label,
  value,
  hint,
  delta,
  spark,
  active,
  onSelect,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: { text: string; up: boolean | null };
  spark?: number[];
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-3 rounded-lg bg-default/30 p-5 text-left transition-colors ${
        active ? 'ring-1 ring-foreground/25' : 'hover:bg-default/45'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Typography type="body-xs" color="muted">
          {label}
        </Typography>
        {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
      </div>
      <Typography type="h3" weight="normal">
        {value}
      </Typography>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta ? (
          <Typography
            type="body-xs"
            className={delta.up === true ? 'text-foreground' : 'text-muted'}
          >
            {delta.text}
          </Typography>
        ) : null}
        {hint ? (
          <Typography type="body-xs" color="muted">
            {hint}
          </Typography>
        ) : null}
      </div>
    </button>
  );
}

function sumWindow(rows: Array<{ count: number }>, start: number, end: number) {
  return rows.slice(start, end).reduce((sum, row) => sum + row.count, 0);
}

function FunnelRow({
  label,
  value,
  max,
  href,
}: {
  label: string;
  value: number;
  max: number;
  href?: string;
}) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
  const inner = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Typography type="body-sm">{label}</Typography>
        <Typography type="body-sm">{value}</Typography>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/15">
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="block rounded-md transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard page
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');
  const [chartTab, setChartTab] = useState<'signups' | 'sessions'>('signups');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/admin/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        console.error('[AdminDashboard] Error:', err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter data by time range
  const filteredSignups = useMemo(() => {
    if (!data?.signupsByDay) return [];
    const days = timeRange === '7d' ? 7 : 30;
    return data.signupsByDay.slice(-days);
  }, [data, timeRange]);

  const filteredSessions = useMemo(() => {
    if (!data?.sessionsByDay) return [];
    const days = timeRange === '7d' ? 7 : 30;
    return data.sessionsByDay.slice(-days);
  }, [data, timeRange]);

  const filteredMood = useMemo(() => {
    if (!data?.moodByDay) return null;
    const days = timeRange === '7d' ? 7 : 30;
    return data.moodByDay.slice(-days);
  }, [data, timeRange]);

  const days = timeRange === '7d' ? 7 : 30;

  const signupDelta = useMemo(() => {
    const rows = data?.signupsByDay ?? [];
    return deltaLabel(sumWindow(rows, -days), sumWindow(rows, -days * 2, -days));
  }, [data, days]);

  const sessionDelta = useMemo(() => {
    const rows = data?.sessionsByDay ?? [];
    return deltaLabel(sumWindow(rows, -days), sumWindow(rows, -days * 2, -days));
  }, [data, days]);

  const engagementRate = useMemo(() => {
    if (!data || data.totalUsers === 0) return null;
    return Math.round((data.activeUsers30d / data.totalUsers) * 100);
  }, [data]);

  const intakeCompletionRate = useMemo(() => {
    if (!data || data.totalUsers === 0) return null;
    return Math.round((data.intakeCompleted / data.totalUsers) * 100);
  }, [data]);

  if (loading) {
    return (
      <UserPageShell wide="75">
        <PageHeader title="Dashboard" subtitle="Loading…" />
        <DashboardBodySkeleton />
      </UserPageShell>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={error ?? 'Failed to load dashboard.'}
        onRetry={() => window.location.reload()}
        homeHref="/dashboard"
        homeLabel="Dashboard"
      />
    );
  }

  const chartData = chartTab === 'signups' ? filteredSignups : filteredSessions;
  const chartEmpty =
    chartTab === 'signups' ? 'No signup data yet' : 'No session data yet';

  return (
    <UserPageShell wide="75">
      <PageHeader
        title="Dashboard"
        subtitle="What people are doing on the platform, and how it is landing."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {(['7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'secondary' : 'ghost'}
                onPress={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 days' : '30 days'}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="People"
          value={data.totalUsers}
          hint={`${engagementRate ?? 0}% active in 30d`}
          delta={signupDelta}
          spark={filteredSignups.map((row) => row.count)}
          active={chartTab === 'signups'}
          onSelect={() => setChartTab('signups')}
        />
        <StatCard
          label="Sessions"
          value={data.totalSessions}
          hint={`${data.activeUsers7d} active this week`}
          delta={sessionDelta}
          spark={filteredSessions.map((row) => row.count)}
          active={chartTab === 'sessions'}
          onSelect={() => setChartTab('sessions')}
        />
        <StatCard
          label="Intake"
          value={`${intakeCompletionRate ?? 0}%`}
          hint={`${data.intakeCompleted} finished onboarding`}
        />
        <StatCard
          label="Rating"
          value={data.ratingDistribution?.avgRating?.toFixed(1) ?? '—'}
          hint={
            data.ratingDistribution
              ? `${data.ratingDistribution.total} session ratings`
              : 'Waiting on ratings'
          }
        />
      </div>

      <AppCard className="p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Typography type="body">Activity</Typography>
            <Typography type="body-xs" color="muted">
              Hover a day for the exact count. Switch People / Sessions from the cards above, or here.
            </Typography>
          </div>
          <div className="flex gap-1">
            {(['signups', 'sessions'] as const).map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant={chartTab === tab ? 'secondary' : 'ghost'}
                onPress={() => setChartTab(tab)}
              >
                {tab === 'signups' ? 'Signups' : 'Sessions'}
              </Button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            height={220}
            label={chartTab === 'signups' ? 'signups' : 'sessions'}
          />
        ) : (
          <Typography type="body-sm" color="muted" className="py-16 text-center">
            {chartEmpty}
          </Typography>
        )}
      </AppCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <AppCard className="p-5 lg:col-span-3">
          <Typography type="body" className="mb-1">
            Mood over time
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-4">
            Average diary mood. Hover a point to read the day.
          </Typography>
          {filteredMood && filteredMood.some((d) => d.avg_mood != null) ? (
            <LineChart data={filteredMood.map((d) => ({ date: d.date, value: d.avg_mood }))} />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              Mood shows up once people start logging days.
            </Typography>
          )}
        </AppCard>

        <AppCard className="flex flex-col gap-5 p-5 lg:col-span-2">
          <div>
            <Typography type="body">Path through the product</Typography>
            <Typography type="body-xs" color="muted">
              Open a step to inspect it.
            </Typography>
          </div>
          <FunnelRow label="Accounts" value={data.totalUsers} max={data.totalUsers} href="/users" />
          <FunnelRow
            label="Finished intake"
            value={data.intakeCompleted}
            max={Math.max(data.totalUsers, 1)}
            href="/users"
          />
          <FunnelRow
            label="Active this week"
            value={data.activeUsers7d}
            max={Math.max(data.totalUsers, 1)}
          />
          <FunnelRow
            label="Active in 30 days"
            value={data.activeUsers30d}
            max={Math.max(data.totalUsers, 1)}
          />
        </AppCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppCard className="p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Typography type="body">Session ratings</Typography>
              <Typography type="body-xs" color="muted">
                How sessions felt after the fact.
              </Typography>
            </div>
            {data.ratingDistribution ? (
              <Typography type="h4" weight="normal">
                {data.ratingDistribution.avgRating.toFixed(1)}
              </Typography>
            ) : null}
          </div>
          {data.ratingDistribution ? (
            <RatingDistribution
              distribution={data.ratingDistribution.distribution}
              total={data.ratingDistribution.total}
            />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              Ratings appear after people finish sessions.
            </Typography>
          )}
        </AppCard>

        <AppCard className="p-5">
          <Typography type="body" className="mb-1">
            Stress before and after
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-6">
            Average reported stress across people with both readings.
          </Typography>
          {data.stressReduction ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <Typography type="body-sm" color="muted">
                    Before
                  </Typography>
                  <Typography type="body-sm">{data.stressReduction.avgBefore.toFixed(1)}</Typography>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted/15">
                  <div
                    className="h-full rounded-full bg-foreground/35"
                    style={{ width: `${Math.min(100, (data.stressReduction.avgBefore / 10) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <Typography type="body-sm" color="muted">
                    After
                  </Typography>
                  <Typography type="body-sm">{data.stressReduction.avgAfter.toFixed(1)}</Typography>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted/15">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${Math.min(100, (data.stressReduction.avgAfter / 10) * 100)}%` }}
                  />
                </div>
              </div>
              <Typography type="body-sm">
                {data.stressReduction.reductionPercent > 0
                  ? `${data.stressReduction.reductionPercent}% lower after sessions`
                  : `${Math.abs(data.stressReduction.reductionPercent)}% higher after sessions`}
                <span className="text-muted">
                  {' '}
                  · {data.stressReduction.userCount} people
                </span>
              </Typography>
            </div>
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              Stress comparison waits on session check-ins.
            </Typography>
          )}
        </AppCard>
      </div>
    </UserPageShell>
  );
}
