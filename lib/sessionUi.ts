import { toDateKey, parseDateKey } from '@/lib/dateKey';

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStarted(value: string): string {
  const date = new Date(value);
  return `Started ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${formatTime(value)}`;
}

export function formatSectionDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

export function groupByDate<T>(items: T[], getValue: (item: T) => string): { key: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = toDateKey(getValue(item));
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) existing.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, grouped]) => ({
      key,
      items: [...grouped].sort((a, b) => getValue(b).localeCompare(getValue(a))),
    }));
}

export function statusLabel(status: string): string {
  if (status === 'completed') return 'Completed';
  if (status === 'active' || status === 'running') return 'In progress';
  if (status === 'paused') return 'Paused';
  if (status === 'initialized') return 'Ready';
  return status;
}

/** Live journey, assessment, or breathing session — full-screen, no top navbar. */
export function isFocusSessionPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    /^\/journeys\/[^/]+\/?$/.test(pathname) ||
    /^\/sessions\/[^/]+\/?$/.test(pathname) ||
    pathname === '/breathe' ||
    pathname.startsWith('/breathe/')
  );
}
