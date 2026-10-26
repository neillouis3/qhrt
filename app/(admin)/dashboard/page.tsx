/**
 * Admin dashboard — signups, sessions, ratings, and stress impact.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Button, Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { PageHeader } from '@/components/layout/UserPageShell';
import { DashboardBodySkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';
import ErrorState from '@/components/layout/ErrorState';

const ADMIN_QUICK_LINKS = [
  { name: 'Users', href: '/users' },
  { name: 'Content', href: '/content' },
  { name: 'Analytics', href: '/analytics' },
] as const;

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
  barColor = 'fill-primary',
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
          return (
            <g key={d.date}>
              <rect
                x={slotX + barOffset}
                y={height - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                className={barColor}
                rx={2}
                opacity={0.85}
              />
              <rect
                x={slotX}
                y={0}
                width={slotWidth}
                height={height}
                fill="transparent"
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
  lineColor = 'stroke-primary',
}: {
  data: Array<{ date: string; value: number | null }>;
  height?: number;
  lineColor?: string;
}) {
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

  return (
    <AxisChart
      height={height}
      yTicks={ticks}
      yMin={yMin}
      yMax={yMax}
      yFormat={yFormat}
      xLabels={chartXLabels(validData, validData.length)}
    >
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
          <circle key={d.date} cx={xOf(i)} cy={yOf(d.value)} r="3" className="fill-primary" />
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

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <AppCard className="p-5">
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
      <Typography type="h4" weight="normal">
        {value}
      </Typography>
      {subtitle ? (
        <Typography type="body-xs" color="muted">
          {subtitle}
        </Typography>
      ) : null}
    </AppCard>
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

  // Engagement rate
  const engagementRate = useMemo(() => {
    if (!data || data.totalUsers === 0) return null;
    return Math.round((data.activeUsers30d / data.totalUsers) * 100);
  }, [data]);

  // Intake completion rate
  const intakeCompletionRate = useMemo(() => {
    if (!data || data.totalUsers === 0) return null;
    return Math.round((data.intakeCompleted / data.totalUsers) * 100);
  }, [data]);

  if (loading) {
    return (
      <UserPageShell wide>
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

  return (
    <UserPageShell wide>
      <PageHeader
        title="Dashboard"
        subtitle="Signups, sessions, ratings, and stress impact"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {(['7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'primary' : 'ghost'}
                onPress={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 days' : '30 days'}
              </Button>
            ))}
          </div>
        }
      />

      <div className="flex flex-col gap-3">
        <Typography type="body-xs" color="muted">
          Quick links
        </Typography>
        <div className="flex flex-wrap gap-2">
          {ADMIN_QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Total users"
          value={data.totalUsers}
          subtitle={`${engagementRate != null ? `${engagementRate}%` : '—'} active (30d)`}
        />
        <StatCard
          label="Total sessions"
          value={data.totalSessions}
          subtitle={`${data.activeUsers7d} active (7d)`}
        />
        <StatCard
          label="Intake completion"
          value={`${intakeCompletionRate ?? 0}%`}
          subtitle={`${data.intakeCompleted} of ${data.totalUsers} users`}
        />
        <StatCard
          label="Avg rating"
          value={data.ratingDistribution?.avgRating?.toFixed(1) ?? '—'}
          subtitle={
            data.ratingDistribution ? `${data.ratingDistribution.total} ratings` : 'No data yet'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppCard className="p-5">
          <Typography type="body" className="mb-1">
            User signups
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-4">
            New users registered per day
          </Typography>
          {filteredSignups.length > 0 ? (
            <BarChart data={filteredSignups} barColor="fill-primary" label="signups" />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              No signup data available
            </Typography>
          )}
        </AppCard>

        <AppCard className="p-5">
          <Typography type="body" className="mb-1">
            Session activity
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-4">
            Sessions completed per day
          </Typography>
          {filteredSessions.length > 0 ? (
            <BarChart data={filteredSessions} barColor="fill-primary" label="sessions" />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              No session data available
            </Typography>
          )}
        </AppCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppCard className="p-5">
          <Typography type="body" className="mb-1">
            Mood trend
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-4">
            Average mood score over time
          </Typography>
          {filteredMood && filteredMood.some((d) => d.avg_mood != null) ? (
            <LineChart data={filteredMood.map((d) => ({ date: d.date, value: d.avg_mood }))} />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              Mood data will appear once users start logging moods
            </Typography>
          )}
        </AppCard>

        <AppCard className="p-5">
          <Typography type="body" className="mb-1">
            Rating distribution
          </Typography>
          <Typography type="body-xs" color="muted" className="mb-4">
            Session ratings from users
          </Typography>
          {data.ratingDistribution ? (
            <RatingDistribution
              distribution={data.ratingDistribution.distribution}
              total={data.ratingDistribution.total}
            />
          ) : (
            <Typography type="body-sm" color="muted" className="py-12 text-center">
              Rating data will appear once users start rating sessions
            </Typography>
          )}
        </AppCard>
      </div>

      <AppCard className="p-5">
        <Typography type="body" className="mb-1">
          Stress reduction
        </Typography>
        <Typography type="body-xs" color="muted" className="mb-4">
          Average stress before and after sessions
        </Typography>
        {data.stressReduction ? (
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <div className="text-center">
              <Typography type="body-xs" color="muted" className="mb-2">
                Avg stress (before)
              </Typography>
              <div className="relative inline-flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-28 w-28">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/10"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-danger"
                    strokeDasharray={`${(data.stressReduction.avgBefore / 10) * 100} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="absolute text-2xl">
                  {data.stressReduction.avgBefore.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="text-center">
              <Typography type="h4" weight="normal">
                {data.stressReduction.reductionPercent > 0
                  ? `${data.stressReduction.reductionPercent}%`
                  : `${Math.abs(data.stressReduction.reductionPercent)}% ↑`}
              </Typography>
              <Typography type="body-sm" color="muted">
                {data.stressReduction.reductionPercent > 0
                  ? 'Average reduction'
                  : 'Average increase'}
              </Typography>
              <Typography type="body-xs" color="muted" className="mt-2">
                Based on {data.stressReduction.userCount} users with stress data
              </Typography>
            </div>

            <div className="text-center">
              <Typography type="body-xs" color="muted" className="mb-2">
                Avg stress (after)
              </Typography>
              <div className="relative inline-flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-28 w-28">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/10"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                    strokeDasharray={`${(data.stressReduction.avgAfter / 10) * 100} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="absolute text-2xl">
                  {data.stressReduction.avgAfter.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <Typography type="body-sm" color="muted" className="py-12 text-center">
            Stress metrics will appear once users complete sessions with stress tracking
          </Typography>
        )}
      </AppCard>

      <Typography type="body-xs" color="muted">
        Some metrics populate as people use the platform. Mood, ratings, and engagement detail will
        fill in over time.
      </Typography>
    </UserPageShell>
  );
}
