'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Typography } from '@heroui/react';
import { useLocale } from '@/context/LocaleContext';

export type SettingsTab = 'profile' | 'home' | 'appearance' | 'data' | 'help';

export type SettingsNavKey = SettingsTab;

type NavItem = {
  key: SettingsNavKey;
  label: string;
  href: string;
};

const SETTINGS_NAV_DEFS: { groupKey: 'account' | 'preferences' | 'support'; items: NavItem[] }[] = [
  {
    groupKey: 'account',
    items: [
      { key: 'profile', label: '', href: '/settings?tab=profile' },
      { key: 'data', label: '', href: '/settings?tab=data' },
    ],
  },
  {
    groupKey: 'preferences',
    items: [
      { key: 'home', label: '', href: '/settings?tab=home' },
      { key: 'appearance', label: '', href: '/settings?tab=appearance' },
    ],
  },
  {
    groupKey: 'support',
    items: [{ key: 'help', label: '', href: '/settings?tab=help' }],
  },
];

const ALL_TABS: SettingsTab[] = ['profile', 'home', 'appearance', 'data', 'help'];

export function isSettingsTab(value: string | null): value is SettingsTab {
  return value != null && ALL_TABS.includes(value as SettingsTab);
}

export function activeSettingsKey(_pathname: string, tab: string | null): SettingsNavKey {
  return isSettingsTab(tab) ? tab : 'profile';
}

function useSettingsGroups(): { label: string; items: NavItem[] }[] {
  const { t } = useLocale();
  return useMemo(
    () =>
      SETTINGS_NAV_DEFS.map((group) => ({
        label: t(`settings.group.${group.groupKey}`),
        items: group.items.map((item) => ({
          ...item,
          label: t(`settings.tab.${item.key}`),
        })),
      })),
    [t]
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-default/50 text-foreground'
          : 'text-muted hover:bg-default/30 hover:text-foreground'
      }`}
    >
      {item.label}
    </Link>
  );
}

export default function SettingsNav({ active }: { active: SettingsNavKey }) {
  const groups = useSettingsGroups();

  return (
    <>
      <nav
        aria-label="Settings sections"
        className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
      >
        {groups.flatMap((group) =>
          group.items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active === item.key
                  ? 'bg-default/50 text-foreground'
                  : 'text-muted hover:bg-default/30 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))
        )}
      </nav>

      <nav aria-label="Settings sections" className="hidden w-44 shrink-0 flex-col gap-6 lg:flex">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <Typography type="body-xs" color="muted" className="px-3 pb-1">
              {group.label}
            </Typography>
            {group.items.map((item) => (
              <NavLink key={item.key} item={item} active={active === item.key} />
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

export function useSettingsNavKey(): SettingsNavKey {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return activeSettingsKey(pathname ?? '', searchParams.get('tab'));
}
