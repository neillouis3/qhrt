'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FlashIcon, Notification01Icon, ThumbsDownIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons';
import Modal from '@/components/ui/Modal';
import AppCard from '@/components/ui/AppCard';
import SessionRow from '@/components/session/SessionRow';
import { useLocale } from '@/context/LocaleContext';
import { clearSessionCache } from '@/hooks/useSession';
import { useHomeTime } from '@/hooks/useHomeTime';
import { toDateKey } from '@/lib/dateKey';
import type { GentlePresence } from '@/lib/gentlePresence';
import type { CheckInWeekDay, HomeCheckInValue } from '@/lib/homeCheckIn';
import { weekHasCheckIns } from '@/lib/homeCheckIn';
import {
  averageMoodLabel,
  moodLabel,
  type HomeDiaryStats as HomeDiaryStatsData,
} from '@/lib/diaryStats';
import type { DiaryMood } from '@/lib/types/diary';
import type { PinnedPractice } from '@/lib/pinnedPractices';
import type { HomeSkyBlend } from '@/lib/timeOfDay';
import type { HomeActivityItem, TutorialStep } from '@/lib/home';
import { firstNameFromUser, type NameSource } from '@/lib/userName';
import { notificationPrefsFromUser } from '@/lib/userSettings';
import { statusLabel } from '@/lib/sessionUi';

/** Shared thumbs-up/down control (Home greeting + Diary). */
export function CheckInButtons({
  value,
  loading = false,
  disabled = false,
  onPick,
  size = 'sm',
}: {
  value: HomeCheckInValue | null;
  loading?: boolean;
  disabled?: boolean;
  onPick: (value: HomeCheckInValue) => void;
  size?: 'sm' | 'md';
}) {
  const { t } = useLocale();
  const locked = disabled || loading || value !== null;

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        size={size}
        variant="tertiary"
        aria-label={t('home.checkInAria.doingWell')}
        aria-pressed={value === 'up'}
        isDisabled={locked || value === 'down'}
        onPress={() => onPick('up')}
        className={
          value === 'up' ? 'opacity-100 data-[disabled]:opacity-100' : undefined
        }
      >
        <HugeiconsIcon
          icon={ThumbsUpIcon}
          size={size === 'md' ? 20 : 18}
          strokeWidth={1.75}
          className={value === 'up' ? 'text-blue-500' : 'text-muted'}
        />
      </Button>
      <Button
        isIconOnly
        size={size}
        variant="tertiary"
        aria-label={t('home.checkInAria.toughDay')}
        aria-pressed={value === 'down'}
        isDisabled={locked || value === 'up'}
        onPress={() => onPick('down')}
        className={
          value === 'down' ? 'opacity-100 data-[disabled]:opacity-100' : undefined
        }
      >
        <HugeiconsIcon
          icon={ThumbsDownIcon}
          size={size === 'md' ? 20 : 18}
          strokeWidth={1.75}
          className={value === 'down' ? 'text-blue-950' : 'text-muted'}
        />
      </Button>
    </div>
  );
}

export function HomeGentleStreak({ presence }: { presence: GentlePresence }) {
  const { t } = useLocale();
  const days = presence.daysThisWeek;
  if (days <= 0) return null;
  const message = days === 1 ? t('home.presence.one') : t('home.presence.many', { count: days });

  return (
    <div className="flex items-center gap-0.5" aria-label={message}>
      <HugeiconsIcon icon={FlashIcon} size={28} strokeWidth={1.75} className="text-foreground" aria-hidden />
      <Typography type="h4" weight="normal" className="tabular-nums">
        {days}
      </Typography>
    </div>
  );
}

function withFlankingDays(week: CheckInWeekDay[]): CheckInWeekDay[] {
  const firstDay = week[0];
  const lastDay = week[week.length - 1];
  if (week.length !== 7 || !firstDay || !lastDay || week.some((day) => day.edge)) return week;
  const first = new Date(`${firstDay.date}T12:00:00`);
  const last = new Date(`${lastDay.date}T12:00:00`);
  const before = new Date(first);
  before.setDate(first.getDate() - 1);
  const after = new Date(last);
  after.setDate(last.getDate() + 1);
  return [
    { date: toDateKey(before), value: null, edge: true },
    ...week,
    { date: toDateKey(after), value: null, edge: true },
  ];
}

export function HomeMoodWeek({ week }: { week: CheckInWeekDay[] }) {
  const { t } = useLocale();
  if (!weekHasCheckIns(week)) return null;
  const days = withFlankingDays(week);
  const todayKey = toDateKey(new Date());

  return (
    <div
      className="[mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]"
      role="list"
      aria-label={t('home.checkInWeek')}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day, index) => {
          const date = new Date(`${day.date}T12:00:00`);
          const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
          const isToday = day.date === todayKey;
          const isEdge = day.edge === true || (days.length > 7 && (index === 0 || index === days.length - 1));
          const ariaDay =
            day.value === 'up'
              ? t('home.checkInAria.dayUp', { day: dayLabel })
              : day.value === 'down'
                ? t('home.checkInAria.dayDown', { day: dayLabel })
                : t('home.checkInAria.dayNone', { day: dayLabel });

          return (
            <div
              key={day.date}
              role="listitem"
              aria-label={ariaDay}
              aria-current={isToday ? 'date' : undefined}
              className={`flex flex-col items-center gap-2 ${isEdge ? 'opacity-60 blur-[2px]' : ''}`}
            >
              <Typography type="body-sm">{dayLabel}</Typography>
              <span
                className={`size-1.5 rounded-full ${day.value ? 'bg-muted' : 'bg-transparent'}`}
                aria-hidden
              />
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm tabular-nums ${
                  isToday ? 'bg-foreground/12 text-foreground' : 'text-muted'
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HomePinned({
  pins,
  onUnpin,
  unpinningKey,
}: {
  pins: PinnedPractice[];
  onUnpin: (pin: PinnedPractice) => void;
  unpinningKey?: string | null;
}) {
  const router = useRouter();
  const { t } = useLocale();

  if (pins.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Typography type="body" className="font-normal">
          {t('home.pinned')}
        </Typography>
        <Typography type="body-xs" color="muted">
          {t('home.pinnedHint')}
        </Typography>
      </div>
      <div className="flex flex-col gap-3">
        {pins.map((pin) => (
          <SessionRow
            key={pin.key}
            title={pin.title}
            time="Pinned"
            status={statusLabel('running')}
            actionLabel="Open"
            actionVariant="outline"
            pinned
            pinLabel="Unpin"
            pinPending={unpinningKey === pin.key}
            onTogglePin={() => onUnpin(pin)}
            onAction={() => router.push(pin.href)}
          />
        ))}
      </div>
    </div>
  );
}

export function HomeTutorial({ steps }: { steps: TutorialStep[] }) {
  const { t } = useLocale();

  if (steps.every((step) => step.status === 'complete')) {
    return null;
  }

  const completedCount = steps.filter((step) => step.status === 'complete').length;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <Typography type="body" className="font-normal">
          {t('home.tutorial.title')}
        </Typography>
        <Typography type="body-sm" color="muted">
          {t('home.tutorial.progress', { done: completedCount, total: steps.length })}
        </Typography>
      </div>

      <div className="getting-started-rail flex snap-x snap-proximity gap-3 overflow-x-auto">
        {steps.map((step) => {
          const done = step.status === 'complete';
          return (
            <AppCard
              key={step.id}
              className={`h-full w-[calc(100%-3.25rem)] shrink-0 snap-start p-4 sm:w-[calc((100%-2.25rem)*0.3)] sm:p-5 ${done ? 'opacity-45' : ''}`}
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <AppCard.Title className="font-normal tracking-tight">{step.title}</AppCard.Title>
                  <Typography type="body-sm" color="muted">
                    {step.description}
                  </Typography>
                </div>
                <Link
                  href={step.href}
                  className={`${buttonVariants({ size: 'sm', variant: 'outline' })} w-fit`}
                >
                  {done ? t('home.tutorial.again') : t('home.tutorial.go')}
                </Link>
              </div>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}

function DiaryMoodBar({ mood, hasEntry }: { mood: DiaryMood | null; hasEntry: boolean }) {
  const height = mood != null ? `${(mood / 5) * 100}%` : '0%';

  return (
    <div className="flex h-12 w-full flex-col items-center justify-end gap-1">
      <div className="flex h-9 w-2.5 items-end justify-center rounded-full bg-default/50">
        <div
          className={`w-full rounded-full transition-all ${
            mood != null ? 'bg-foreground/35' : hasEntry ? 'bg-muted/40' : 'bg-transparent'
          }`}
          style={{ height }}
        />
      </div>
    </div>
  );
}

function DiaryStatCard({ label, value }: { label: string; value: string }) {
  return (
    <AppCard className="flex flex-col gap-1 p-4">
      <Typography type="h3" className="text-2xl font-normal tabular-nums">
        {value}
      </Typography>
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
    </AppCard>
  );
}

export function HomeDiaryStats({ stats }: { stats: HomeDiaryStatsData }) {
  const { t } = useLocale();
  const avgLabel = averageMoodLabel(stats.averageMoodThisWeek);
  const todayLabel = moodLabel(stats.todayMood);

  if (stats.totalEntries === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Typography type="body" className="font-normal">
          {t('home.diary.section')}
        </Typography>
        <AppCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <AppCard.Title className="font-normal tracking-tight">{t('home.diary.emptyTitle')}</AppCard.Title>
              <AppCard.Description>{t('home.diary.emptyDescription')}</AppCard.Description>
            </div>
            <Link href="/diary" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              {t('home.diary.emptyCta')}
            </Link>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Typography type="body" className="font-normal">
          {t('home.diary.section')}
        </Typography>
        <Link href="/diary" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
          {t('home.diary.open')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DiaryStatCard label={t('home.diary.entriesWeek')} value={String(stats.entriesThisWeek)} />
        <DiaryStatCard label={t('home.diary.streak')} value={String(stats.streakDays)} />
        <DiaryStatCard label={t('home.diary.avgWeek')} value={avgLabel ?? '—'} />
        <DiaryStatCard
          label={t('home.diary.today')}
          value={todayLabel ?? (stats.todayHasEntry ? t('home.diary.written') : '—')}
        />
      </div>

      <AppCard className="p-5">
        <div className="flex flex-col gap-4">
          <Typography type="body-xs" color="muted">
            {t('home.diary.last7')}
          </Typography>
          <div className="grid grid-cols-7 gap-2">
            {stats.week.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <DiaryMoodBar mood={day.mood} hasEntry={day.hasEntry} />
                <Typography type="body-xs" color="muted" className="text-[11px]">
                  {day.weekday}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </AppCard>
    </div>
  );
}

type CheckIn = HomeCheckInValue | null;
const LEGACY_CHECK_IN_KEY_PREFIX = 'qhrt-home-check-in';

function greetingKeyForHour(hour: number): 'hello' | 'morning' | 'afternoon' | 'evening' {
  if (hour < 5) return 'hello';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function checkInMessageKey(checkIn: CheckIn): 'up' | 'down' | 'prompt' {
  if (checkIn === 'up') return 'up';
  if (checkIn === 'down') return 'down';
  return 'prompt';
}

function legacyCheckInKey(userId: string) {
  return `${LEGACY_CHECK_IN_KEY_PREFIX}:${userId}`;
}

function readLegacyCheckIn(userId: string): CheckIn {
  try {
    const raw = localStorage.getItem(legacyCheckInKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value?: unknown; at?: unknown };
    if (parsed.value !== 'up' && parsed.value !== 'down') return null;
    if (typeof parsed.at !== 'number') return null;
    if (toDateKey(new Date(parsed.at)) !== toDateKey(new Date())) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

const WELCOME_NOTIFICATION_ID = 'welcome';
const SEEN_NOTIFICATIONS_KEY_PREFIX = 'qhrt-notifications-seen:';

export function readSeenNotificationIds(userId?: string): string[] {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${SEEN_NOTIFICATIONS_KEY_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeSeenNotificationIds(userId: string, ids: string[]) {
  try {
    localStorage.setItem(`${SEEN_NOTIFICATIONS_KEY_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // Ignore.
  }
}

function clearLegacyCheckIn(userId: string) {
  try {
    localStorage.removeItem(legacyCheckInKey(userId));
    localStorage.removeItem(LEGACY_CHECK_IN_KEY_PREFIX);
  } catch {
    // Ignore.
  }
}

export function UserGreeting({
  user,
  userId,
  showCheckIn = true,
  onCheckInComplete,
  presence = null,
  notifications = [],
  checkInValue = null,
  checkInSettled = false,
  initialSeenIds = [],
}: {
  user: NameSource;
  userId?: string;
  showCheckIn?: boolean;
  onCheckInComplete?: () => void;
  presence?: GentlePresence | null;
  notifications?: HomeActivityItem[];
  checkInValue?: HomeCheckInValue | null;
  checkInSettled?: boolean;
  initialSeenIds?: string[];
}) {
  const { t } = useLocale();
  const name = firstNameFromUser(user);
  const greeting = t(`home.greeting.${greetingKeyForHour(new Date().getHours())}`);
  const [checkIn, setCheckIn] = useState<CheckIn>(checkInValue);
  const [loadingCheckIn, setLoadingCheckIn] = useState(Boolean(userId && showCheckIn && !checkInSettled));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>(initialSeenIds);

  useEffect(() => {
    if (checkInSettled) setCheckIn(checkInValue ?? null);
  }, [checkInSettled, checkInValue]);

  const notificationPrefs = notificationPrefsFromUser(user);
  const visibleNotifications = notificationPrefs.inApp && notificationPrefs.activity ? notifications : [];
  const showWelcome = notificationPrefs.inApp && notificationPrefs.welcome;
  const notificationIds = [
    ...(showWelcome ? [WELCOME_NOTIFICATION_ID] : []),
    ...visibleNotifications.map((item) => item.id),
  ];
  const unreadCount = notificationIds.filter((id) => !seenIds.includes(id)).length;

  const openNotifications = () => {
    setNotificationsOpen(true);
    if (!userId) return;
    const next = [...new Set([...seenIds, ...notificationIds])];
    setSeenIds(next);
    writeSeenNotificationIds(userId, next);
  };

  const loadCheckIn = useCallback(async () => {
    if (!userId) {
      setLoadingCheckIn(false);
      return;
    }
    setLoadingCheckIn(true);
    try {
      const response = await fetch('/api/user/home-check-in');
      if (response.ok) {
        const data = (await response.json()) as { value?: CheckIn };
        if (data.value === 'up' || data.value === 'down') {
          setCheckIn(data.value);
          clearLegacyCheckIn(userId);
          return;
        }
      }

      const legacy = readLegacyCheckIn(userId);
      if (legacy) {
        const migrate = await fetch('/api/user/home-check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: legacy }),
        });
        if (migrate.ok) {
          const data = (await migrate.json()) as { value?: CheckIn };
          setCheckIn(data.value === 'up' || data.value === 'down' ? data.value : legacy);
          clearLegacyCheckIn(userId);
          clearSessionCache();
          return;
        }
        setCheckIn(legacy);
      }
    } catch {
      const legacy = userId ? readLegacyCheckIn(userId) : null;
      if (legacy) setCheckIn(legacy);
    } finally {
      setLoadingCheckIn(false);
    }
  }, [userId]);

  useEffect(() => {
    if (checkInSettled) return;
    void loadCheckIn();
  }, [checkInSettled, loadCheckIn]);

  const pick = async (next: HomeCheckInValue) => {
    if (!userId || checkIn) return;
    setCheckIn(next);
    try {
      const response = await fetch('/api/user/home-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      });
      if (!response.ok) {
        setCheckIn(null);
        return;
      }
      const data = (await response.json()) as { value?: CheckIn };
      setCheckIn(data.value === 'up' || data.value === 'down' ? data.value : next);
      clearLegacyCheckIn(userId);
      clearSessionCache();
      onCheckInComplete?.();
    } catch {
      setCheckIn(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <Typography type="h1" weight="normal">
          {greeting}, {name}
        </Typography>
        <div className="flex shrink-0 items-center gap-3">
          {presence ? <HomeGentleStreak presence={presence} /> : null}
          {notificationPrefs.inApp ? (
          <button
            type="button"
            aria-label={t('home.notifications')}
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
            className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-none"
            onClick={openNotifications}
          >
            <HugeiconsIcon icon={Notification01Icon} size={26} strokeWidth={1.75} />
            {unreadCount > 0 ? (
              <span
                className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-none font-medium text-background tabular-nums"
                aria-hidden
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          ) : null}
        </div>
      </div>
      {showCheckIn ? (
        <div className="flex flex-wrap items-center gap-4">
          <Typography type="body" color="muted">
            {t(`home.checkIn.${checkInMessageKey(checkIn)}`)}
          </Typography>
          <CheckInButtons
            value={checkIn}
            loading={loadingCheckIn}
            onPick={(next) => void pick(next)}
          />
        </div>
      ) : null}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title={t('home.notifications')}
      >
        <ul className="flex list-none flex-col gap-3 pl-0">
          {showWelcome ? (
            <li>
              <Typography type="body-sm">{t('home.notificationsWelcome')}</Typography>
            </li>
          ) : null}
          {notificationIds.length === 0 ? (
            <li>
              <Typography type="body-sm" color="muted">
                {t('home.notificationsEmpty')}
              </Typography>
            </li>
          ) : null}
          {visibleNotifications.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex flex-col gap-0.5"
                onClick={() => setNotificationsOpen(false)}
              >
                <Typography type="body-sm">{item.title}</Typography>
                <Typography type="body-xs" color="muted">
                  {item.detail}
                </Typography>
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function SkyLayers({ blend }: { blend: HomeSkyBlend }) {
  return (
    <>
      <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: blend.night }} />
      <div className="home-ambient__layer home-ambient__layer--dawn" style={{ opacity: blend.dawn }} />
      <div className="home-ambient__layer home-ambient__layer--day" style={{ opacity: blend.day }} />
      <div
        className="home-ambient__layer home-ambient__layer--afternoon"
        style={{ opacity: blend.afternoon }}
      />
    </>
  );
}

export function HomePageChrome({ children }: { children: React.ReactNode }) {
  const { sky, skyOpacity } = useHomeTime();
  const accentWarm = Math.min(1, sky.dawn + sky.day + sky.afternoon) * 0.65;
  const accentCool = Math.min(1, sky.night * 0.85 + sky.dawn * 0.35) * 0.6;

  return (
    <div className="relative isolate flex w-full min-h-full flex-1 flex-col -mt-[var(--app-navbar-height)] pt-[var(--app-navbar-height)]">
      <div
        aria-hidden
        className="home-ambient pointer-events-none absolute inset-0 z-0 min-h-full overflow-visible"
      >
        <div className="home-ambient__blobs" style={{ opacity: skyOpacity }}>
          <div className="home-ambient__glob home-ambient__glob--main">
            <SkyLayers blend={sky} />
          </div>
          <div
            className="home-ambient__glob home-ambient__glob--left"
            style={{ opacity: 0.25 + accentCool * 0.35 }}
          >
            <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: sky.night }} />
            <div className="home-ambient__layer home-ambient__layer--dawn" style={{ opacity: sky.dawn * 0.9 }} />
          </div>
          <div
            className="home-ambient__glob home-ambient__glob--right"
            style={{ opacity: 0.2 + accentWarm * 0.4 }}
          >
            <div className="home-ambient__layer home-ambient__layer--day" style={{ opacity: sky.day }} />
            <div
              className="home-ambient__layer home-ambient__layer--afternoon"
              style={{ opacity: sky.afternoon * 0.95 }}
            />
          </div>
          <div
            className="home-ambient__glob home-ambient__glob--mist"
            style={{ opacity: 0.15 + sky.night * 0.22 + sky.dawn * 0.12 }}
          >
            <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: 0.75 }} />
          </div>
        </div>
        <div className="home-ambient__veil" />
      </div>
      <div className="relative z-10 flex w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
