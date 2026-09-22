import { toDateKey } from '@/lib/dateKey';
import type { SessionRecapData } from '@/lib/types/conversation';

export function diaryPayloadFromRecap(sessionTitle: string, recap: SessionRecapData) {
  const lines: string[] = [];

  for (const entry of recap.entries) {
    lines.push(entry.prompt);
    lines.push(entry.answer);
    lines.push('');
  }

  const body = lines.join('\n').trim();
  const fallbackBody = 'Session recap (no written answers).';

  return {
    entryDate: toDateKey(new Date()),
    title: sessionTitle.trim().slice(0, 80) || 'Session recap',
    body: (body || fallbackBody).slice(0, 4000),
  };
}
