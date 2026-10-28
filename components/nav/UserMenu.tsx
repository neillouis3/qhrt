'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Dropdown, Typography } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  Database01Icon,
  HelpCircleIcon,
  Logout01Icon,
  Notification01Icon,
  PaintBoardIcon,
  Settings01Icon,
  TranslateIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useLocale } from '@/context/LocaleContext';
import { LOCALE_OPTIONS } from '@/lib/locale';
import UserAvatar from '@/components/ui/UserAvatar';
import { firstNameFromUser, fullNameFromUser, type NameSource } from '@/lib/userName';

export interface UserMenuProps {
  user: NameSource;
  onSettings: () => void;
  onLogout: () => void;
}

function MenuRow({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement;
  label: string;
  value?: string;
}) {
  return (
    <span className="flex w-full items-center gap-3">
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} className="shrink-0 text-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      {value ? (
        <span className="flex shrink-0 items-center gap-1 text-sm text-muted">
          <span className="max-w-28 truncate">{value}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
        </span>
      ) : null}
    </span>
  );
}

export default function UserMenu({ user, onSettings, onLogout }: UserMenuProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const name = fullNameFromUser(user, 'Account');
  const email = user?.email?.trim() ?? '';
  const shortName = firstNameFromUser(user, name);
  const languageName = LOCALE_OPTIONS.find((item) => item.id === locale)?.name ?? 'English';
  const themeKey = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`${name} menu`}
        className="group inline-flex h-auto items-center gap-2 rounded-none bg-transparent p-0 text-foreground shadow-none outline-none hover:bg-transparent data-[hovered]:bg-transparent data-[pressed]:bg-transparent data-[focus-visible]:bg-transparent"
      >
        <UserAvatar user={user} size="sm" />
        <span className="max-w-32 truncate text-sm font-normal underline-offset-[3px] group-hover:underline group-data-[pressed]:underline group-focus-visible:underline">
          {shortName}
        </span>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="w-80">
        <div className="flex items-center gap-3 px-3 pt-3 pb-2">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <Typography type="body-sm" className="truncate">
              {name}
            </Typography>
            {email ? (
              <Typography type="body-xs" color="muted" className="truncate">
                {email}
              </Typography>
            ) : null}
          </div>
        </div>
        <Dropdown.Menu
          aria-label="Account"
          onAction={(key) => {
            if (key === 'account') router.push('/settings?tab=profile');
            if (key === 'logout') onLogout();
            if (key === 'data') router.push('/settings?tab=data');
            if (key === 'appearance') router.push('/settings?tab=appearance');
            if (key === 'language') router.push('/settings?tab=appearance');
            if (key === 'notifications') router.push('/settings?tab=notifications');
            if (key === 'settings') onSettings();
            if (key === 'help') router.push('/settings?tab=help');
          }}
        >
          <Dropdown.Item id="account" textValue={t('settings.tab.profile')} className="text-brand">
            <span className="text-sm text-brand">{t('settings.tab.profile')}</span>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue={t('settings.help.logout')}>
            <MenuRow icon={Logout01Icon} label={t('settings.help.logout')} />
          </Dropdown.Item>
          <Dropdown.Section className="mt-1 border-t border-border pt-1">
            <Dropdown.Item id="data" textValue={t('settings.tab.data')}>
              <MenuRow icon={Database01Icon} label={t('settings.tab.data')} />
            </Dropdown.Item>
            <Dropdown.Item id="notifications" textValue={t('settings.tab.notifications')}>
              <MenuRow icon={Notification01Icon} label={t('settings.tab.notifications')} />
            </Dropdown.Item>
            <Dropdown.Item id="appearance" textValue={t('settings.tab.appearance')}>
              <MenuRow
                icon={PaintBoardIcon}
                label={t('settings.tab.appearance')}
                value={mounted ? t(`settings.theme.${themeKey}`) : undefined}
              />
            </Dropdown.Item>
            <Dropdown.Item id="language" textValue={t('settings.appearance.language')}>
              <MenuRow icon={TranslateIcon} label={t('settings.appearance.language')} value={languageName} />
            </Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Section className="mt-1 border-t border-border pt-1">
            <Dropdown.Item id="settings" textValue={t('settings.title')}>
              <MenuRow icon={Settings01Icon} label={t('settings.title')} />
            </Dropdown.Item>
            <Dropdown.Item id="help" textValue={t('settings.tab.help')}>
              <MenuRow icon={HelpCircleIcon} label={t('settings.tab.help')} />
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
