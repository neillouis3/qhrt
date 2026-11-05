import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import MuscleRelaxPractice from '@/components/user/MuscleRelaxPractice';

export const metadata: Metadata = {
  title: 'Muscle relaxation',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice">
      <MuscleRelaxPractice />
    </PracticeFocusShell>
  );
}
