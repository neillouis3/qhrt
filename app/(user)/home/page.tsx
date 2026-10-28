'use client';

import { useEffect, useState } from 'react';
import HomePage, { type HomeDashboardData } from '@/components/user/HomePage';
import UserPageShell from '@/components/layout/UserPageShell';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const { session, loading: sessionLoading } = useSession();
  const [dashboardReady, setDashboardReady] = useState(false);
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/user/dashboard')
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as HomeDashboardData;
      })
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
        setDashboardReady(true);
      })
      .catch(() => {
        if (!cancelled) setDashboardReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (sessionLoading || !dashboardReady) {
    return (
      <UserPageShell wide="75" transparentBg>
        <div role="status" aria-live="polite" className="sr-only">
          Loading home
        </div>
      </UserPageShell>
    );
  }

  return (
    <HomePage
      userId={session?.user?.id}
      user={session?.user}
      intakeCompleted={session?.intakeCompleted ?? false}
      initialDashboard={dashboard}
    />
  );
}
