import type { Metadata } from 'next';
import { PracticeFocusShell } from '@/components/user/PracticeFocusShell';
import WindSettle from '@/components/user/WindSettle';

export const metadata: Metadata = {
  title: 'Settle',
};

export default function Page() {
  return (
    <PracticeFocusShell backHref="/practice" backLabel="Practice">
      <WindSettle />
    </PracticeFocusShell>
  );
}
