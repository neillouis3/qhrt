'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { AssessmentGridSkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';
import { PageHeader } from '@/components/layout/UserPageShell';
import { useSession } from '@/hooks/useSession';
import type { AssessmentSummary } from '@/lib/assessments';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

export default function AssessmentsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
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
        const res = await fetch('/api/assessments', { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load assessments');
        }
        setAssessments(data.assessments ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Assessments] Failed to fetch data:', err);
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
        title="Focus areas"
        subtitle="Short self-checks that point you to workbooks. They match you to content — they are not clinical assessments."
      />

      {error && (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      )}

      {assessments.length === 0 ? (
        <AppCard className="p-6">
          <Typography type="body-sm" color="muted">
            No focus areas available yet.
          </Typography>
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => {
            const cover = a.cover_image;
            const href = `/assessments/${a.slug}`;
            return (
              <div key={a.id} className="relative aspect-square w-full">
                <AppCard className="absolute inset-0 overflow-hidden p-0">
                  <div className="relative flex h-full flex-col">
                    {cover ? (
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[68%]">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          unoptimized={!cover.startsWith('/')}
                          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
                          className="scale-110 object-cover object-center blur-[6px] saturate-150 [mask-image:linear-gradient(to_bottom,black_42%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_42%,transparent)]"
                        />
                      </div>
                    ) : (
                      <CoverWash slug={a.slug} />
                    )}
                    <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4 pt-[46%]">
                      <AppCard.Header>
                        <AppCard.Title className="font-normal tracking-tight">{a.title}</AppCard.Title>
                      </AppCard.Header>
                      {a.description ? (
                        <AppCard.Description className="min-h-0 flex-1 overflow-y-auto">
                          {a.description}
                        </AppCard.Description>
                      ) : null}
                      <AppCard.Footer className="mt-auto flex-wrap items-center justify-between gap-2">
                        <Typography type="body-xs" color="muted">
                          {a.lastCompletedAt
                            ? `Last done ${formatDate(a.lastCompletedAt)}`
                            : `${a.questionCount} questions`}
                        </Typography>
                        <div className="flex gap-2">
                          {a.lastCompletedAt && (
                            <Link
                              href={`${href}?view=result`}
                              className={buttonVariants({ size: 'sm', variant: 'outline' })}
                            >
                              Result
                            </Link>
                          )}
                          <Link href={href} className={buttonVariants({ size: 'sm', variant: 'primary' })}>
                            {a.lastCompletedAt ? 'Retake' : 'Start'}
                          </Link>
                        </div>
                      </AppCard.Footer>
                    </div>
                  </div>
                </AppCard>
              </div>
            );
          })}
        </div>
      )}
    </UserPageShell>
  );
}
