'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import CoverWash from '@/components/ui/CoverWash';
import { AssessmentGridSkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell, { PageHeader } from '@/components/layout/UserPageShell';
import { useSession } from '@/hooks/useSession';
import type { LearningModule } from '@/lib/modules';

function lessonLabel(module: LearningModule) {
  const count = module.lessons.length;
  if (count <= 0) return 'No modules yet';
  const done = module.lessons.filter((lesson) => lesson.completedAt).length;
  return `${done} of ${count} complete`;
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
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load lessons.');
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
    <UserPageShell wide="75">
      <PageHeader
        title="Lessons"
        subtitle="Take one lesson at a time, and follow the modules inside that lesson as the steps."
      />

      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      ) : null}

      {modules.length === 0 ? (
        <AppCard className="p-6">
          <Typography type="body-sm" color="muted">
            No lessons yet.
          </Typography>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <AppCard key={module.id} className="flex h-full flex-col overflow-hidden p-0">
              <CoverWash seed={module.slug} band />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Typography type="body" className="font-medium tracking-tight">
                  {module.title}
                </Typography>
                {module.description ? (
                  <Typography type="body-sm" color="muted" className="line-clamp-3">
                    {module.description}
                  </Typography>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <Typography type="body-xs" color="muted">
                    {lessonLabel(module)}
                  </Typography>
                  <Link
                    href={`/modules/${module.slug}`}
                    className={buttonVariants({ size: 'sm', variant: 'primary' })}
                  >
                    Open
                  </Link>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </UserPageShell>
  );
}
