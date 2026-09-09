import type { Metadata } from 'next';
import SessionsPage from '@/components/user/SessionsPage';

export const metadata: Metadata = {
  title: 'Sessions',
};

export default function Page() {
  return <SessionsPage />;
}
