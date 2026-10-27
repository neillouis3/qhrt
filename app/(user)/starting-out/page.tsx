import type { Metadata } from 'next';
import StartingOutPage from '@/components/user/StartingOutPage';

export const metadata = {
  title: 'Starting out with QHRT',
} satisfies Metadata;

export default function Page() {
  return <StartingOutPage />;
}
