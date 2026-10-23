import type { Metadata } from 'next';
import AssessmentsPage from '@/components/user/AssessmentsPage';

export const metadata: Metadata = {
  title: 'Assessments',
};

export default function Page() {
  return <AssessmentsPage />;
}
