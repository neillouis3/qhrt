'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import { MessageQuestionIcon } from '@hugeicons/core-free-icons';
import AppCard from '@/components/ui/AppCard';
import { LandingIcon } from '@/components/marketing/LandingIcons';
import { AssessmentGridSkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';
import { PageHeader } from '@/components/layout/UserPageShell';
import { useSession } from '@/hooks/useSession';
import type { AssessmentSummary } from '@/lib/assessments';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AssessmentsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !session) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/assessments', { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error('Failed to load assessments');
        }
        const data = await res.json();
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
  }, [session, sessionLoading]);

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
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 flex h-[42%] items-center justify-center bg-gradient-to-b from-accent-lighter/60 to-transparent dark:from-primary/10"
                      >
                        <LandingIcon
                          icon={MessageQuestionIcon}
                          size={36}
                          className="text-primary/50 dark:text-primary-light/50"
                        />
                      </div>
                    )}
                    <div
                      className={`relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4 ${cover ? 'pt-[46%]' : 'pt-4'}`}
                    >
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
