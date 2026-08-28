'use client';

import { useState, useEffect } from 'react';
import ConditionSelection from '@/components/ConditionSelection';
import Dashboard from '@/components/Dashboard';
import Modal from '@/components/Modal';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  // Use shared session hook - no redundant /api/auth/session fetch
  const { session, loading: sessionLoading } = useSession();
  const [showSelection, setShowSelection] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Once session is loaded, check if user has selected conditions
    if (sessionLoading) return;

    if (!session) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    // Check for selected conditions
    fetch('/api/user/selected-conditions', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const hasConditions = (data.selectedConditions ?? []).length > 0;
        if (hasConditions) {
          setSelectionComplete(true);
          setShowSelection(false);
        } else {
          setShowSelection(true);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // If API doesn't exist yet (tables not created), fall back to intake check
        if (session.intakeCompleted) {
          setSelectionComplete(true);
          setShowSelection(false);
        } else {
          setShowSelection(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [session, sessionLoading]);

  const handleSelectionComplete = () => {
    setShowSelection(false);
    setSelectionComplete(true);
  };

  const handleSelectionSkip = () => {
    setShowSelection(false);
    setSelectionComplete(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-navy">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-navy">
      <Dashboard
        userId={session?.user?.id}
        userName={session?.user?.email}
        onIntakeComplete={selectionComplete}
      />

      <Modal
        isOpen={showSelection}
        onClose={handleSelectionSkip}
        title="Welcome to QHRT — Let's get started"
        size="xl"
      >
        <p className="text-sm text-muted mb-4">
          Before we begin, tell us what you'd like to focus on. You can always change this later.
        </p>
        <ConditionSelection onComplete={handleSelectionComplete} onSkip={handleSelectionSkip} />
      </Modal>
    </div>
  );
}
