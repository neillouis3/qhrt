'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/components/nav/Navbar';
import { useLocale } from '@/context/LocaleContext';

export function useUserNavLinks(): NavItem[] {
  const { t } = useLocale();
  return useMemo(
    () => [
      { name: t('nav.home'), path: '/home' },
      { name: t('nav.sessions'), path: '/sessions' },
      { name: t('nav.diary'), path: '/diary' },
      { name: t('nav.assessments'), path: '/assessments' },
      { name: t('nav.journeys'), path: '/journeys' },
    ],
    [t]
  );
}

export function usePublicNavLinks(): NavItem[] {
  const { t } = useLocale();
  return useMemo(
    () => [
      { name: t('nav.about'), path: '/about' },
      { name: t('nav.contact'), path: '/contact' },
    ],
    [t]
  );
}
