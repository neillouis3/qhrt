'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/auth/OnboardingWizard';
import { useSession, clearSessionCache } from '@/hooks/useSession';

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.intakeCompleted) {
      router.replace('/home');
    }
  }, [loading, router, session]);

  const goHome = () => {
    clearSessionCache();
    router.push('/home');
  };

  if (loading || !session || session.intakeCompleted) {
    return <div className="min-h-svh bg-background" />;
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-8">
        <OnboardingWizard onComplete={goHome} onSkip={goHome} />
      </div>
    </div>
  );
}
