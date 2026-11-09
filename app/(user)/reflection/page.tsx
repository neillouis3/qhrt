import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ReflectionExperience from '@/components/reflection/ReflectionExperience';
import { SLEEP_THEME_PATH } from '@/lib/reflection';

export const metadata: Metadata = {
  title: 'Guided QHRT Reflection',
};

export default async function ReflectionPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  if (!session) redirect(SLEEP_THEME_PATH);
  return <ReflectionExperience sessionId={session} />;
}
