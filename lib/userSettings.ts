import {
  ONBOARDING_PRACTICE_TIMES,
  ONBOARDING_PRONOUNS,
  isId,
  type OnboardingPracticeTime,
  type OnboardingPronoun,
} from '@/lib/onboarding';
import { localeFromUser, type AppLocale } from '@/lib/locale';
import type { NameSource } from '@/lib/userName';

export { localeFromUser, type AppLocale };

function metaValue(user: NameSource, key: string): unknown {
  return user?.user_metadata?.[key];
}

export function pronounsFromUser(user: NameSource): OnboardingPronoun | '' {
  const value = metaValue(user, 'pronouns');
  return isId(ONBOARDING_PRONOUNS, value) ? value : '';
}

export function practiceTimeFromUser(user: NameSource): OnboardingPracticeTime | '' {
  const value = metaValue(user, 'practice_time');
  return isId(ONBOARDING_PRACTICE_TIMES, value) ? value : '';
}

export function homeCheckInFromUser(user: NameSource): boolean {
  const value = metaValue(user, 'home_check_in');
  if (value === false || value === 'false') return false;
  return true;
}
