'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Input,
  Label,
  Switch,
  TextField,
  Typography,
} from '@heroui/react';
import { useTheme } from 'next-themes';
import { useSession, clearSessionCache, logoutOnClient } from '@/hooks/useSession';
import { namePartsFromUser } from '@/lib/userName';
import { avatarStampFromUser } from '@/lib/userAvatar';
import { resizeAvatarFile } from '@/lib/resizeAvatar';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  assessmentLayoutFromUser,
  homeCheckInFromUser,
  notificationPrefsFromUser,
  practiceTimeFromUser,
  pronounsFromUser,
  type AssessmentLayout,
} from '@/lib/userSettings';
import { ONBOARDING_PRACTICE_TIMES, ONBOARDING_PRONOUNS } from '@/lib/onboarding';
import CrisisResources from '@/components/ui/CrisisResources';
import FieldSelect from '@/components/ui/FieldSelect';
import SettingsNav, { isSettingsTab, useSettingsNavKey, type SettingsTab } from '@/components/settings/SettingsNav';
import { ChangePasswordModal, DeleteAccountModal } from '@/components/settings/SettingsAccountModals';
import { SettingsBodySkeleton } from '@/components/layout/PageSkeleton';
import { useLocale } from '@/context/LocaleContext';
import { LOCALE_OPTIONS, type AppLocale } from '@/lib/locale';

function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SettingsBodySkeleton />}>
      <SettingsPageShellBody>{children}</SettingsPageShellBody>
    </Suspense>
  );
}

function SettingsPageShellBody({ children }: { children: ReactNode }) {
  const active = useSettingsNavKey();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <div className="flex w-full flex-1 flex-col gap-8 px-6 py-8 lg:flex-row lg:items-start lg:gap-10 lg:px-8 lg:py-10">
        <div className="shrink-0 lg:sticky lg:top-[calc(var(--app-navbar-height)+1.5rem)] lg:self-start">
          <SettingsNav active={active} />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SettingsPageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-1 pb-2">
      <Typography type="h3" weight="normal">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted">
        {subtitle}
      </Typography>
    </header>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <Typography type="body-sm" className="py-3">
        {title}
      </Typography>
      <div className="flex flex-col">{children}</div>
    </section>
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
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
      <div className="min-w-0 flex-1">
        <Typography type="body-sm">{label}</Typography>
        {description ? (
          <Typography type="body-xs" color="muted" className="mt-0.5">
            {description}
          </Typography>
        ) : null}
      </div>
      <div className="shrink-0 sm:flex sm:w-56 sm:justify-end">{children}</div>
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
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyWelcome, setNotifyWelcome] = useState(true);
  const [notifyActivity, setNotifyActivity] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyError, setNotifyError] = useState('');
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
  const [assessmentLayout, setAssessmentLayout] = useState<AssessmentLayout>('step');
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutError, setLayoutError] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    setAssessmentLayout(assessmentLayoutFromUser(session.user));
    setHomeCheckIn(homeCheckInFromUser(session.user));
    const notifications = notificationPrefsFromUser(session.user);
    setNotifyInApp(notifications.inApp);
    setNotifyWelcome(notifications.welcome);
    setNotifyActivity(notifications.activity);
  }, [session]);

  const email = session?.user.email ?? '';
  const hasPhoto = Boolean(photoPreview || avatarStampFromUser(session?.user));

  const handlePhotoPick = async (file: File | undefined) => {
    if (!file) return;
    setPhotoSaving(true);
    setPhotoError('');
    setPhotoSaved(false);
    let previewUrl: string | null = null;
    try {
      const blob = await resizeAvatarFile(file);
      previewUrl = URL.createObjectURL(blob);
      setPhotoPreview(previewUrl);
      const body = new FormData();
      body.append('file', blob, 'avatar.jpg');
      const response = await fetch('/api/settings/avatar', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save that photo.');
      }
      setPhotoSaved(true);
      clearSessionCache();
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPhotoPreview(null);
      setPhotoError(err instanceof Error ? err.message : 'Could not save that photo.');
    } finally {
      setPhotoSaving(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoSaving(true);
    setPhotoError('');
    setPhotoSaved(false);
    try {
      const response = await fetch('/api/settings/avatar', { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not remove that photo.');
      }
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setPhotoSaved(true);
      clearSessionCache();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove that photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

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

  const saveNotification = async (
    key: 'notifyInApp' | 'notifyWelcome' | 'notifyActivity',
    selected: boolean,
    revert: () => void,
  ) => {
    setNotifySaving(true);
    setNotifyError('');
    try {
      await patchSettings({ [key]: selected });
    } catch (err) {
      revert();
      setNotifyError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setNotifySaving(false);
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
    return <SettingsBodySkeleton />;
  }

  return (
    <SettingsPageShell>
      {activeTab === 'profile' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader
            title="Account"
            subtitle="Manage your profile, login information, and devices."
          />
          <SettingsSection title="Profile">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar user={session?.user} size="md" src={photoPreview ?? undefined} />
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField name="firstName" fullWidth>
                  <Label htmlFor="settings-first-name">First name</Label>
                  <Input
                    id="settings-first-name"
                    fullWidth
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </TextField>
                <TextField name="lastName" fullWidth>
                  <Label htmlFor="settings-last-name">Last name</Label>
                  <Input
                    id="settings-last-name"
                    fullWidth
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </TextField>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => void handlePhotoPick(e.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  isPending={photoSaving}
                  isDisabled={photoSaving}
                  onPress={() => photoInputRef.current?.click()}
                >
                  {t('settings.profile.changePhoto')}
                </Button>
                {hasPhoto ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    isPending={photoSaving}
                    isDisabled={photoSaving}
                    onPress={() => void handlePhotoRemove()}
                  >
                    {t('settings.profile.removePhoto')}
                  </Button>
                ) : null}
              </div>
            </div>
            <SettingRow label="Pronouns" description="Only you see this.">
              <FieldSelect
                placeholder="Select pronouns"
                selectedKey={pronouns}
                onChange={setPronouns}
                items={ONBOARDING_PRONOUNS.map((item) => ({ id: item.id, name: item.label }))}
              />
            </SettingRow>
            {photoError ? (
              <Typography type="body-sm" className="py-2 text-danger">
                {photoError}
              </Typography>
            ) : null}
            {photoSaved && !photoError ? (
              <Typography type="body-sm" color="muted" className="py-2">
                {t('settings.profile.photoSaved')}
              </Typography>
            ) : null}
            {error ? (
              <Typography type="body-sm" className="py-2 text-danger">
                {error}
              </Typography>
            ) : null}
            {saved && !error ? (
              <Typography type="body-sm" color="muted" className="py-2">
                Profile saved.
              </Typography>
            ) : null}
            <div className="flex justify-end py-3">
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
          </SettingsSection>
          <SettingsSection title="Sign-in">
            <SettingRow label="Email" description="The address you use to sign in.">
              <Typography type="body-sm" className="truncate">
                {email || 'No email on this account'}
              </Typography>
            </SettingRow>
            <SettingRow label="Password" description="Change the password you sign in with.">
              <Button size="sm" variant="outline" onPress={() => setPasswordOpen(true)}>
                Change password
              </Button>
            </SettingRow>
          </SettingsSection>
          <SettingsSection title="Account">
            <SettingRow
              label="Delete my account"
              description="Removes your account and the data stored with it."
            >
              <Button size="sm" variant="danger" onPress={() => setDeleteOpen(true)}>
                Delete my account
              </Button>
            </SettingRow>
          </SettingsSection>

          <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} />

          <DeleteAccountModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} email={email} />
        </div>
      ) : null}

      {activeTab === 'notifications' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader
            title="Notifications"
            subtitle="Choose what the bell on Home shows."
          />
          <SettingsSection title="In the app">
            <SettingRow label="Bell on Home" description="Show the notifications button next to your greeting.">
              <Switch
                aria-label="Bell on Home"
                isSelected={notifyInApp}
                isDisabled={notifySaving}
                onChange={(selected) => {
                  const previous = notifyInApp;
                  setNotifyInApp(selected);
                  void saveNotification('notifyInApp', selected, () => setNotifyInApp(previous));
                }}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </SettingRow>
            <SettingRow label="Welcome note" description="Include the welcome line in the bell.">
              <Switch
                aria-label="Welcome note"
                isSelected={notifyWelcome}
                isDisabled={notifySaving || !notifyInApp}
                onChange={(selected) => {
                  const previous = notifyWelcome;
                  setNotifyWelcome(selected);
                  void saveNotification('notifyWelcome', selected, () => setNotifyWelcome(previous));
                }}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </SettingRow>
            <SettingRow label="Finished work" description="Include completed self-checks in the bell.">
              <Switch
                aria-label="Finished work"
                isSelected={notifyActivity}
                isDisabled={notifySaving || !notifyInApp}
                onChange={(selected) => {
                  const previous = notifyActivity;
                  setNotifyActivity(selected);
                  void saveNotification('notifyActivity', selected, () => setNotifyActivity(previous));
                }}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </SettingRow>
            {notifyError ? (
              <Typography type="body-sm" className="py-2 text-danger">
                {notifyError}
              </Typography>
            ) : null}
          </SettingsSection>
        </div>
      ) : null}

      {activeTab === 'home' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader
            title={t('settings.home.title')}
            subtitle="The check-in on Home, and when you usually practice."
          />
          <SettingsSection title={t('settings.home.title')}>
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
            <SettingRow
              label={t('settings.home.practiceTime')}
              description="Home uses this when it suggests a next step."
            >
              <FieldSelect
                placeholder={t('settings.home.practicePlaceholder')}
                selectedKey={practiceTime}
                onChange={(value) => void handlePracticeTime(value)}
                isDisabled={homeSaving}
                items={ONBOARDING_PRACTICE_TIMES.map((item) => ({
                  id: item.id,
                  name: item.label,
                }))}
              />
            </SettingRow>
            {homeError ? (
              <Typography type="body-sm" className="py-2 text-danger">
                {homeError}
              </Typography>
            ) : null}
          </SettingsSection>
        </div>
      ) : null}

      {activeTab === 'appearance' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader
            title={t('settings.appearance.title')}
            subtitle="How the app looks, and which language the menus use."
          />
          {mounted ? (
            <>
              <SettingsSection title={t('settings.appearance.title')}>
                <SettingRow label={t('settings.appearance.theme')} description="Light, dark, or match this device.">
                  <FieldSelect
                    placeholder={t('settings.appearance.themePlaceholder')}
                    selectedKey={theme ?? 'light'}
                    onChange={setTheme}
                    items={themeOptions}
                  />
                </SettingRow>
              </SettingsSection>
              <SettingsSection title={t('settings.appearance.language')}>
                <SettingRow
                  label={t('settings.appearance.language')}
                  description={t('settings.appearance.languageDescription')}
                >
                  <FieldSelect
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
                          setLocaleError(err instanceof Error ? err.message : 'Could not save language.');
                        } finally {
                          setLocaleSaving(false);
                        }
                      })();
                    }}
                    items={LOCALE_OPTIONS.map((item) => ({ id: item.id, name: item.name }))}
                  />
                </SettingRow>
                {localeError ? (
                  <Typography type="body-sm" className="py-2 text-danger">
                    {localeError}
                  </Typography>
                ) : null}
              </SettingsSection>
              <SettingsSection title={t('settings.appearance.moduleLayout')}>
                <SettingRow
                  label={t('settings.appearance.moduleLayout')}
                  description={t('settings.appearance.moduleLayoutDescription')}
                >
                  <FieldSelect
                    placeholder={t('settings.appearance.moduleLayout')}
                    selectedKey={assessmentLayout}
                    isDisabled={layoutSaving}
                    onChange={(value) => {
                      const previous = assessmentLayout;
                      const next = value === 'form' ? 'form' : 'step';
                      setAssessmentLayout(next);
                      setLayoutError('');
                      setLayoutSaving(true);
                      void patchSettings({ assessmentLayout: next })
                        .catch((err) => {
                          setAssessmentLayout(previous);
                          setLayoutError(err instanceof Error ? err.message : 'Could not save settings.');
                        })
                        .finally(() => setLayoutSaving(false));
                    }}
                    items={[
                      { id: 'step', name: t('settings.appearance.moduleLayoutStep') },
                      { id: 'form', name: t('settings.appearance.moduleLayoutForm') },
                    ]}
                  />
                </SettingRow>
                {layoutError ? (
                  <Typography type="body-sm" className="py-2 text-danger">
                    {layoutError}
                  </Typography>
                ) : null}
              </SettingsSection>
            </>
          ) : (
            <div className="h-16" aria-hidden />
          )}
        </div>
      ) : null}

      {activeTab === 'data' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader
            title={t('settings.data.title')}
            subtitle="A file of what is stored for your account."
          />
          <SettingsSection title={t('settings.data.title')}>
            {exportError ? (
              <Typography type="body-sm" className="py-2 text-danger">
                {exportError}
              </Typography>
            ) : null}
            <SettingRow label={t('settings.data.download')} description="Diary, check-ins, and account details.">
              <Button
                size="sm"
                variant="outline"
                isPending={exporting}
                isDisabled={exporting}
                onPress={() => void handleExport()}
              >
                {t('settings.data.download')}
              </Button>
            </SettingRow>
          </SettingsSection>
        </div>
      ) : null}

      {activeTab === 'help' ? (
        <div className="flex flex-col gap-8">
          <SettingsPageHeader title={t('settings.help.title')} subtitle="If you need urgent help, or want to sign out." />
          <section className="flex flex-col gap-3">
            <Typography type="body-sm">Urgent help</Typography>
            <CrisisResources variant="full" />
          </section>
          <SettingsSection title={t('settings.help.title')}>
            {helpLinks.map((item) => (
              <SettingRow key={item.href} label={item.name}>
                <Link href={item.href} className="text-sm text-foreground underline-offset-2 hover:underline">
                  Open
                </Link>
              </SettingRow>
            ))}
            <SettingRow label={t('settings.help.logout')} description="Ends this session on this device.">
              <Button
                size="sm"
                variant="outline"
                isPending={loggingOut}
                isDisabled={loggingOut}
                onPress={() => void handleLogout()}
              >
                {t('settings.help.logout')}
              </Button>
            </SettingRow>
          </SettingsSection>
        </div>
      ) : null}
    </SettingsPageShell>
  );
}

export default function SettingsForm() {
  return <SettingsFormBody />;
}
