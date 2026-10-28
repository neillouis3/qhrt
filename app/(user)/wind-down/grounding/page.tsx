import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import WindDownPin from '@/components/user/WindDownPin';
import GroundingPractice from '@/components/user/GroundingPractice';

export const metadata: Metadata = {
  title: 'Grounding',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice" extras={<WindDownPin />}>
      <GroundingPractice />
    </PracticeFocusShell>
  );
}
