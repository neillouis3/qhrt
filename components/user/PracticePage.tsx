'use client';

import Link from 'next/link';
import { Typography } from '@heroui/react';
import UserPageShell, { PageHeader } from '@/components/layout/UserPageShell';
import { BreatheAid, MoonAid, MuscleAid, SenseAid } from '@/components/user/WindDownAids';
import { PRACTICE_CATALOG, type PracticeArt } from '@/lib/practices';

function Art({ kind }: { kind: PracticeArt }) {
  if (kind === 'breathe') return <BreatheAid className="size-14" />;
  if (kind === 'settle') return <MoonAid className="size-14" />;
  if (kind === 'grounding') return <SenseAid sense="see" className="size-14" />;
  return <MuscleAid group="Shoulders" phase="release" className="h-10 w-auto" />;
}

export default function PracticePage() {
  return (
    <UserPageShell wide="75">
      <PageHeader title="Practice" subtitle="Short ways to come back to your body." />
      <ul className="flex flex-col gap-3">
        {PRACTICE_CATALOG.map((activity) => (
          <li key={activity.href}>
            <Link
              href={activity.href}
              className="flex items-center gap-4 rounded-xl bg-default/30 px-5 py-4 transition-colors hover:bg-default/50"
            >
              <span className="flex size-16 shrink-0 items-center justify-center">
                <Art kind={activity.art} />
              </span>
              <span className="min-w-0">
                <Typography type="body">{activity.title}</Typography>
                <Typography type="body-sm" color="muted" className="mt-1">
                  {activity.cue}
                </Typography>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </UserPageShell>
  );
}
