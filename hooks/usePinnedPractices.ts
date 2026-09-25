'use client';

import { useCallback, useMemo, useState } from 'react';
import { pinKey, type PinKind, type PinnedPractice } from '@/lib/pinnedPractices';

export function usePinnedPractices(initial: PinnedPractice[] = []) {
  const [pins, setPins] = useState<PinnedPractice[]>(initial);
  const pinnedKeys = useMemo(() => new Set(pins.map((item) => item.key)), [pins]);

  const syncPins = useCallback((next: PinnedPractice[]) => {
    setPins(next);
  }, []);

  const isPinned = useCallback(
    (kind: PinKind, id: string) => pinnedKeys.has(pinKey(kind, id)),
    [pinnedKeys]
  );

  const togglePin = useCallback(
    async (payload: { kind: PinKind; id: string; title: string; href: string }) => {
      const key = pinKey(payload.kind, payload.id);
      const action = pinnedKeys.has(key) ? 'unpin' : 'pin';
      const response = await fetch('/api/user/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not update pin.');
      }
      if (Array.isArray(data.pins)) {
        setPins(data.pins as PinnedPractice[]);
      }
    },
    [pinnedKeys]
  );

  return { pins, syncPins, isPinned, togglePin, pinnedKeys };
}
