import type { HomeConversation, HomeJourney } from '@/lib/homeNext';
import { displaySessionName } from '@/lib/homeNext';

export type HomeActivityKind = 'session' | 'journey';

export interface HomeActivityItem {
  id: string;
  kind: HomeActivityKind;
  title: string;
  detail: string;
  status: string;
  href: string;
}

function activityAt(value: string | null | undefined, fallback: string): number {
  const ts = Date.parse(value || fallback);
  return Number.isNaN(ts) ? 0 : ts;
}

export function buildHomeActivity({
  conversations,
  journeys,
  excludeHref,
  limit = 5,
}: {
  conversations: HomeConversation[];
  journeys: HomeJourney[];
  excludeHref?: string | null;
  limit?: number;
}): HomeActivityItem[] {
  const rows: Array<HomeActivityItem & { at: number }> = [];

  for (const conv of conversations) {
    const href = `/sessions/${conv.id}`;
    if (excludeHref && href === excludeHref) continue;
    rows.push({
      id: conv.id,
      kind: 'session',
      title: displaySessionName(conv.knowledge_model_name),
      detail: new Date(conv.started_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      status: conv.status,
      href,
      at: activityAt(conv.updated_at, conv.started_at),
    });
  }

  for (const journey of journeys) {
    const href = `/journeys/${journey.id}`;
    if (excludeHref && href === excludeHref) continue;
    const domain = journey.domain_name?.trim();
    rows.push({
      id: journey.id,
      kind: 'journey',
      title: domain || 'Journey',
      detail: `Phase ${journey.current_phase_order}`,
      status: journey.status,
      href,
      at: activityAt(journey.updated_at, journey.created_at),
    });
  }

  return rows
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ at: _at, ...item }) => item);
}
