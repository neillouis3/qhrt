'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Label, TextArea, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { TestimonyAid } from '@/components/marketing/PublicAids';
import type { Testimonial } from '@/lib/testimonials';

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/testimonials');
        const json = (await res.json()) as { testimonials?: Testimonial[] };
        if (!cancelled) setItems(json.testimonials ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, body }),
      });
      const json = (await res.json()) as { testimonial?: Testimonial; error?: string };
      if (!res.ok || !json.testimonial) {
        setError(json.error ?? 'Could not save your note.');
        return;
      }
      setItems((current) => [json.testimonial!, ...current]);
      setName('');
      setBody('');
      setDone(true);
    } catch {
      setError('Could not save your note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-12 pb-8">
      <AppCard className="p-5 sm:p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center">
              <TestimonyAid className="size-16" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <Typography type="h4" weight="normal">
                Share a note
              </Typography>
              <Typography type="body-sm" color="muted">
                A sentence or two about how QHRT has been for you. It will appear on this page with
                your name.
              </Typography>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="testimonial-name">How should we sign this?</Label>
            <Input
              id="testimonial-name"
              name="name"
              fullWidth
              autoComplete="given-name"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="testimonial-body">Your note</Label>
            <TextArea
              id="testimonial-body"
              name="body"
              fullWidth
              rows={5}
              placeholder="What felt useful, what you noticed, or what you would tell someone starting out."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          {error ? (
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
          ) : null}
          {done ? (
            <Typography type="body-sm" color="muted">
              Thank you. Your note is on the page.
            </Typography>
          ) : null}
          <Button type="submit" variant="primary" className="w-fit" isDisabled={saving}>
            {saving ? 'Sharing…' : 'Share'}
          </Button>
        </form>
      </AppCard>

      <div className="flex flex-col gap-4">
        <Typography type="h4" weight="normal">
          From people using QHRT
        </Typography>
        {loading ? (
          <Typography type="body-sm" color="muted">
            Loading notes…
          </Typography>
        ) : items.length === 0 ? (
          <Typography type="body-sm" color="muted">
            No notes yet. If something here has helped, the form above is the place to say so.
          </Typography>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <AppCard className="h-full p-5">
                  <Typography type="body" className="font-normal tracking-tight">
                    {item.body}
                  </Typography>
                  <Typography type="body-sm" color="muted" className="pt-3">
                    {item.name}
                  </Typography>
                </AppCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
