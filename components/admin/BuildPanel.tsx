'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Typography, buttonVariants } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { lessonKindLabel, looksLikePresentation, type LearningModule, type ModuleLesson } from '@/lib/modules';

function moduleType(item: ModuleLesson) {
  if (item.kind !== 'assessment' && looksLikePresentation(item.steps)) return 'Presentation';
  return lessonKindLabel(item.kind);
}

const TYPES = [
  { type: 'guide', label: 'Practice' },
  { type: 'assessment', label: 'Questionnaire' },
  { type: 'presentation', label: 'Presentation' },
] as const;

export default function BuildPanel() {
  const [lessons, setLessons] = useState<LearningModule[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/modules')
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not load lessons.');
        if (!cancelled) setLessons(Array.isArray(body.modules) ? body.modules : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load lessons.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppCard className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Typography type="body">Lessons</Typography>
          <Typography type="body-xs" color="muted">
            Each lesson holds modules. A module is a practice, a questionnaire, or a presentation.
          </Typography>
        </div>
        <Link href="/content/modules/new" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
          New lesson
        </Link>
      </div>

      {error ? <Typography type="body-sm">{error}</Typography> : null}
      {lessons == null && !error ? <Typography type="body-sm" color="muted">Loading lessons…</Typography> : null}

      {lessons?.map((lesson) => (
        <div key={lesson.id} className="flex flex-col gap-3 border-t border-foreground/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/content/modules/${lesson.id}`} className="text-sm hover:underline">
              {lesson.title}
            </Link>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((item) => (
                <Link
                  key={item.type}
                  href={`/content/modules/${lesson.id}/lessons/new?type=${item.type}`}
                  className={buttonVariants({ size: 'sm', variant: item.type === 'presentation' ? 'primary' : 'tertiary' })}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {lesson.lessons.length === 0 ? (
            <Typography type="body-xs" color="muted">
              No modules yet.
            </Typography>
          ) : (
            <div className="flex flex-col gap-1">
              {lesson.lessons.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/modules/${lesson.id}/lessons/${item.id}`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  {`Module ${item.position}: ${item.title} · ${moduleType(item)}`}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </AppCard>
  );
}
