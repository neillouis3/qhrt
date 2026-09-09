'use client';

import { Button, Typography } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Bookmark02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { surfaceClass } from '@/components/ui/AppCard';

export default function SessionRow({
  title,
  time,
  status,
  actionLabel,
  actionVariant = 'outline',
  onAction,
  onDelete,
  deleting = false,
  deleteLabel = 'Delete',
  pinned = false,
  onTogglePin,
  pinPending = false,
  pinLabel,
}: {
  title: string;
  time: string;
  status: string;
  actionLabel: string;
  actionVariant?: 'primary' | 'outline';
  onAction: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  deleteLabel?: string;
  pinned?: boolean;
  onTogglePin?: () => void;
  pinPending?: boolean;
  pinLabel?: string;
}) {
  return (
    <div className={`${surfaceClass} flex items-center justify-between gap-6 px-4 py-3.5`}>
      <div className="flex min-w-0 items-baseline gap-2">
        <Typography type="body" className="truncate">
          {title}
        </Typography>
        <Typography type="body-xs" color="muted" className="shrink-0">
          {time}
        </Typography>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Typography type="body-xs" color="muted">
          {status}
        </Typography>
        {onTogglePin ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={pinLabel ?? (pinned ? 'Unpin' : 'Pin')}
            aria-pressed={pinned}
            isPending={pinPending}
            isDisabled={pinPending || deleting}
            onPress={onTogglePin}
          >
            <HugeiconsIcon
              icon={Bookmark02Icon}
              size={16}
              strokeWidth={1.5}
              className={pinned ? 'text-foreground' : 'text-muted'}
            />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={deleteLabel}
            isPending={deleting}
            isDisabled={deleting || pinPending}
            onPress={onDelete}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={16}
              strokeWidth={1.5}
              className="text-muted"
            />
          </Button>
        ) : null}
        <Button size="sm" variant={actionVariant} isDisabled={deleting} onPress={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
