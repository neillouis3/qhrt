'use client';

import Link from 'next/link';
import { Accordion, Typography } from '@heroui/react';
import type { ReactNode } from 'react';

const faqs: { id: string; question: string; answer: ReactNode }[] = [
  {
    id: 'therapy',
    question: 'Is QHRT therapy or medical care?',
    answer:
      'No. QHRT is coaching and education only — not therapy, counseling, or a clinical service. Check-ins are not diagnoses, and workbooks are not treatment plans. If you have a health concern, talk to a licensed professional.',
  },
  {
    id: 'check-ins',
    question: 'How do focus-area check-ins work?',
    answer:
      'Pick a topic such as sleep, stress, or habits. Each area has its own questions. Some follow-ups only appear when they apply. Your answers stay on the server and are scored there — the form does not tell you how to game a result.',
  },
  {
    id: 'workbooks',
    question: 'What do I get when I finish a check-in?',
    answer:
      'A short educational summary and one or more workbooks matched to that topic. The result is a next step to learn from, not a label or a diagnosis.',
  },
  {
    id: 'free',
    question: 'Is it free? Do I need an appointment?',
    answer:
      'QHRT is free to use. Create an account, pause whenever you like, and come back on your own schedule. There is no commute and no booking slot.',
  },
  {
    id: 'privacy',
    question: 'Who can see my answers?',
    answer: (
      <>
        You need to be signed in. Only you can see your own submissions. Staff with an admin role can
        manage content. We handle personal information under Canadian privacy law. Read the{' '}
        <Link href="/privacy" className="text-brand hover:opacity-80">
          Privacy
        </Link>{' '}
        page for details.
      </>
    ),
  },
  {
    id: 'crisis',
    question: 'What if I need urgent help?',
    answer:
      'QHRT is not emergency or crisis care. If you are in danger or need urgent help, contact local emergency services. Do not rely on this site in a crisis.',
  },
];

export default function LandingFaq() {
  return (
    <section className="flex flex-col gap-10 py-24">
      <Typography type="h4" weight="normal">
        FAQ
      </Typography>
      <Accordion>
        {faqs.map((item) => (
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
                  {item.answer}
                </Typography>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}
