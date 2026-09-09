import type { Metadata } from 'next';
import JourneysPage from '@/components/user/JourneysPage';

export const metadata: Metadata = {
  title: 'Journeys',
};

export default function Page() {
  return <JourneysPage />;
}
