'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Input, Typography } from '@heroui/react';
import { useLocale } from '@/context/LocaleContext';

export type SettingsTab = 'profile' | 'notifications' | 'home' | 'appearance' | 'data' | 'help';

export type SettingsNavKey = SettingsTab;

type NavItem = {
  key: SettingsNavKey;
  label: string;
  searchText: string;
  href: string;
};

const SETTINGS_NAV_DEFS: {
  groupKey: 'account' | 'preferences' | 'support';
  items: { key: SettingsTab; href: string }[];
}[] = [
  {
    groupKey: 'account',
    items: [
      { key: 'profile', href: '/settings?tab=profile' },
      { key: 'notifications', href: '/settings?tab=notifications' },
      { key: 'data', href: '/settings?tab=data' },
    ],
  },
  {
    groupKey: 'preferences',
    items: [
      { key: 'home', href: '/settings?tab=home' },
      { key: 'appearance', href: '/settings?tab=appearance' },
    ],
  },
  {
    groupKey: 'support',
    items: [{ key: 'help', href: '/settings?tab=help' }],
  },
];

const ALL_TABS: SettingsTab[] = ['profile', 'notifications', 'home', 'appearance', 'data', 'help'];

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
        items: group.items.map((item) => {
          const label = t(`settings.tab.${item.key}`);
          return {
            ...item,
            label,
            searchText: `${label} ${t(`settings.group.${group.groupKey}`)}`.toLowerCase(),
          };
        }),
      })),
    [t]
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        active ? 'bg-foreground/8 text-foreground' : 'text-muted hover:bg-foreground/5 hover:text-foreground'
      }`}
    >
      {item.label}
    </Link>
  );
}

export default function SettingsNav({ active }: { active: SettingsNavKey }) {
  const groups = useSettingsGroups();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      items: needle ? group.items.filter((item) => item.searchText.includes(needle)) : group.items,
    }))
    .filter((group) => group.items.length > 0);

  const nav = (
    <div className="flex flex-col gap-5">
      <Input
        aria-label="Search settings"
        placeholder="Search settings"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />
      {visible.length === 0 ? (
        <Typography type="body-sm" color="muted" className="px-2">
          No matching settings.
        </Typography>
      ) : (
        visible.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <Typography type="body-xs" color="muted" className="px-2 pb-1">
              {group.label}
            </Typography>
            {group.items.map((item) => (
              <NavLink key={item.key} item={item} active={active === item.key} />
            ))}
          </div>
        ))
      )}
    </div>
  );

  return (
    <nav aria-label="Settings sections" className="w-full lg:w-60">
      {nav}
    </nav>
  );
}

export function useSettingsNavKey(): SettingsNavKey {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return activeSettingsKey(pathname ?? '', searchParams.get('tab'));
}
