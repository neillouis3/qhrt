import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, Typography, buttonVariants } from '@heroui/react';
import { surfaceClass } from '@/components/ui/AppCard';
import PublicPage from '@/components/layout/PublicPage';

export const metadata: Metadata = {
  title: 'Contact',
};

const topics = [
  {
    title: 'Your account',
    body: 'Sign in and open Settings to change your name or password, download your data, or delete your account.',
    href: '/login',
    label: 'Sign in',
  },
  {
    title: 'Privacy',
    body: 'Read how we handle the information you save in QHRT, including preferences, sessions, and diary notes.',
    href: '/privacy',
    label: 'Privacy',
  },
  {
    title: 'Terms',
    body: 'See how you may use the product, including that QHRT is coaching and education — not therapy or emergency care.',
    href: '/terms',
    label: 'Terms',
  },
];

export default function ContactPage() {
  return (
    <PublicPage
      title="Contact"
      intro="QHRT is a small team. Start with the pages below for account, privacy, and how the product may be used."
    >
      <section className="flex flex-col gap-10 pb-8">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.title}>
              <Card variant="transparent" className={`${surfaceClass} h-full`}>
                <Card.Header>
                  <Card.Title className="font-normal tracking-tight">{topic.title}</Card.Title>
                </Card.Header>
                <Card.Description>{topic.body}</Card.Description>
                <div className="pt-2">
                  <Link href={topic.href} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                    {topic.label}
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <Typography type="body" color="muted" className="max-w-xl">
          If you are in danger or need urgent help, contact local emergency services. QHRT is not a
          crisis line.
        </Typography>
      </section>
    </PublicPage>
  );
}
