import type { Metadata } from 'next';
import DiaryPage from '@/components/user/DiaryPage';

export const metadata: Metadata = {
  title: 'Diary',
};

export default function Page() {
  return <DiaryPage />;
}
