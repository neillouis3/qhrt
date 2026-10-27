'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import AppCard from '@/components/ui/AppCard';
import UserPageShell from '@/components/layout/UserPageShell';
import type { LearningModule } from '@/lib/modules';

export default function ModuleDetailPage({ slug }: { slug: string }) {
  const [module, setModule] = useState<LearningModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/modules/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not load this module.');
        setModule(data.module as LearningModule);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not load this module.');
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <UserPageShell>
      <div className="flex flex-col gap-2">
        <Link
          href="/assessments"
          className="flex w-fit items-center gap-1 text-sm text-muted transition-opacity hover:opacity-60"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.5} />
          Modules
        </Link>
        <Typography type="h3" weight="normal">
          {module?.title ?? 'Module'}
        </Typography>
        {module?.description ? (
          <Typography type="body-sm" color="muted">
            {module.description}
          </Typography>
        ) : null}
      </div>
      {error ? <Typography type="body-sm">{error}</Typography> : null}
      {module ? (
        <div className="getting-started-rail flex snap-x snap-proximity gap-3 overflow-x-auto">
          {module.lessons.map((lesson) => (
            <AppCard
              key={lesson.id}
              className="h-full w-[calc((100%-2.25rem)*0.3)] shrink-0 snap-start p-5"
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <AppCard.Title className="font-normal tracking-tight">Module {lesson.position}</AppCard.Title>
                  <Typography type="body-sm" color="muted" className="break-words">
                    {lesson.title}
                  </Typography>
                </div>
                <Link href={lesson.href} className={`${buttonVariants({ size: 'sm', variant: 'outline' })} w-fit`}>
                  {lesson.kind === 'guide' ? 'Start' : 'Go'}
                </Link>
              </div>
            </AppCard>
          ))}
        </div>
      ) : null}
    </UserPageShell>
  );
}
