import type { Metadata } from 'next';
import PracticePage from '@/components/user/PracticePage';

export const metadata: Metadata = {
  title: 'Practice',
};

export default function Page() {
  return <PracticePage />;
}
