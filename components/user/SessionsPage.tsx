'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonVariants, Typography } from '@heroui/react';
import UserPageShell from '@/components/layout/UserPageShell';
import { PageHeader } from '@/components/layout/UserPageShell';
import SessionRow from '@/components/session/SessionRow';
import { SessionListSkeleton } from '@/components/layout/PageSkeleton';
import { formatSectionDate, formatTime, groupByDate, statusLabel } from '@/lib/sessionUi';
import { usePinnedPractices } from '@/hooks/usePinnedPractices';
import { pinKey } from '@/lib/pinnedPractices';

interface UserConversation {
  id: string;
  knowledge_model_id: string;
  knowledge_model_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export default function SessionsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinPendingKey, setPinPendingKey] = useState<string | null>(null);
  const { syncPins, isPinned, togglePin } = usePinnedPractices();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, pinsRes] = await Promise.all([
        fetch('/api/conversation/sessions'),
        fetch('/api/user/pins'),
      ]);
      if (pinsRes.ok) {
        const pinsData = await pinsRes.json();
        if (Array.isArray(pinsData.pins)) syncPins(pinsData.pins);
      }
      if (!res.ok) {
        setConversations([]);
        return;
      }
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error('[Conversations] Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [syncPins]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePin = async (conv: UserConversation) => {
    const key = pinKey('session', conv.id);
    setPinPendingKey(key);
    try {
      await togglePin({
        kind: 'session',
        id: conv.id,
        title: conv.knowledge_model_name,
        href: `/sessions/${conv.id}`,
      });
    } catch (err) {
      console.error('[Conversations] Pin failed:', err);
    } finally {
      setPinPendingKey(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/conversation/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not delete session');
      }
      setConversations((current) => current.filter((conv) => conv.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete session');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <SessionListSkeleton />;
  }

  return (
    <UserPageShell>
      <PageHeader
        title="Sessions"
        subtitle="Pick up a session you already started, or review one you finished."
      />

      {error && (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      )}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <Typography type="body-sm" color="muted">
            You have not started any sessions yet.
          </Typography>
          <Link href="/assessments" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
            Browse assessments
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupByDate(conversations, (conv) => conv.started_at).map(({ key, items }) => (
            <section key={key} className="flex flex-col gap-3">
              <Typography type="body">{formatSectionDate(key)}</Typography>
              {items.map((conv) => (
                <SessionRow
                  key={conv.id}
                  title={conv.knowledge_model_name}
                  time={formatTime(conv.started_at)}
                  status={statusLabel(conv.status)}
                  actionLabel={conv.status === 'completed' ? 'View' : 'Resume'}
                  actionVariant={conv.status === 'completed' ? 'outline' : 'primary'}
                  onAction={() => router.push(`/sessions/${conv.id}`)}
                  pinned={isPinned('session', conv.id)}
                  pinPending={pinPendingKey === pinKey('session', conv.id)}
                  onTogglePin={() => void handleTogglePin(conv)}
                  onDelete={() => void handleDelete(conv.id)}
                  deleting={deletingId === conv.id}
                  deleteLabel="Delete session"
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </UserPageShell>
  );
}
