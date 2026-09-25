export type PinKind = 'session' | 'journey' | 'breathe';

export interface PinnedPractice {
  key: string;
  kind: PinKind;
  id: string;
  title: string;
  href: string;
  pinnedAt: string;
}

export const MAX_PINNED = 12;

export function pinKey(kind: PinKind, id: string): string {
  return `${kind}:${id}`;
}

function isPinKind(value: unknown): value is PinKind {
  return value === 'session' || value === 'journey' || value === 'breathe';
}

export function parsePinnedPractices(raw: unknown): PinnedPractice[] {
  if (!Array.isArray(raw)) return [];
  const items: PinnedPractice[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const kind = record.kind;
    const id = typeof record.id === 'string' ? record.id : '';
    const title = typeof record.title === 'string' ? record.title.trim().slice(0, 120) : '';
    const href = typeof record.href === 'string' ? record.href.trim().slice(0, 200) : '';
    const pinnedAt = typeof record.pinnedAt === 'string' ? record.pinnedAt : '';
    if (!isPinKind(kind) || !id || !title || !href.startsWith('/')) continue;
    items.push({
      key: pinKey(kind, id),
      kind,
      id,
      title,
      href,
      pinnedAt: pinnedAt || new Date(0).toISOString(),
    });
  }
  return items
    .sort((a, b) => b.pinnedAt.localeCompare(a.pinnedAt))
    .slice(0, MAX_PINNED);
}

export function pinnedFromUserMetadata(meta: Record<string, unknown> | undefined): PinnedPractice[] {
  return parsePinnedPractices(meta?.pinned_practices);
}
