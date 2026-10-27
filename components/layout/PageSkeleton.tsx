import { Skeleton } from '@heroui/react';
import AppCard, { surfaceClass } from '@/components/ui/AppCard';
import UserPageShell from '@/components/layout/UserPageShell';

function HeaderBones() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
    </div>
  );
}

function SessionRowBones({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`${surfaceClass} flex items-center justify-between gap-6 px-4 py-3.5`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-3 w-10 rounded-lg" />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Skeleton className="h-3 w-16 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssessmentGridSkeleton() {
  return (
    <UserPageShell>
      <div role="status" aria-label="Loading assessments" className="flex flex-col gap-10">
        <HeaderBones />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="relative aspect-square w-full">
              <AppCard className="absolute inset-0 overflow-hidden p-0">
                <div className="flex h-full flex-col">
                  <Skeleton className="h-[42%] w-full rounded-none" />
                  <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                    <Skeleton className="h-5 w-36 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-3 w-4/5 rounded-lg" />
                    <div className="mt-auto flex justify-end">
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading assessments</span>
      </div>
    </UserPageShell>
  );
}

export function SessionListSkeleton() {
  return (
    <UserPageShell>
      <div role="status" aria-label="Loading" className="flex flex-col gap-10">
        <HeaderBones />
        <SessionRowBones />
        <span className="sr-only">Loading</span>
      </div>
    </UserPageShell>
  );
}

export function DiarySkeleton() {
  return (
    <UserPageShell>
      <div role="status" aria-label="Loading diary" className="flex flex-col gap-10">
        <HeaderBones />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <AppCard key={index} className="flex flex-col gap-3 p-5">
              <Skeleton className="h-3 w-28 rounded-lg" />
              <Skeleton className="h-7 w-10 rounded-lg" />
            </AppCard>
          ))}
        </div>
        <div className="flex w-72 flex-col gap-3">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, index) => (
              <Skeleton key={index} className="size-9 rounded-lg" />
            ))}
          </div>
        </div>
        <span className="sr-only">Loading diary</span>
      </div>
    </UserPageShell>
  );
}

export function HomeSkeleton() {
  return (
    <UserPageShell transparentBg>
      <div role="status" aria-label="Loading home" className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        </div>
        <AppCard className="flex flex-col gap-3 p-5">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </AppCard>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-16 rounded-lg" />
          <SessionRowBones count={2} />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded-lg" />
          <div className="flex flex-col gap-2 pl-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <Skeleton className="h-4 w-40 rounded-lg" />
                  <Skeleton className="h-3 w-full max-w-sm rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-16 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-12 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <AppCard key={index} className="flex flex-col gap-2 p-4">
                <Skeleton className="h-7 w-10 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </AppCard>
            ))}
          </div>
          <AppCard className="p-5">
            <Skeleton className="mb-4 h-3 w-20 rounded-lg" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="mx-auto h-9 w-2.5 rounded-full" />
              ))}
            </div>
          </AppCard>
        </div>
        <span className="sr-only">Loading home</span>
      </div>
    </UserPageShell>
  );
}

export function SettingsBodySkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      className="flex w-full flex-1 flex-col gap-8 bg-background px-6 py-8 lg:flex-row lg:items-start lg:gap-10 lg:px-8 lg:py-10"
    >
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-60">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 3 }, (_, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16 rounded-lg" />
            {Array.from({ length: groupIndex === 1 ? 2 : groupIndex === 0 ? 2 : 1 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <span className="sr-only">Loading settings</span>
    </div>
  );
}

export function DashboardBodySkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <AppCard key={index} className="flex flex-col gap-3 p-5">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </AppCard>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <AppCard key={index} className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-2/3 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-4/5 rounded-lg" />
          </AppCard>
        ))}
      </div>
    </div>
  );
}

export function FocusContentSkeleton() {
  return (
    <div role="status" aria-label="Loading session" className="flex flex-col gap-4">
      <Skeleton className="h-5 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-5/6 rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <span className="sr-only">Loading session</span>
    </div>
  );
}
