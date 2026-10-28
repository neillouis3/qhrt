'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Bookmark02Icon } from '@hugeicons/core-free-icons';
import { usePinnedPractices } from '@/hooks/usePinnedPractices';

const PIN = {
  kind: 'wind-down' as const,
  id: 'wind-down',
  title: 'Practice',
  href: '/practice',
};

export default function WindDownPin() {
  const [pending, setPending] = useState(false);
  const { syncPins, isPinned, togglePin } = usePinnedPractices();
  const pinned = isPinned('wind-down', 'wind-down');

  useEffect(() => {
    fetch('/api/user/pins')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.pins)) syncPins(data.pins);
      })
      .catch(() => {});
  }, [syncPins]);

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={pinned ? 'Unpin practice' : 'Pin practice'}
      aria-pressed={pinned}
      isPending={pending}
      isDisabled={pending}
      onPress={() => {
        setPending(true);
        void togglePin(PIN)
          .catch((err) => console.error('[WindDown] Pin failed:', err))
          .finally(() => setPending(false));
      }}
    >
      <HugeiconsIcon
        icon={Bookmark02Icon}
        size={18}
        strokeWidth={1.5}
        className={pinned ? 'text-primary' : 'text-muted'}
      />
    </Button>
  );
}
