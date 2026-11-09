'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import AppCard from '@/components/ui/AppCard';
import CoverWash from '@/components/ui/CoverWash';
import UserPageShell from '@/components/layout/UserPageShell';
import { lessonKindLabel, minutesLabel, type LearningModule, type ModuleLesson } from '@/lib/modules';

const PATH_SLOTS = 4;

type PathItem = {
  position: number;
  title: string;
  subtitle: string | null;
  kindLabel: string | null;
  minutes?: number;
  href?: string;
  action?: string;
  ready: boolean;
  completed: boolean;
  seed: string;
};

function LessonLines({ text }: { text: string }) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const [lead, ...rest] = lines;
  return (
    <div className="flex flex-col gap-1">
      <Typography type="body-sm">{lead}</Typography>
      {rest.map((line) => (
        <Typography key={line} type="body-sm" color="muted">
          {line}
        </Typography>
      ))}
    </div>
  );
}

function kindLabel(kind: ModuleLesson['kind']) {
  return lessonKindLabel(kind);
}

function pathFromModule(module: LearningModule): PathItem[] {
  const items: PathItem[] = module.lessons.map((lesson) => ({
    position: lesson.position,
    title: lesson.title,
    subtitle: lesson.description,
    kindLabel: kindLabel(lesson.kind),
    minutes: lesson.minutes,
    href: lesson.href,
    action: lesson.completedAt ? 'Review' : lesson.kind === 'assessment' ? 'Go' : 'Start',
    ready: true,
    completed: Boolean(lesson.completedAt),
    seed: `${module.slug}-${lesson.position}`,
  }));
  const extras = module.slug === 'sleep' ? 0 : Math.max(0, PATH_SLOTS - items.length);
  for (let index = 0; index < extras; index += 1) {
    const position = items.length + 1;
    items.push({
      position,
      title: 'Coming soon',
      subtitle: null,
      kindLabel: null,
      ready: false,
      completed: false,
      seed: `${module.slug}-soon-${position}`,
    });
  }
  return items;
}

function LessonCard({ item, upNext }: { item: PathItem; upNext?: boolean }) {
  return (
    <AppCard className={`flex flex-col gap-2 p-5 ${item.ready ? '' : 'opacity-55'}`}>
      {upNext ? (
        <Typography type="body-xs" color="muted">
          Up next
        </Typography>
      ) : null}
      <AppCard.Title className="font-normal tracking-tight">{`Module ${item.position}: ${item.title}`}</AppCard.Title>
      {item.subtitle ? <LessonLines text={item.subtitle} /> : null}
      {item.completed ? (
        <Typography type="body-xs" color="muted">
          Complete
        </Typography>
      ) : null}
      {item.href && item.action ? (
        <Link href={item.href} className={`${buttonVariants({ size: 'sm', variant: 'outline' })} mt-1 w-fit`}>
          {item.action}
        </Link>
      ) : null}
    </AppCard>
  );
}

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

  const path = useMemo(() => (module ? pathFromModule(module) : []), [module]);
  const next = path.find((item) => item.ready && !item.completed) ?? path.find((item) => item.ready);
  const openCount = path.filter((item) => item.ready).length;
  const completedCount = path.filter((item) => item.completed).length;
  const totalMinutes = path.reduce((sum, item) => sum + (item.minutes ?? 0), 0);

  return (
    <UserPageShell wide="75">
      <Link
        href="/assessments"
        className="flex w-fit items-center gap-1 text-sm text-muted transition-opacity hover:opacity-60"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.5} />
        Modules
      </Link>
      {error ? <Typography type="body-sm">{error}</Typography> : null}
      {module ? (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <AppCard className="flex flex-col gap-2 px-4 py-4">
              <Typography type="h4" weight="normal">
                {module.title}
              </Typography>
              {module.description ? (
                <Typography type="body-sm" color="muted">
                  {module.description}
                </Typography>
              ) : null}
              <Typography type="body-xs" color="muted">
                {[
                  openCount > 0 ? `${completedCount} of ${openCount} complete` : `${openCount} of ${path.length}`,
                  totalMinutes > 0 ? `About ${minutesLabel(totalMinutes)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </AppCard>
            <AppCard className="flex flex-col gap-1 p-2">
              {path.map((item) => (
                <div
                  key={`nav-${item.position}`}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Typography type="body-sm" className="truncate">
                      {`Module ${item.position}: ${item.title}`}
                    </Typography>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="shrink-0 text-sm text-muted transition-opacity hover:opacity-60">
                      {item.completed ? 'Review' : 'Open'}
                    </Link>
                  ) : (
                    <Typography type="body-xs" color="muted">
                      Soon
                    </Typography>
                  )}
                </div>
              ))}
            </AppCard>
          </aside>

          <div className="flex flex-col gap-8">
            <AppCard className="relative overflow-hidden p-0">
              <CoverWash seed={module.slug} fill />
              <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Typography type="body-xs" color="muted">
                    {next
                      ? next.completed
                        ? 'Finished · review any lesson below'
                        : completedCount > 0
                          ? 'Pick up where you left off'
                          : 'Start here'
                      : 'This path is still being written.'}
                  </Typography>
                  <Typography type="h4" weight="normal">
                    {next ? `Module ${next.position}: ${next.title}` : 'More soon'}
                  </Typography>
                  {next?.subtitle ? <LessonLines text={next.subtitle} /> : null}
                  {openCount > 0 ? (
                    <div className="mt-1 flex max-w-xs flex-col gap-1.5">
                      <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-foreground/45"
                          style={{
                            width: `${Math.round((completedCount / openCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <Typography type="body-xs" color="muted">
                        {`${completedCount} of ${openCount} complete`}
                      </Typography>
                    </div>
                  ) : null}
                </div>
                {next?.href ? (
                  <Link
                    href={next.href}
                    className={`${buttonVariants({ size: 'sm', variant: 'primary' })} w-fit shrink-0`}
                  >
                    {next.completed ? 'Review' : completedCount > 0 ? 'Continue' : 'Start'}
                  </Link>
                ) : null}
              </div>
            </AppCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {path.map((item) => (
                <LessonCard
                  key={item.ready ? `lesson-${item.position}` : `placeholder-${item.position}`}
                  item={item}
                  upNext={next?.position === item.position && !item.completed}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </UserPageShell>
  );
}
