import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SleepThemePicker from '@/components/sleep/SleepThemePicker';

export const metadata: Metadata = {
  title: 'Choose a QHRT Reflection Theme',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== 'sleep') notFound();
  return <SleepThemePicker />;
}
