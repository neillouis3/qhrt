import { toDateKey } from '@/lib/dateKey';

const MAX_PRESENCE_DAYS = 120;

export function presenceDaysFromUserMetadata(meta: Record<string, unknown> | undefined): string[] {
  const raw = meta?.presence_days;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((item): item is string => typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)))].slice(
    -MAX_PRESENCE_DAYS
  );
}

export function appendPresenceDay(existing: string[], dateKey = toDateKey(new Date())): string[] {
  const next = [...existing.filter((key) => key !== dateKey), dateKey];
  return next.slice(-MAX_PRESENCE_DAYS);
}
