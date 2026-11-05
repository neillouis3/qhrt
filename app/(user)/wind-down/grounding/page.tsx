import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import GroundingPractice from '@/components/user/GroundingPractice';

export const metadata: Metadata = {
  title: 'Grounding',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice">
      <GroundingPractice />
    </PracticeFocusShell>
  );
}
