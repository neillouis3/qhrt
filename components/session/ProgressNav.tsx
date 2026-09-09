import { Typography } from '@heroui/react';

export type ProgressStepStatus = 'complete' | 'current' | 'upcoming' | 'skipped' | 'attention';

export interface ProgressStep {
  id: string;
  index?: string;
  label: string;
  status: ProgressStepStatus;
}

/** Linear progress: only steps before the active index show complete. */
export function linearProgressStatus(
  index: number,
  activeIndex: number,
  isComplete: boolean
): ProgressStepStatus {
  if (index < activeIndex) return isComplete ? 'complete' : 'attention';
  if (index === activeIndex) return 'current';
  return 'upcoming';
}

export function activeProgressIndex(
  items: { id: string; is_complete?: boolean }[],
  activeId: string | null | undefined
): number {
  if (activeId) {
    const match = items.findIndex((item) => item.id === activeId);
    if (match >= 0) return match;
  }
  const firstOpen = items.findIndex((item) => !item.is_complete);
  if (firstOpen >= 0) return firstOpen;
  return Math.max(0, items.length - 1);
}

export function StepMark({ status }: { status: ProgressStepStatus }) {
  if (status === 'complete') {
    return (
      <span className="flex size-5 items-center justify-center bg-background text-primary" aria-hidden>
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="flex size-5 items-center justify-center bg-background" aria-hidden>
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }

  if (status === 'attention') {
    return (
      <span className="flex size-5 items-center justify-center bg-background text-foreground" aria-hidden>
        !
      </span>
    );
  }

  if (status === 'skipped') {
    return (
      <span className="flex size-5 items-center justify-center bg-background text-muted" aria-hidden>
        —
      </span>
    );
  }

  return (
    <span className="flex size-5 items-center justify-center bg-background" aria-hidden>
      <span className="size-2 rounded-full bg-muted/30" />
    </span>
  );
}

function ProgressNavItem({
  item,
  onSelect,
}: {
  item: ProgressStep;
  onSelect?: (id: string) => void;
}) {
  const isCurrent = item.status === 'current';
  const body = (
    <>
      <span className="flex w-5 shrink-0 items-start justify-center pt-2.5">
        <StepMark status={item.status} />
      </span>
      <div
        className={`min-w-0 flex-1 rounded-lg py-2 pr-1 ${
          isCurrent ? 'bg-accent-lighter/80 pl-2.5 dark:bg-primary/10' : 'pl-0.5'
        }`}
      >
        {item.index ? (
          <Typography type="body-xs" color="muted" className="mb-0.5 block">
            Step {item.index}
          </Typography>
        ) : null}
        <Typography
          type="body-sm"
          className="leading-snug break-words"
          color={isCurrent ? undefined : 'muted'}
        >
          {item.label}
        </Typography>
      </div>
    </>
  );

  return (
    <li className="relative z-10 flex gap-3">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="flex w-full gap-3 text-left transition-opacity hover:opacity-90"
        >
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}

export default function ProgressNav({
  items,
  onSelect,
}: {
  items: ProgressStep[];
  onSelect?: (id: string) => void;
}) {
  return (
    <ol className="relative flex flex-col">
      {items.length > 1 ? (
        <span
          aria-hidden
          className="absolute top-4 bottom-4 left-2.5 z-0 w-px -translate-x-1/2 bg-muted/40"
        />
      ) : null}
      {items.map((item) => (
        <ProgressNavItem key={item.id} item={item} onSelect={onSelect} />
      ))}
    </ol>
  );
}
