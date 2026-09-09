'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Typography, buttonVariants } from '@heroui/react';
import { diaryPayloadFromRecap } from '@/lib/recapDiary';
import type { SessionRecapData } from '@/lib/types/conversation';

export interface SessionOverviewStep {
  id: string;
  index?: string;
  label: string;
  description: string | null;
}

export function SessionOverview({ steps }: { steps: SessionOverviewStep[] }) {
  if (steps.length === 0) return null;

  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3">
          {step.index ? (
            <Typography type="body-xs" color="muted" className="w-5 shrink-0 pt-0.5">
              {step.index}
            </Typography>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Typography type="body">{step.label}</Typography>
            {step.description ? (
              <Typography type="body-sm" color="muted">
                {step.description}
              </Typography>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SessionRecap({ entries }: SessionRecapData) {
  if (entries.length === 0) {
    return (
      <Typography type="body-sm" color="muted">
        Your responses have been saved.
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography type="body-xs" color="muted">
        What you wrote
      </Typography>
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-col gap-1">
          <Typography type="body-sm" color="muted">
            {entry.prompt}
          </Typography>
          <Typography type="body">{entry.answer}</Typography>
        </div>
      ))}
    </div>
  );
}

function savedStorageKey(kind: string, id: string) {
  return `qhrt-recap-diary:${kind}:${id}`;
}

export function SessionRecapFooter({
  sessionTitle,
  recap,
  sourceKind,
  sourceId,
  readOnlyNote,
}: {
  sessionTitle: string;
  recap: SessionRecapData;
  sourceKind: 'session' | 'journey';
  sourceId: string;
  readOnlyNote?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(savedStorageKey(sourceKind, sourceId)) === '1');
    } catch {
      setSaved(false);
    }
  }, [sourceKind, sourceId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = diaryPayloadFromRecap(sessionTitle, recap);
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate: payload.entryDate,
          title: payload.title,
          body: payload.body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save to diary.');
      }
      setSaved(true);
      try {
        localStorage.setItem(savedStorageKey(sourceKind, sourceId), '1');
      } catch {
        // Ignore.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save to diary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {readOnlyNote ? (
        <Typography type="body-xs" color="muted">
          {readOnlyNote}
        </Typography>
      ) : null}
      <SessionRecap {...recap} />
      <div className="flex flex-col gap-2">
        {saved ? (
          <div className="flex flex-wrap items-center gap-3">
            <Typography type="body-sm" color="muted">
              Saved to your diary.
            </Typography>
            <Link href="/diary" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              Open diary
            </Link>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            isPending={saving}
            isDisabled={saving}
            onPress={() => void handleSave()}
          >
            Save to diary
          </Button>
        )}
        {error ? (
          <Typography type="body-xs" className="text-danger">
            {error}
          </Typography>
        ) : null}
      </div>
    </div>
  );
}
