'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearSessionCache, useSession } from '@/hooks/useSession';
import { translate } from '@/lib/i18n/messages';
import {
  DEFAULT_LOCALE,
  htmlLangForLocale,
  localeFromUser,
  readLocaleCookie,
  writeLocaleCookie,
  type AppLocale,
  isAppLocale,
} from '@/lib/locale';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { session, invalidate } = useSession();
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const fromUser = session?.user ? localeFromUser(session.user) : null;
    const fromCookie = readLocaleCookie();
    const next = fromUser ?? fromCookie ?? DEFAULT_LOCALE;
    setLocaleState(next);
    document.documentElement.lang = htmlLangForLocale(next);
  }, [session]);

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next);
      writeLocaleCookie(next);
      document.documentElement.lang = htmlLangForLocale(next);

      if (session?.user) {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: next }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not save language.');
        }
        clearSessionCache();
        invalidate();
      }
    },
    [session?.user, invalidate]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

export { isAppLocale };
