'use client';

import HomePage from '@/components/user/HomePage';
import { HomeSkeleton } from '@/components/layout/PageSkeleton';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const { session, loading: sessionLoading } = useSession();

  if (sessionLoading) {
    return <HomeSkeleton />;
  }

  return (
    <HomePage
      userId={session?.user?.id}
      user={session?.user}
      intakeCompleted={session?.intakeCompleted ?? false}
    />
  );
}
