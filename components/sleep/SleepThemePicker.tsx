'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography } from '@heroui/react';
type Clarifier = {
  id: string;
  body: string;
  allowsCustom: boolean;
};

type Theme = {
  id: string;
  themeKey: string;
  label: string;
  clarifiers: Clarifier[];
};

type SessionSummary = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  themeSnapshot: string;
  createdAt: string;
};

export default function SleepThemePicker() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [themeId, setThemeId] = useState('');
  const [clarifierId, setClarifierId] = useState('');
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [themeResponse, sessionResponse] = await Promise.all([
          fetch('/api/reflection/themes?locale=en', { credentials: 'same-origin' }),
          fetch('/api/reflection/sessions', { credentials: 'same-origin' }),
        ]);
        const themeBody = (await themeResponse.json()) as { themes?: Theme[]; error?: string };
        const sessionBody = (await sessionResponse.json()) as { sessions?: SessionSummary[]; error?: string };
        if (cancelled) return;
        if (!themeResponse.ok) {
          setMessage(themeBody.error || 'The theme list is not available yet.');
          return;
        }
        setThemes(themeBody.themes ?? []);
        if (sessionResponse.ok) setSessions(sessionBody.sessions ?? []);
      } catch {
        if (!cancelled) setMessage('The theme list is not available yet.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = themes.find((item) => item.id === themeId) ?? null;
  const clarifier = theme?.clarifiers.find((item) => item.id === clarifierId) ?? null;
  const needsCustom = Boolean(clarifier?.allowsCustom || theme?.themeKey === 'OTHER');
  const ready = Boolean(theme && clarifier && (!needsCustom || custom.trim()));

  const begin = async () => {
    if (!theme || !clarifier || saving) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/reflection/sessions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: theme.id,
          clarifierId: clarifier.id,
          customClarifierText: needsCustom ? custom.trim() : '',
          locale: 'en',
          sourceModuleProgressId: 'sleep',
        }),
      });
      const body = (await response.json()) as { session?: { id: string }; error?: string };
      if (!response.ok || !body.session) {
        setMessage(body.error || 'The reflection could not be started.');
        return;
      }
      router.push(`/reflection?session=${body.session.id}`);
    } catch {
      setMessage('The reflection could not be started.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Typography type="body-xs" color="muted">
          Sleep Education & Self-Observation
        </Typography>
        <Typography type="h1" weight="normal">
          Choose one reflection theme
        </Typography>
        <Typography type="body-sm" color="muted">
          Select one theme and one clarifying statement. This stays in Sleep Education. The guided breathing reflection starts only after you launch it, and each launch is stored as its own session.
        </Typography>
      </div>

      {sessions.some((item) => item.status === 'ACTIVE') ? (
        <div className="flex flex-col gap-2">
          <Typography type="body">Open reflections</Typography>
          {sessions
            .filter((item) => item.status === 'ACTIVE')
            .map((item) => (
              <Link key={item.id} href={`/reflection?session=${item.id}`} className="text-sm underline-offset-4 hover:underline">
                Return to {item.themeSnapshot}
              </Link>
            ))}
        </div>
      ) : null}

      {loading ? <Typography type="body-sm" color="muted">Loading themes…</Typography> : null}
      {message ? <Typography type="body-sm" color="muted">{message}</Typography> : null}

      <div className="flex flex-col gap-2">
        {themes.map((item) => (
          <label key={item.id} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="theme"
              checked={themeId === item.id}
              onChange={() => {
                setThemeId(item.id);
                setClarifierId('');
                setCustom('');
              }}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {theme ? (
        <div className="flex flex-col gap-3">
          <Typography type="body">Clarifying statement</Typography>
          {theme.clarifiers.map((item) => (
            <label key={item.id} className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="clarifier"
                checked={clarifierId === item.id}
                onChange={() => setClarifierId(item.id)}
              />
              <span>{item.body}</span>
            </label>
          ))}
          {needsCustom ? (
            <textarea
              className="min-h-24 rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Write the statement that fits"
            />
          ) : null}
          <Button variant="primary" isDisabled={!ready || saving} onPress={() => void begin()}>
            Begin Guided Reflection
          </Button>
        </div>
      ) : null}

      <Link href="/modules/sleep" className="text-sm text-muted">
        Back to Sleep
      </Link>
    </div>
  );
}
