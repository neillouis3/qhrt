'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/components/nav/Navbar';
import { useLocale } from '@/context/LocaleContext';

export function useUserNavLinks(): NavItem[] {
  const { t } = useLocale();
  return useMemo(
    () => [
      { name: t('nav.home'), path: '/home' },
      { name: t('nav.practice'), path: '/practice' },
      { name: t('nav.diary'), path: '/diary' },
      { name: t('nav.assessments'), path: '/assessments' },
    ],
    [t]
  );
}

export function usePublicNavLinks(): NavItem[] {
  const { t } = useLocale();
  return useMemo(
    () => [
      { name: t('nav.about'), path: '/about' },
      { name: t('nav.faq'), path: '/faq' },
      { name: t('nav.testimonials'), path: '/testimonials' },
      { name: t('nav.privacy'), path: '/privacy' },
      { name: t('nav.contact'), path: '/contact' },
    ],
    [t]
  );
}
