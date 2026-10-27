'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonVariants, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import CrisisResources from '@/components/ui/CrisisResources';
import {
  HomeDiaryStats,
  HomeGentleStreak,
  HomeMoodWeek,
  HomePinned,
  HomeTimeIndicator,
  HomeTutorial,
  UserGreeting,
} from '@/components/home/HomeDashboardSections';
import SessionRow from '@/components/session/SessionRow';
import { useLocale } from '@/context/LocaleContext';
import UserPageShell from '@/components/layout/UserPageShell';
import { idlePracticeNext, type HomeActivityItem, type HomeNext, type TutorialStep } from '@/lib/home';
import type { HomeDiaryStats as HomeDiaryStatsData } from '@/lib/diaryStats';
import type { GentlePresence } from '@/lib/gentlePresence';
import type { CheckInWeekDay } from '@/lib/homeCheckIn';
import type { PinnedPractice } from '@/lib/pinnedPractices';
import { usePinnedPractices } from '@/hooks/usePinnedPractices';
import type { NameSource } from '@/lib/userName';
import { homeCheckInFromUser, practiceTimeFromUser } from '@/lib/userSettings';
import { statusLabel } from '@/lib/sessionUi';

interface HomePageProps {
  userId?: string;
  user?: NameSource;
  intakeCompleted?: boolean;
}

const BROWSE_HREFS = [
  { key: 'diary', href: '/diary' },
  { key: 'assessments', href: '/assessments' },
  { key: 'breathe', href: '/breathe' },
] as const;

function fallbackNext(intakeCompleted: boolean, practiceTime?: string | null): HomeNext {
  if (!intakeCompleted) {
    return {
      kind: 'onboarding',
      title: 'Choose your focus',
      description: 'Tell us what you want to work on so we can suggest workbooks. You can skip any time.',
      cta: 'Continue',
      href: '/onboarding',
    };
  }
  return idlePracticeNext(practiceTime);
}

function actionForStatus(status: string): { label: string; variant: 'primary' | 'outline' } {
  if (status === 'completed') return { label: 'View', variant: 'outline' };
  return { label: 'Resume', variant: 'outline' };
}

function HomeShortcuts() {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AppCard className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <AppCard.Title className="font-normal tracking-tight">{t('home.shortcuts.focusTitle')}</AppCard.Title>
            <AppCard.Description>{t('home.shortcuts.focusDescription')}</AppCard.Description>
          </div>
          <Link href="/assessments" className={`${buttonVariants({ size: 'sm', variant: 'outline' })} w-fit`}>
            {t('home.shortcuts.focusCta')}
          </Link>
        </div>
      </AppCard>
      <AppCard className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <AppCard.Title className="font-normal tracking-tight">{t('home.shortcuts.diaryTitle')}</AppCard.Title>
            <AppCard.Description>{t('home.shortcuts.diaryDescription')}</AppCard.Description>
          </div>
          <Link href="/diary" className={`${buttonVariants({ size: 'sm', variant: 'outline' })} w-fit`}>
            {t('home.shortcuts.diaryCta')}
          </Link>
        </div>
      </AppCard>
    </div>
  );
}

export default function HomePage({
  userId,
  user,
  intakeCompleted = false,
}: HomePageProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [next, setNext] = useState<HomeNext>(() =>
    fallbackNext(intakeCompleted, practiceTimeFromUser(user) || null)
  );
  const [activity, setActivity] = useState<HomeActivityItem[]>([]);
  const [tutorial, setTutorial] = useState<TutorialStep[]>([]);
  const [diaryStats, setDiaryStats] = useState<HomeDiaryStatsData | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [gentlePresence, setGentlePresence] = useState<GentlePresence | null>(null);
  const [unpinningKey, setUnpinningKey] = useState<string | null>(null);
  const { pins, syncPins, togglePin } = usePinnedPractices();
  const [checkInWeek, setCheckInWeek] = useState<CheckInWeekDay[]>([]);
  const showCheckIn = homeCheckInFromUser(user);
  const currentTutorial = tutorial.find((step) => step.status === 'current');
  const nextStepRepeatsTutorial =
    !intakeCompleted || (currentTutorial != null && currentTutorial.href === next.href);

  const fetchNext = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (!res.ok) return;
      const data = (await res.json()) as {
        next?: HomeNext;
        activity?: HomeActivityItem[];
        tutorial?: TutorialStep[];
        diaryStats?: HomeDiaryStatsData;
        gentlePresence?: GentlePresence;
        pins?: PinnedPractice[];
        checkInWeek?: CheckInWeekDay[];
      };
      if (data.next) setNext(data.next);
      if (data.activity) setActivity(data.activity);
      if (data.tutorial) setTutorial(data.tutorial);
      if (data.diaryStats) setDiaryStats(data.diaryStats);
      if (data.gentlePresence) setGentlePresence(data.gentlePresence);
      if (data.pins) syncPins(data.pins);
      if (Array.isArray(data.checkInWeek)) setCheckInWeek(data.checkInWeek);
    } catch (err) {
      console.error('[HomePage] Failed to fetch next step:', err);
    } finally {
      setLoading(false);
    }
  }, [syncPins]);

  const handleUnpin = async (pin: PinnedPractice) => {
    setUnpinningKey(pin.key);
    try {
      await togglePin({
        kind: pin.kind,
        id: pin.id,
        title: pin.title,
        href: pin.href,
      });
    } catch (err) {
      console.error('[HomePage] Unpin failed:', err);
    } finally {
      setUnpinningKey(null);
    }
  };

  useEffect(() => {
    if (userId) void fetchNext();
    else setLoading(false);
  }, [userId, fetchNext]);

  return (
    <UserPageShell transparentBg>
      <HomeTimeIndicator />

      <UserGreeting
        user={user}
        userId={userId}
        showCheckIn={showCheckIn}
        onCheckInComplete={() => void fetchNext()}
      />

      {!loading && gentlePresence ? <HomeGentleStreak presence={gentlePresence} /> : null}

      {!loading && showCheckIn && checkInWeek.length > 0 ? (
        <HomeMoodWeek week={checkInWeek} />
      ) : null}

      {nextStepRepeatsTutorial ? null : (
        <div className="flex flex-col gap-2">
          <Typography type="body-xs" color="muted">
            {t('home.nextStep.label')}
          </Typography>
          {loading ? (
            <AppCard className="p-5">
              <Typography type="body-sm" color="muted">
                {t('home.nextStep.loading')}
              </Typography>
            </AppCard>
          ) : (
            <AppCard className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <AppCard.Title className="font-normal tracking-tight">{next.title}</AppCard.Title>
                  <AppCard.Description>{next.description}</AppCard.Description>
                </div>
                <Link href={next.href} className={`${buttonVariants({ size: 'sm', variant: 'outline' })} shrink-0`}>
                  {next.cta}
                </Link>
              </div>
            </AppCard>
          )}
        </div>
      )}

      {!loading && tutorial.length > 0 ? <HomeTutorial steps={tutorial} /> : null}

      {!loading && pins.length > 0 ? (
        <HomePinned pins={pins} onUnpin={(pin) => void handleUnpin(pin)} unpinningKey={unpinningKey} />
      ) : null}

      {!loading ? (
        activity.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Typography type="body" className="font-normal">
              {t('home.recent')}
            </Typography>
            <div className="flex flex-col gap-3">
              {activity.map((item) => {
                const action = actionForStatus(item.status);
                const pinKind = item.kind;
                return (
                  <SessionRow
                    key={`${item.kind}-${item.id}`}
                    title={item.title}
                    time={item.detail}
                    status={statusLabel(item.status)}
                    actionLabel={action.label}
                    actionVariant={action.variant}
                    pinned={pins.some((pin) => pin.kind === pinKind && pin.id === item.id)}
                    onTogglePin={() =>
                      void togglePin({
                        kind: pinKind,
                        id: item.id,
                        title: item.title,
                        href: item.href,
                      }).catch((err) => console.error('[HomePage] Pin failed:', err))
                    }
                    onAction={() => router.push(item.href)}
                  />
                );
              })}
            </div>
          </div>
        ) : intakeCompleted ? (
          <HomeShortcuts />
        ) : null
      ) : null}

      {!loading && diaryStats ? <HomeDiaryStats stats={diaryStats} /> : null}

      <div className="flex flex-col gap-3">
        <Typography type="body-xs" color="muted">
          {t('home.browse.title')}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {BROWSE_HREFS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            >
              {t(`home.browse.${item.key}`)}
            </Link>
          ))}
        </div>
      </div>

      <CrisisResources variant="compact" />
    </UserPageShell>
  );
}
