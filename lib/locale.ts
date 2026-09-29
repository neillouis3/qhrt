import type { NameSource } from '@/lib/userName';

export type AppLocale = 'en' | 'fr' | 'tl' | 'hi';

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_COOKIE = 'qhrt-locale';

export const LOCALE_OPTIONS: { id: AppLocale; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
  { id: 'tl', name: 'Tagalog' },
  { id: 'hi', name: 'हिन्दी' },
];

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'fr' || value === 'tl' || value === 'hi';
}

export function localeFromUser(user: NameSource | undefined | null): AppLocale {
  const raw = user?.user_metadata?.locale;
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function htmlLangForLocale(locale: AppLocale): string {
  switch (locale) {
    case 'fr':
      return 'fr-CA';
    case 'tl':
      return 'fil';
    case 'hi':
      return 'hi';
    default:
      return 'en';
  }
}

export function readLocaleCookie(): AppLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : '';
  return isAppLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: AppLocale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
}
