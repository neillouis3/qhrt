'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import ProgressNav from '@/components/session/ProgressNav';
import { useSession } from '@/hooks/useSession';
import type { GuideStep } from '@/lib/modules';
import { writeStartingOutDone } from '@/lib/startingOut';

interface GuidePayload {
  module: { id: string; slug: string; title: string };
  lesson: { id: string; position: number; title: string; steps: GuideStep[] };
}

export default function ModuleGuidePage({ slug, position }: { slug: string; position: number }) {
  const router = useRouter();
  const { session } = useSession();
  const [payload, setPayload] = useState<GuidePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/modules/${encodeURIComponent(slug)}/${position}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not open this lesson.');
        setPayload(data as GuidePayload);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not open this lesson.');
      });
    return () => controller.abort();
  }, [slug, position]);

  const steps = payload?.lesson.steps ?? [];
  const step = steps[index];
  const last = steps.length > 0 && index === steps.length - 1;

  const finish = () => {
    const userId = session?.user?.id;
    if (userId && slug === 'qhrt-foundation' && position === 1) writeStartingOutDone(userId);
    router.push(payload ? `/modules/${payload.module.slug}` : '/home');
  };

  const progress = (
    <ProgressNav
      items={steps.map((item, itemIndex) => ({
        id: String(itemIndex),
        index: String(itemIndex + 1),
        label: item.title,
        status: itemIndex < index ? 'complete' : itemIndex === index ? 'current' : 'upcoming',
      }))}
      onSelect={(id) => {
        const next = Number(id);
        if (next >= 0 && next <= index) setIndex(next);
      }}
    />
  );

  if (error) {
    return (
      <FocusSessionLayout progress={progress} progressLabel="Module">
        <Typography type="body-sm">{error}</Typography>
      </FocusSessionLayout>
    );
  }

  if (!payload || !step) {
    return (
      <FocusSessionLayout progress={progress} progressLabel="Module">
        <Typography type="body-sm" color="muted">
          Loading…
        </Typography>
      </FocusSessionLayout>
    );
  }

  return (
    <FocusSessionLayout
      progressLabel={`${payload.module.title} · Module ${payload.lesson.position}`}
      progress={progress}
      leadingActions={
        index === 0 ? (
          <Link href={`/modules/${payload.module.slug}`} className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
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
          Module {payload.lesson.position} · {index + 1} of {steps.length}
        </Typography>
        <Typography type="h3" weight="normal">
          {step.title}
        </Typography>
        {step.paragraphs.map((paragraph) => (
          <Typography key={paragraph} type="body">
            {paragraph}
          </Typography>
        ))}
        {step.points.length > 0 ? (
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
