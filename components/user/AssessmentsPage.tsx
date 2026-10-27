'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { AssessmentGridSkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell, { PageHeader } from '@/components/layout/UserPageShell';
import { useSession } from '@/hooks/useSession';
import type { LearningModule } from '@/lib/modules';

const WASH_TONES = ['meadow', 'bloom', 'dusk', 'mist'] as const;

function washTone(slug: string) {
  let hash = 0;
  for (const char of slug) hash += char.charCodeAt(0);
  return WASH_TONES[hash % WASH_TONES.length] ?? 'meadow';
}

function CoverWash({ slug }: { slug: string }) {
  return (
    <div className={`focus-card-wash focus-card-wash--${washTone(slug)}`} aria-hidden>
      <span className="focus-card-wash__blob focus-card-wash__blob--a" />
      <span className="focus-card-wash__blob focus-card-wash__blob--b" />
      <span className="focus-card-wash__blob focus-card-wash__blob--c" />
    </div>
  );
}

function lessonLabel(count: number) {
  if (count <= 0) return 'No lessons yet';
  if (count === 1) return 'Module 1';
  return `${count} lessons`;
}

export default function AssessmentsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user.id;

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch('/api/modules', { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load modules.');
        }
        setModules(data.modules ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Modules] Failed to fetch modules:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [userId, sessionLoading]);

  if (sessionLoading || (session && loading)) {
    return <AssessmentGridSkeleton />;
  }

  return (
    <UserPageShell>
      <PageHeader
        title="Modules"
        subtitle="Take one topic at a time, and follow the lessons inside that module as the steps."
      />

      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      ) : null}

      {modules.length === 0 ? (
        <AppCard className="p-6">
          <Typography type="body-sm" color="muted">
            No modules yet.
          </Typography>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div key={module.id} className="relative aspect-square w-full">
              <AppCard className="absolute inset-0 overflow-hidden p-0">
                <div className="relative flex h-full flex-col">
                  <CoverWash slug={module.slug} />
                  <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4 pt-[46%]">
                    <AppCard.Header>
                      <AppCard.Title className="font-normal tracking-tight">{module.title}</AppCard.Title>
                    </AppCard.Header>
                    {module.description ? (
                      <AppCard.Description className="min-h-0 flex-1 overflow-y-auto">
                        {module.description}
                      </AppCard.Description>
                    ) : null}
                    <AppCard.Footer className="mt-auto flex-wrap items-center justify-between gap-2">
                      <Typography type="body-xs" color="muted">
                        {lessonLabel(module.lessons.length)}
                      </Typography>
                      <Link
                        href={`/modules/${module.slug}`}
                        className={buttonVariants({ size: 'sm', variant: 'primary' })}
                      >
                        Open
                      </Link>
                    </AppCard.Footer>
                  </div>
                </div>
              </AppCard>
            </div>
          ))}
        </div>
      )}
    </UserPageShell>
  );
}
