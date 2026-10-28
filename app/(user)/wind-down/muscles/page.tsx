import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import WindDownPin from '@/components/user/WindDownPin';
import MuscleRelaxPractice from '@/components/user/MuscleRelaxPractice';

export const metadata: Metadata = {
  title: 'Muscle relaxation',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice" extras={<WindDownPin />}>
      <MuscleRelaxPractice />
    </PracticeFocusShell>
  );
}
