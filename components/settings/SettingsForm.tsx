'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Input,
  Label,
  Switch,
  TextField,
  Typography,
  buttonVariants,
} from '@heroui/react';
import { useTheme } from 'next-themes';
import { useSession, clearSessionCache, logoutOnClient } from '@/hooks/useSession';
import { namePartsFromUser } from '@/lib/userName';
import { homeCheckInFromUser, practiceTimeFromUser, pronounsFromUser } from '@/lib/userSettings';
import { ONBOARDING_PRACTICE_TIMES, ONBOARDING_PRONOUNS } from '@/lib/onboarding';
import AppCard from '@/components/ui/AppCard';
import CrisisResources from '@/components/ui/CrisisResources';
import WellnessDisclaimer from '@/components/layout/WellnessDisclaimer';
import FieldSelect from '@/components/ui/FieldSelect';
import SettingsNav, { isSettingsTab, useSettingsNavKey, type SettingsTab } from '@/components/settings/SettingsNav';
import { ChangePasswordModal, DeleteAccountModal } from '@/components/settings/SettingsAccountModals';
import { SettingsBodySkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';
import { useLocale } from '@/context/LocaleContext';
import { LOCALE_OPTIONS, type AppLocale } from '@/lib/locale';

function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <UserPageShell>
          <SettingsBodySkeleton />
        </UserPageShell>
      }
    >
      <SettingsPageShellBody>{children}</SettingsPageShellBody>
    </Suspense>
  );
}

function SettingsPageShellBody({ children }: { children: ReactNode }) {
  const active = useSettingsNavKey();
  const { t } = useLocale();

  return (
    <UserPageShell>
      <Typography type="h3" weight="normal">
        {t('settings.title')}
      </Typography>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <SettingsNav active={active} />
        <div className="min-w-0 flex-1 lg:max-w-xl">{children}</div>
      </div>
    </UserPageShell>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0 flex-1">
        <Typography type="body-sm">{label}</Typography>
        {description ? (
          <Typography type="body-xs" color="muted" className="mt-0.5">
            {description}
          </Typography>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

async function patchSettings(payload: Record<string, unknown>) {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not save settings.');
  }
  clearSessionCache();
}

function SettingsFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : 'profile';

  const { session, loading: sessionLoading, invalidate } = useSession();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [practiceTime, setPracticeTime] = useState('');
  const [homeCheckIn, setHomeCheckIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [error, setError] = useState('');
  const [homeError, setHomeError] = useState('');
  const [saved, setSaved] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeError, setLocaleError] = useState('');

  const themeOptions = [
    { id: 'light', name: t('settings.theme.light') },
    { id: 'dark', name: t('settings.theme.dark') },
    { id: 'system', name: t('settings.theme.system') },
  ];

  const helpLinks = [
    { name: t('settings.help.privacy'), href: '/privacy' },
    { name: t('settings.help.terms'), href: '/terms' },
    { name: t('settings.help.contact'), href: '/contact' },
  ];

  useEffect(() => {
    if (tabParam === 'security' || searchParams.get('password') === '1') {
      setPasswordOpen(true);
      router.replace('/settings?tab=profile', { scroll: false });
    }
  }, [router, searchParams, tabParam]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    const names = namePartsFromUser(session.user);
    setFirstName(names.firstName);
    setLastName(names.lastName);
    setPronouns(pronounsFromUser(session.user));
    setPracticeTime(practiceTimeFromUser(session.user));
    setHomeCheckIn(homeCheckInFromUser(session.user));
  }, [session]);

  const email = session?.user.email ?? '';

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await patchSettings({ firstName, lastName, pronouns: pronouns || null });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleHomeCheckIn = async (selected: boolean) => {
    const previous = homeCheckIn;
    setHomeCheckIn(selected);
    setHomeSaving(true);
    setHomeError('');
    try {
      await patchSettings({ homeCheckIn: selected });
    } catch (err) {
      setHomeCheckIn(previous);
      setHomeError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setHomeSaving(false);
    }
  };

  const handlePracticeTime = async (value: string) => {
    const previous = practiceTime;
    setPracticeTime(value);
    setHomeSaving(true);
    setHomeError('');
    try {
      await patchSettings({ practiceTime: value || null });
    } catch (err) {
      setPracticeTime(previous);
      setHomeError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setHomeSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const response = await fetch('/api/settings/export');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setExportError(typeof data.error === 'string' ? data.error : 'Could not download your data.');
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'qhrt-data.json';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Network error. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    invalidate();
    try {
      await logoutOnClient();
    } catch {
      // Still leave the session locally.
    } finally {
      invalidate();
      router.push('/');
      router.refresh();
      setLoggingOut(false);
    }
  };

  if (sessionLoading) {
    return (
      <UserPageShell>
        <SettingsBodySkeleton />
      </UserPageShell>
    );
  }

  return (
    <SettingsPageShell>
      {activeTab === 'profile' ? (
        <div className="flex flex-col gap-4">
          <AppCard className="p-5">
            <div className="flex flex-col gap-4">
              <AppCard.Title className="font-normal tracking-tight">Profile</AppCard.Title>
              <TextField name="email" type="email" fullWidth>
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" type="email" fullWidth value={email} disabled />
              </TextField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField name="firstName" fullWidth>
                  <Label htmlFor="settings-first-name">First name</Label>
                  <Input
                    id="settings-first-name"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </TextField>
                <TextField name="lastName" fullWidth>
                  <Label htmlFor="settings-last-name">Last name</Label>
                  <Input
                    id="settings-last-name"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </TextField>
              </div>
              <FieldSelect
                label="Pronouns"
                placeholder="Select pronouns"
                selectedKey={pronouns}
                onChange={setPronouns}
                items={ONBOARDING_PRONOUNS.map((item) => ({ id: item.id, name: item.label }))}
              />
              {error ? (
                <Typography type="body-sm" className="text-danger">
                  {error}
                </Typography>
              ) : null}
              {saved && !error ? (
                <Typography type="body-sm" color="muted">
                  Profile saved.
                </Typography>
              ) : null}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  isPending={saving}
                  isDisabled={saving}
                  onPress={() => void handleSave()}
                >
                  Save
                </Button>
              </div>
            </div>
          </AppCard>

          <AppCard className="p-5">
            <div className="flex flex-col gap-4">
              <AppCard.Title className="font-normal tracking-tight">Account</AppCard.Title>
              <SettingRow label="Password" description="Change the password you sign in with.">
                <Button size="sm" variant="outline" onPress={() => setPasswordOpen(true)}>
                  Change password
                </Button>
              </SettingRow>
            </div>
          </AppCard>

          <AppCard className="p-5">
            <div className="flex flex-col gap-4">
              <AppCard.Title className="font-normal tracking-tight">Delete my account</AppCard.Title>
              <div>
                <Button size="sm" variant="danger" onPress={() => setDeleteOpen(true)}>
                  Delete my account
                </Button>
              </div>
            </div>
          </AppCard>

          <ChangePasswordModal
            isOpen={passwordOpen}
            onClose={() => setPasswordOpen(false)}
          />

          <DeleteAccountModal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            email={email}
          />
        </div>
      ) : null}

      {activeTab === 'home' ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-4">
            <AppCard.Title className="font-normal tracking-tight">{t('settings.home.title')}</AppCard.Title>
            <SettingRow
              label={t('settings.home.checkIn')}
              description={t('settings.home.checkInDescription')}
            >
              <Switch
                aria-label={t('settings.home.checkIn')}
                isSelected={homeCheckIn}
                isDisabled={homeSaving}
                onChange={(selected) => void handleHomeCheckIn(selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </SettingRow>
            <FieldSelect
              label={t('settings.home.practiceTime')}
              placeholder={t('settings.home.practicePlaceholder')}
              selectedKey={practiceTime}
              onChange={(value) => void handlePracticeTime(value)}
              isDisabled={homeSaving}
              items={ONBOARDING_PRACTICE_TIMES.map((item) => ({
                id: item.id,
                name: item.label,
              }))}
            />
            {homeError ? (
              <Typography type="body-sm" className="text-danger">
                {homeError}
              </Typography>
            ) : null}
          </div>
        </AppCard>
      ) : null}

      {activeTab === 'appearance' ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-4">
            <AppCard.Title className="font-normal tracking-tight">
              {t('settings.appearance.title')}
            </AppCard.Title>
            {mounted ? (
              <>
                <FieldSelect
                  label={t('settings.appearance.theme')}
                  placeholder={t('settings.appearance.themePlaceholder')}
                  selectedKey={theme ?? 'light'}
                  onChange={setTheme}
                  items={themeOptions}
                />
                <FieldSelect
                  label={t('settings.appearance.language')}
                  placeholder={t('settings.appearance.language')}
                  selectedKey={locale}
                  isDisabled={localeSaving}
                  onChange={(value) => {
                    void (async () => {
                      setLocaleError('');
                      setLocaleSaving(true);
                      try {
                        await setLocale(value as AppLocale);
                      } catch (err) {
                        setLocaleError(
                          err instanceof Error ? err.message : 'Could not save language.'
                        );
                      } finally {
                        setLocaleSaving(false);
                      }
                    })();
                  }}
                  items={LOCALE_OPTIONS.map((item) => ({ id: item.id, name: item.name }))}
                />
                <Typography type="body-xs" color="muted">
                  {t('settings.appearance.languageDescription')}
                </Typography>
                {localeError ? (
                  <Typography type="body-sm" className="text-danger">
                    {localeError}
                  </Typography>
                ) : null}
              </>
            ) : (
              <div className="h-16" aria-hidden />
            )}
          </div>
        </AppCard>
      ) : null}

      {activeTab === 'data' ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-4">
            <AppCard.Title className="font-normal tracking-tight">{t('settings.data.title')}</AppCard.Title>
            {exportError ? (
              <Typography type="body-sm" className="text-danger">
                {exportError}
              </Typography>
            ) : null}
            <div>
              <Button
                size="sm"
                variant="outline"
                isPending={exporting}
                isDisabled={exporting}
                onPress={() => void handleExport()}
              >
                {t('settings.data.download')}
              </Button>
            </div>
          </div>
        </AppCard>
      ) : null}

      {activeTab === 'help' ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-4">
            <AppCard.Title className="font-normal tracking-tight">{t('settings.help.title')}</AppCard.Title>
            <WellnessDisclaimer />
            <CrisisResources variant="full" />
            <div className="flex flex-wrap gap-2">
              {helpLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div>
              <Button
                size="sm"
                variant="ghost"
                isPending={loggingOut}
                isDisabled={loggingOut}
                onPress={() => void handleLogout()}
              >
                {t('settings.help.logout')}
              </Button>
            </div>
          </div>
        </AppCard>
      ) : null}
    </SettingsPageShell>
  );
}

export default function SettingsForm() {
  return <SettingsFormBody />;
}
