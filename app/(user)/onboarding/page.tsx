import type { Metadata } from 'next';
import OnboardingPage from '@/components/user/OnboardingPage';

export const metadata: Metadata = {
  title: 'A few questions',
};

export default function Page() {
  return <OnboardingPage />;
}
