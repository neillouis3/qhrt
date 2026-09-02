export const ONBOARDING_PRONOUNS = [
  { id: 'she_her', label: 'She / her' },
  { id: 'he_him', label: 'He / him' },
  { id: 'they_them', label: 'They / them' },
  { id: 'prefer_not', label: 'Prefer not to say' },
] as const;

export const ONBOARDING_REFERRALS = [
  { id: 'search', label: 'Search' },
  { id: 'friend', label: 'Friend or family' },
  { id: 'practitioner', label: 'A practitioner' },
  { id: 'social', label: 'Social media' },
  { id: 'other', label: 'Somewhere else' },
] as const;

export const ONBOARDING_CONCERNS = [
  { id: 'anxiety', label: 'Anxiety or stress', presenting: 'anxiety' },
  { id: 'trauma', label: 'Trauma-related symptoms', presenting: 'trauma' },
  { id: 'depression', label: 'Low mood', presenting: 'depression' },
  { id: 'overwhelm', label: 'Emotional overwhelm', presenting: 'overwhelm' },
  { id: 'sleep', label: 'Sleep difficulty', presenting: 'sleep' },
  { id: 'body', label: 'Body tension or pain', presenting: 'other' },
  { id: 'focus', label: 'Racing thoughts or focus', presenting: 'other' },
] as const;

export const ONBOARDING_SLEEP = [
  { id: 'good', label: 'Mostly restful' },
  { id: 'interrupted', label: 'Interrupted' },
  { id: 'poor', label: 'Poor' },
  { id: 'very_poor', label: 'Very poor' },
] as const;

export const ONBOARDING_REGULATION = [
  { id: 'racing', label: 'Racing thoughts' },
  { id: 'tension', label: 'Physical tension' },
  { id: 'flooding', label: 'Emotional flooding' },
  { id: 'shutdown', label: 'Shutdown or numbness' },
  { id: 'focus', label: 'Difficulty focusing' },
] as const;

export const ONBOARDING_RESOURCES = [
  { id: 'guided', label: 'Guided sessions' },
  { id: 'self_paced', label: 'Self-paced programs' },
  { id: 'sleep_support', label: 'Sleep support' },
  { id: 'body_based', label: 'Body-based practices' },
  { id: 'emotion', label: 'Emotion-focused work' },
  { id: 'check_ins', label: 'Short daily check-ins' },
] as const;

export const ONBOARDING_EXPERIENCE = [
  { id: 'new', label: 'New to this', description: 'I have not tried guided quantum healing before.' },
  { id: 'some', label: 'Some experience', description: 'I have tried related practices on my own.' },
  { id: 'experienced', label: 'Experienced', description: 'I already work with this kind of material.' },
] as const;

export const ONBOARDING_PRACTICE_TIMES = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'whenever', label: 'Whenever I can' },
] as const;

export const ONBOARDING_STEPS = [
  { key: 'about', title: 'About you', short: 'You' },
  { key: 'concerns', title: 'What you are facing', short: 'Facing' },
  { key: 'resources', title: 'What would help', short: 'Help' },
  { key: 'goals', title: 'Where you are now', short: 'Now' },
] as const;

type IdOf<T extends readonly { id: string }[]> = T[number]['id'];

export type OnboardingPronoun = IdOf<typeof ONBOARDING_PRONOUNS>;
export type OnboardingReferral = IdOf<typeof ONBOARDING_REFERRALS>;
export type OnboardingConcern = IdOf<typeof ONBOARDING_CONCERNS>;
export type OnboardingSleep = IdOf<typeof ONBOARDING_SLEEP>;
export type OnboardingRegulation = IdOf<typeof ONBOARDING_REGULATION>;
export type OnboardingResource = IdOf<typeof ONBOARDING_RESOURCES>;
export type OnboardingExperience = IdOf<typeof ONBOARDING_EXPERIENCE>;
export type OnboardingPracticeTime = IdOf<typeof ONBOARDING_PRACTICE_TIMES>;

export interface OnboardingPayload {
  firstName: string;
  lastName: string;
  age: number | null;
  pronouns: OnboardingPronoun | null;
  referral: OnboardingReferral | null;
  concerns: OnboardingConcern[];
  concernOther: string;
  sleepQuality: OnboardingSleep | null;
  regulationIssue: OnboardingRegulation | null;
  resources: OnboardingResource[];
  experience: OnboardingExperience | null;
  practiceTime: OnboardingPracticeTime | null;
  stress: number;
  emotionalIntensity: number;
  bodyTension: number;
  goals: string;
}

export function isId<T extends readonly { id: string }[]>(
  options: T,
  value: unknown
): value is IdOf<T> {
  return typeof value === 'string' && options.some((option) => option.id === value);
}

export function idsOf<T extends readonly { id: string }[]>(
  options: T,
  values: unknown
): IdOf<T>[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is IdOf<T> => isId(options, value));
}

export function labelFor<T extends readonly { id: string; label: string }[]>(
  options: T,
  id: string | null | undefined
): string | undefined {
  if (!id) return undefined;
  return options.find((option) => option.id === id)?.label;
}
