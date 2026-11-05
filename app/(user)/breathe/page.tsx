import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import BreathingPage from '@/components/user/BreathingPage';

export const metadata: Metadata = {
  title: 'Breathe',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice">
      <BreathingPage />
    </PracticeFocusShell>
  );
}
