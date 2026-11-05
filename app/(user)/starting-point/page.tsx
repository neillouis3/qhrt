import type { Metadata } from 'next';
import StartingPointPage from '@/components/user/StartingPointPage';

export const metadata: Metadata = {
  title: 'Starting point',
};

export default function Page() {
  return <StartingPointPage />;
}
