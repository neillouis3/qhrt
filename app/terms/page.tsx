import type { Metadata } from 'next';
import { Typography } from '@heroui/react';
import PublicPage from '@/components/layout/PublicPage';

export const metadata: Metadata = {
  title: 'Terms',
};

const sections = [
  {
    title: 'Using QHRT',
    body: 'QHRT is a free, self-paced wellness and coaching platform. You may create an account, pause, and come back when you are ready. You are responsible for keeping your sign-in details private.',
  },
  {
    title: 'Coaching and education only',
    body: 'QHRT provides life-coaching concepts and educational resources for self-improvement. It is not therapy, counseling, psychotherapy, or medical care. We do not diagnose conditions, assess symptom severity for clinical purposes, or create individualized treatment plans. Questionnaires route you to standard educational modules — they are not clinical assessments. For mental or physical health concerns, consult a licensed professional.',
  },
  {
    title: 'Your content',
    body: 'What you write in sessions, preferences, and the diary belongs to you. You give us permission to store it so the product can show it back to you. Do not post anything you do not have the right to share.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not misuse the service, try to access someone else’s account, or disrupt the app. We may suspend an account that is used in a way that harms others or the product.',
  },
  {
    title: 'Availability',
    body: 'We work to keep QHRT running, but we do not guarantee it will always be available or error-free. Features may change as the product grows.',
  },
  {
    title: 'This is not emergency care',
    body: 'If you need urgent help, contact local emergency services. Do not rely on QHRT in a crisis.',
  },
];

export default function TermsPage() {
  return (
    <PublicPage
      title="Terms"
      intro="These terms are how you and QHRT agree to use the web app. If you do not agree, please do not create an account."
    >
      <section className="flex max-w-xl flex-col gap-10 pb-8">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <Typography type="h4" weight="normal">
              {section.title}
            </Typography>
            <Typography type="body" color="muted">
              {section.body}
            </Typography>
          </div>
        ))}
        <Typography type="body-xs" color="muted">
          Last updated August 29, 2026.
        </Typography>
      </section>
    </PublicPage>
  );
}
