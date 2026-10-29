'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Accordion, Button, Input, Label, TextArea, Typography } from '@heroui/react';
import AppCard from '@/components/ui/AppCard';
import { FaqAid } from '@/components/marketing/PublicAids';
import { FAQ_ITEMS } from '@/lib/faq';

export default function FaqPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/faq-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, question }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not send your question.');
        return;
      }
      setName('');
      setEmail('');
      setQuestion('');
      setDone(true);
    } catch {
      setError('Could not send your question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-12 pb-8">
      <Accordion>
        {FAQ_ITEMS.map((item) => (
          <Accordion.Item key={item.id} id={item.id}>
            <Accordion.Heading>
              <Accordion.Trigger className="px-0 py-5 font-normal tracking-tight hover:bg-transparent data-[hovered=true]:bg-transparent">
                <Typography type="body" className="font-normal tracking-tight">
                  {item.question}
                </Typography>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="max-w-xl px-0 pb-5">
                <Typography type="body-sm" color="muted">
                  {item.id === 'privacy' ? (
                    <>
                      You need to be signed in. Only you can see your own submissions. Staff with an
                      admin role can manage content. We handle personal information under Canadian
                      privacy law. Read the{' '}
                      <Link href="/privacy" className="text-brand hover:opacity-80">
                        Privacy
                      </Link>{' '}
                      page for details.
                    </>
                  ) : (
                    item.answer
                  )}
                </Typography>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <AppCard className="p-5 sm:p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center">
              <FaqAid className="size-16" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <Typography type="h4" weight="normal">
                Still have a question?
              </Typography>
              <Typography type="body-sm" color="muted">
                If it is not in the list, send it here. Optional email if you want a reply.
              </Typography>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="faq-name">Name</Label>
            <Input
              id="faq-name"
              name="name"
              fullWidth
              autoComplete="name"
              placeholder="Optional"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="faq-email">Email</Label>
            <Input
              id="faq-email"
              name="email"
              type="email"
              fullWidth
              autoComplete="email"
              placeholder="Optional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="faq-question">Your question</Label>
            <TextArea
              id="faq-question"
              name="question"
              fullWidth
              rows={4}
              placeholder="What do you still want to know?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          {error ? (
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
          ) : null}
          {done ? (
            <Typography type="body-sm" color="muted">
              Received. We will use it to fill gaps on this page.
            </Typography>
          ) : null}
          <Button type="submit" variant="primary" className="w-fit" isDisabled={saving}>
            {saving ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </AppCard>
    </section>
  );
}
