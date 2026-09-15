import type { Metadata } from 'next';
import BreathingPage from '@/components/user/BreathingPage';

export const metadata: Metadata = {
  title: 'Breathe',
};

export default function Page() {
  return <BreathingPage />;
}
