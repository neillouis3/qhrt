import type { Metadata } from 'next';
import { Typography } from '@heroui/react';
import PublicPage from '@/components/layout/PublicPage';

export const metadata: Metadata = {
  title: 'Terms',
};

const sections = [
  {
    title: 'Using QHRT',
    body: 'QHRT is a free, self-paced wellness and coaching platform for use in the United States. You may create an account, pause, and come back when you are ready. You are responsible for keeping your sign-in details private.',
  },
  {
    title: 'Coaching and education only',
    body: 'QHRT provides life-coaching concepts and educational resources for self-improvement. It is not therapy, counseling, psychotherapy, psychology, or medical care, and it does not create a clinician–patient relationship. Who may practice those professions is set separately by each state. QHRT does not provide a service that requires a professional license in any state. We do not diagnose conditions, assess symptom severity for clinical purposes, or create individualized treatment plans. Questionnaires route you to standard educational modules — they are not clinical assessments. For a mental or physical health concern, consult a professional licensed in your state.',
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
    title: 'Which law applies',
    body: 'These terms cover use of QHRT in the United States. Professional licensing and consumer privacy both follow the state where you live. If a state law gives you a right that a contract cannot waive, that state law controls for you.',
  },
  {
    title: 'This is not emergency care',
    body: 'If you are in immediate danger in the United States, call 911. That number is the same in every state and territory. For suicidal crisis or emotional distress, call or text 988. 988 is national, and the crisis center that answers is local, so the response you reach can differ by state or territory. Do not rely on QHRT in a crisis.',
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
          Last updated November 2, 2026.
        </Typography>
      </section>
    </PublicPage>
  );
}
