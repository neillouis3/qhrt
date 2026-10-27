'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import Link from 'next/link';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import ProgressNav from '@/components/session/ProgressNav';
import { useSession } from '@/hooks/useSession';
import { STARTING_OUT_STEPS, writeStartingOutDone } from '@/lib/startingOut';

export default function StartingOutPage() {
  const router = useRouter();
  const { session } = useSession();
  const [index, setIndex] = useState(0);
  const step = STARTING_OUT_STEPS[index] ?? STARTING_OUT_STEPS[0];
  const last = index === STARTING_OUT_STEPS.length - 1;

  const finish = () => {
    const userId = session?.user?.id;
    if (userId) writeStartingOutDone(userId);
    router.push('/home');
  };

  const progress = (
    <ProgressNav
      items={STARTING_OUT_STEPS.map((item, itemIndex) => ({
        id: item.id,
        index: String(itemIndex + 1),
        label: item.title,
        status: itemIndex < index ? 'complete' : itemIndex === index ? 'current' : 'upcoming',
      }))}
      onSelect={(id) => {
        const next = STARTING_OUT_STEPS.findIndex((item) => item.id === id);
        if (next >= 0 && next <= index) setIndex(next);
      }}
    />
  );

  if (!step) return null;

  return (
    <FocusSessionLayout
      progressLabel="Starting out"
      progress={progress}
      leadingActions={
        index === 0 ? (
          <Link href="/home" className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
            Leave
          </Link>
        ) : (
          <Button size="sm" variant="tertiary" onPress={() => setIndex((value) => Math.max(0, value - 1))}>
            Back
          </Button>
        )
      }
      actions={
        last ? (
          <Button size="sm" variant="primary" onPress={finish}>
            Done
          </Button>
        ) : (
          <Button size="sm" variant="primary" onPress={() => setIndex((value) => value + 1)}>
            Next
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <Typography type="body-xs" color="muted">
          {index + 1} of {STARTING_OUT_STEPS.length}
        </Typography>
        <Typography type="h3" weight="normal">
          {step.title}
        </Typography>
        {step.paragraphs.map((paragraph) => (
          <Typography key={paragraph} type="body">
            {paragraph}
          </Typography>
        ))}
        {step.points ? (
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {step.points.map((point) => (
              <li key={point}>
                <Typography type="body">{point}</Typography>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FocusSessionLayout>
  );
}
