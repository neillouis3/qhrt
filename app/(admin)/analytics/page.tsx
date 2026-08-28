/**
 * Admin Analytics Dashboard
 * Views stats, trends, user engagement, ratings/feedback, and stress metrics.
 */

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

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
      className="fixed z-[9999] pointer-events-none rounded-lg border border-border bg-white px-3 py-2 shadow-lg dark:bg-navy-light/90"
      style={{
        left: position.x,
        top: position.y - 50,
        transform: 'translateX(-50%)',
      }}
    >
      <p className="text-xs font-medium text-navy dark:text-white">
        {content.value} {content.label}
      </p>
      <p className="text-[10px] text-muted">{content.date}</p>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Simple SVG Bar Chart Component (with hover tooltips, no axis labels)
// ---------------------------------------------------------------------------

function BarChart({
  data,
  height = 200,
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
  const containerRef = useRef<HTMLDivElement>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Fixed viewBox width - bars distribute evenly regardless of data count
  const fixedWidth = 600;
  const slotWidth = fixedWidth / data.length;
  const barWidth = Math.max(slotWidth * 0.7, 4);
  const barOffset = (slotWidth - barWidth) / 2;

  // Horizontal grid lines at relative intervals (0%, 33%, 66%, 100%)
  const gridLines = [0, 0.33, 0.66, 1];

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <ChartTooltip position={tooltip?.pos ?? null} content={tooltip?.content ?? null} />
      <svg
        viewBox={`0 0 ${fixedWidth} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal grid lines for visual reference */}
        {gridLines.map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height * pct}
            x2={fixedWidth}
            y2={height * pct}
            stroke="currentColor"
            className="text-border/70"
            strokeWidth="1"
            strokeDasharray={pct === 0 ? '0' : '3 3'}
          />
        ))}
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * height;
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
              {/* Invisible hit area for hover */}
              <rect
                x={slotX}
                y={0}
                width={slotWidth}
                height={height - 5}
                fill="transparent"
                onMouseEnter={(e) => {
                  setTooltip({
                    pos: { x: e.clientX, y: e.clientY },
                    content: {
                      label,
                      value: d.count,
                      date: new Date(d.date).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple SVG Line Chart Component
// ---------------------------------------------------------------------------

function LineChart({
  data,
  height = 200,
  lineColor = 'stroke-primary',
}: {
  data: Array<{ date: string; value: number | null }>;
  height?: number;
  lineColor?: string;
}) {
  const validData = data.filter((d) => d.value != null);
  if (validData.length < 2) {
    return (
      <div className="flex items-center justify-center h-full" style={{ minHeight: height }}>
        <p className="text-sm text-muted">Not enough data to display</p>
      </div>
    );
  }

  const values = validData.map((d) => d.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = 30;
  const chartWidth = data.length * 20;
  const chartHeight = height - padding * 2;

  const points = validData
    .map((d, i) => {
      const x = (i / (validData.length - 1)) * chartWidth;
      const y = chartHeight - (((d.value as number) - minVal) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1="0"
          y1={chartHeight * pct + padding}
          x2={chartWidth}
          y2={chartHeight * pct + padding}
          stroke="currentColor"
          className="text-border/30"
          strokeWidth="0.5"
        />
      ))}
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        className={lineColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {validData.map((d, i) => {
        const x = (i / (validData.length - 1)) * chartWidth;
        const y = chartHeight - (((d.value as number) - minVal) / range) * chartHeight;
        return <circle key={i} cx={x} cy={y} r="3" className="fill-primary" />;
      })}
    </svg>
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
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 dark:border-navy/50 dark:bg-navy-light/20">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-4xl font-bold text-navy dark:text-white tracking-tight">
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Analytics Page
// ---------------------------------------------------------------------------

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error('[AdminAnalytics] Error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
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
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-navy">
        <div className="flex flex-col items-center gap-4 py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-navy">
        <div className="flex flex-col items-center gap-4 py-32">
          <svg
            className="h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-red-500">{error ?? 'Failed to load analytics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-navy">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary-light" />

      <div className="flex flex-1 w-full max-w-7xl mx-auto px-6 py-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-navy dark:text-white tracking-tight">
                Analytics
              </h1>
              <p className="mt-1 text-muted">
                Platform insights, user engagement &amp; feedback overview
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-border p-1 dark:bg-navy-light/20 dark:border-navy">
              {(['7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-white dark:bg-primary-light'
                      : 'text-muted hover:text-navy dark:hover:text-white'
                  }`}
                >
                  {range === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              subtitle={`${engagementRate != null ? `${engagementRate}%` : '—'} active (30d)`}
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              }
              gradient="from-primary to-primary-light"
            />
            <StatCard
              label="Total Sessions"
              value={data.totalSessions}
              subtitle={`${data.activeUsers7d} active (7d)`}
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              gradient="from-blue-500 to-indigo-500"
            />
            <StatCard
              label="Intake Completion"
              value={`${intakeCompletionRate ?? 0}%`}
              subtitle={`${data.intakeCompleted} of ${data.totalUsers} users`}
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              gradient="from-accent to-emerald-400"
            />
            <StatCard
              label="Avg Rating"
              value={data.ratingDistribution?.avgRating?.toFixed(1) ?? '—'}
              subtitle={
                data.ratingDistribution ? `${data.ratingDistribution.total} ratings` : 'No data yet'
              }
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.608a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.608a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              }
              gradient="from-amber-400 to-orange-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Signups Trend */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <h2 className="text-lg font-semibold text-navy dark:text-white mb-1">User Signups</h2>
              <p className="text-xs text-muted mb-4">New users registered per day</p>
              {filteredSignups.length > 0 ? (
                <BarChart data={filteredSignups} barColor="fill-primary" label="signups" />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <p className="text-muted">No signup data available</p>
                </div>
              )}
            </div>

            {/* Sessions Trend */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <h2 className="text-lg font-semibold text-navy dark:text-white mb-1">
                Session Activity
              </h2>
              <p className="text-xs text-muted mb-4">Sessions completed per day</p>
              {filteredSessions.length > 0 ? (
                <BarChart data={filteredSessions} barColor="fill-blue-500" label="sessions" />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <p className="text-muted">No session data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Trend + Rating Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Mood Trend */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <h2 className="text-lg font-semibold text-navy dark:text-white mb-1">Mood Trend</h2>
              <p className="text-xs text-muted mb-4">Average mood score over time</p>
              {filteredMood && filteredMood.some((d) => d.avg_mood != null) ? (
                <LineChart data={filteredMood.map((d) => ({ date: d.date, value: d.avg_mood }))} />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <p className="text-muted">
                    Mood tracking data will appear here once users start logging moods
                  </p>
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <h2 className="text-lg font-semibold text-navy dark:text-white mb-1">
                Rating Distribution
              </h2>
              <p className="text-xs text-muted mb-4">Session ratings from users</p>
              {data.ratingDistribution ? (
                <RatingDistribution
                  distribution={data.ratingDistribution.distribution}
                  total={data.ratingDistribution.total}
                />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <p className="text-muted">
                    Rating data will appear here once users start rating sessions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stress Reduction Section */}
          <div className="rounded-2xl border border-border bg-white shadow-sm dark:border-navy/50 dark:bg-navy-light/20 mb-10">
            <div className="px-6 py-5 border-b border-border dark:border-navy">
              <h2 className="text-lg font-semibold text-navy dark:text-white">
                Stress Reduction Impact
              </h2>
              <p className="text-xs text-muted mt-1">
                Average stress levels before &amp; after sessions across all users
              </p>
            </div>
            {data.stressReduction ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  {/* Before */}
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                      Avg Stress (Before)
                    </p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-28 h-28">
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
                          stroke="url(#beforeGrad)"
                          strokeWidth="3"
                          strokeDasharray={`${(data.stressReduction.avgBefore / 10) * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                        <defs>
                          <linearGradient id="beforeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#f97316" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute text-2xl font-bold text-navy dark:text-white">
                        {data.stressReduction.avgBefore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow / Reduction */}
                  <div className="text-center">
                    <svg
                      className="h-8 w-8 mx-auto mb-2 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <p className="text-4xl font-bold text-emerald-500">
                      {data.stressReduction.reductionPercent > 0
                        ? `${data.stressReduction.reductionPercent}%`
                        : `${Math.abs(data.stressReduction.reductionPercent)}% ↑`}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {data.stressReduction.reductionPercent > 0
                        ? 'Average reduction'
                        : 'Average increase'}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      Based on {data.stressReduction.userCount} users with stress data
                    </p>
                  </div>

                  {/* After */}
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                      Avg Stress (After)
                    </p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-28 h-28">
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
                          stroke="url(#afterGrad)"
                          strokeWidth="3"
                          strokeDasharray={`${(data.stressReduction.avgAfter / 10) * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                        <defs>
                          <linearGradient id="afterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute text-2xl font-bold text-navy dark:text-white">
                        {data.stressReduction.avgAfter.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted">
                  Stress metrics will appear here once users complete sessions with stress tracking
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="rounded-xl border border-border bg-amber-50/50 p-4 dark:bg-amber-900/10 dark:border-amber-800/30">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Analytics in progress
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                  Some metrics will populate as users engage with the platform. Mood tracking,
                  session ratings, and detailed engagement analytics are planned for upcoming
                  releases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
