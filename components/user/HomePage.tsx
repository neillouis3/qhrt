'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonVariants, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import CrisisResources from '@/components/ui/CrisisResources';
import {
  HomeDiaryStats,
  HomeMoodWeek,
  HomePinned,
  HomeTutorial,
  readSeenNotificationIds,
  UserGreeting,
} from '@/components/home/HomeDashboardSections';
import SessionRow from '@/components/session/SessionRow';
import { useLocale } from '@/context/LocaleContext';
import UserPageShell from '@/components/layout/UserPageShell';
import { idlePracticeNext, type HomeActivityItem, type HomeNext, type TutorialStep } from '@/lib/home';
import type { HomeDiaryStats as HomeDiaryStatsData } from '@/lib/diaryStats';
import type { GentlePresence } from '@/lib/gentlePresence';
import type { CheckInWeekDay, HomeCheckInValue } from '@/lib/homeCheckIn';
import { readStartingOutDone, withStartingOutStatus } from '@/lib/startingOut';
import type { LearningModule } from '@/lib/modules';
import type { PinnedPractice } from '@/lib/pinnedPractices';
import { usePinnedPractices } from '@/hooks/usePinnedPractices';
import type { NameSource } from '@/lib/userName';
import { homeCheckInFromUser, practiceTimeFromUser } from '@/lib/userSettings';
import { statusLabel } from '@/lib/sessionUi';

export interface HomeDashboardData {
  next?: HomeNext;
  activity?: HomeActivityItem[];
  tutorial?: TutorialStep[];
  diaryStats?: HomeDiaryStatsData;
  gentlePresence?: GentlePresence;
  pins?: PinnedPractice[];
  checkInWeek?: CheckInWeekDay[];
  checkIn?: HomeCheckInValue | null;
  modules?: LearningModule[];
}

function withFoundationLesson(steps: TutorialStep[], modules: LearningModule[]): TutorialStep[] {
  const foundation = modules.find((module) => module.slug === 'qhrt-foundation');
  const lesson = foundation?.lessons.slice().sort((a, b) => a.position - b.position)[0];
  if (!lesson) return steps;
  return steps.map((step) =>
    step.id === 'starting-out'
      ? {
          ...step,
          title: `Module ${lesson.position}`,
          description: lesson.title,
          href: lesson.href,
        }
      : step
  );
}

interface HomePageProps {
  userId?: string;
  user?: NameSource;
  intakeCompleted?: boolean;
  initialDashboard?: HomeDashboardData | null;
}

const BROWSE_HREFS = [
  { key: 'diary', href: '/diary', tone: 'bloom' },
  { key: 'assessments', href: '/assessments', tone: 'meadow' },
  { key: 'breathe', href: '/breathe', tone: 'mist' },
] as const;

function BrowseWash({ tone }: { tone: (typeof BROWSE_HREFS)[number]['tone'] }) {
  return (
    <div className={`browse-card-wash browse-card-wash--${tone}`} aria-hidden>
      <span className="browse-card-wash__blob browse-card-wash__blob--a" />
      <span className="browse-card-wash__blob browse-card-wash__blob--b" />
      <span className="browse-card-wash__blob browse-card-wash__blob--c" />
    </div>
  );
}

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

function checkInFromDashboard(data: HomeDashboardData | null | undefined): HomeCheckInValue | null {
  return data?.checkIn === 'up' || data?.checkIn === 'down' ? data.checkIn : null;
}

export default function HomePage({
  userId,
  user,
  intakeCompleted = false,
  initialDashboard = null,
}: HomePageProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [next, setNext] = useState<HomeNext>(
    () => initialDashboard?.next ?? fallbackNext(intakeCompleted, practiceTimeFromUser(user) || null)
  );
  const [activity, setActivity] = useState<HomeActivityItem[]>(() => initialDashboard?.activity ?? []);
  const [tutorial, setTutorial] = useState<TutorialStep[]>(() =>
    withStartingOutStatus(initialDashboard?.tutorial ?? [], readStartingOutDone(userId))
  );
  const [diaryStats, setDiaryStats] = useState<HomeDiaryStatsData | null>(() => initialDashboard?.diaryStats ?? null);
  const [loading, setLoading] = useState(() => initialDashboard == null && Boolean(userId));
  const [gentlePresence, setGentlePresence] = useState<GentlePresence | null>(
    () => initialDashboard?.gentlePresence ?? null
  );
  const [unpinningKey, setUnpinningKey] = useState<string | null>(null);
  const { pins, syncPins, togglePin } = usePinnedPractices(initialDashboard?.pins ?? []);
  const [checkInWeek, setCheckInWeek] = useState<CheckInWeekDay[]>(() => initialDashboard?.checkInWeek ?? []);
  const [modules, setModules] = useState<LearningModule[]>(() => initialDashboard?.modules ?? []);
  const [checkInValue, setCheckInValue] = useState<HomeCheckInValue | null>(() =>
    checkInFromDashboard(initialDashboard)
  );
  const [seenIds] = useState<string[]>(() => readSeenNotificationIds(userId));
  const skipInitialFetch = useRef(initialDashboard != null);
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
        modules?: LearningModule[];
      };
      if (data.next) setNext(data.next);
      if (data.activity) setActivity(data.activity);
      if (data.tutorial) setTutorial(withStartingOutStatus(data.tutorial, readStartingOutDone(userId)));
      if (data.diaryStats) setDiaryStats(data.diaryStats);
      if (data.gentlePresence) setGentlePresence(data.gentlePresence);
      if (data.pins) syncPins(data.pins);
      if (Array.isArray(data.checkInWeek)) setCheckInWeek(data.checkInWeek);
      if (Array.isArray(data.modules)) setModules(data.modules);
      setCheckInValue(checkInFromDashboard(data));
    } catch (err) {
      console.error('[HomePage] Failed to fetch next step:', err);
    } finally {
      setLoading(false);
    }
  }, [syncPins, userId]);

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
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    if (userId) void fetchNext();
    else setLoading(false);
  }, [userId, fetchNext]);

  return (
    <UserPageShell wide="75" transparentBg>
      {loading ? (
        <div role="status" aria-live="polite" className="sr-only">
          {t('home.nextStep.loading')}
        </div>
      ) : (
      <div className="home-enter flex flex-col gap-10">
      <UserGreeting
        user={user}
        userId={userId}
        showCheckIn={showCheckIn}
        onCheckInComplete={() => void fetchNext()}
        presence={gentlePresence}
        notifications={activity}
        checkInValue={checkInValue}
        checkInSettled
        initialSeenIds={seenIds}
      />

      {showCheckIn && checkInWeek.length > 0 ? (
        <HomeMoodWeek week={checkInWeek} />
      ) : null}

      {nextStepRepeatsTutorial ? null : (
        <div className="flex flex-col gap-2">
          <Typography type="body-xs" color="muted">
            {t('home.nextStep.label')}
          </Typography>
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
        </div>
      )}

      {tutorial.length > 0 ? <HomeTutorial steps={withFoundationLesson(tutorial, modules)} /> : null}

      {pins.length > 0 ? (
        <HomePinned pins={pins} onUnpin={(pin) => void handleUnpin(pin)} unpinningKey={unpinningKey} />
      ) : null}

      {activity.length > 0 ? (
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
      ) : null}

      {diaryStats ? <HomeDiaryStats stats={diaryStats} /> : null}

      <div className="flex flex-col gap-3">
        <Typography type="body-xs" color="muted">
          {t('home.browse.title')}
        </Typography>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BROWSE_HREFS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <AppCard className="relative h-full min-h-32 overflow-hidden p-0">
                <BrowseWash tone={item.tone} />
                <div className="relative z-10 flex h-full min-h-32 items-end p-5">
                  <AppCard.Title className="font-normal tracking-tight">
                    {t(`home.browse.${item.key}`)}
                  </AppCard.Title>
                </div>
              </AppCard>
            </Link>
          ))}
        </div>
      </div>

      <CrisisResources variant="compact" />
      </div>
      )}
    </UserPageShell>
  );
}
