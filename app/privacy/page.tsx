import type { Metadata } from 'next';
import { Typography } from '@heroui/react';
import PublicPage from '@/components/layout/PublicPage';

export const metadata: Metadata = {
  title: 'Privacy',
};

const sections = [
  {
    title: 'What this covers',
    body: 'This notice describes how QHRT handles personal information when you use the web app. We aim to follow Canadian privacy law, including PIPEDA.',
  },
  {
    title: 'What we collect',
    body: 'If you create an account, we store your email, the name you give us, and your sign-in session. As you use the product we also store your focus preferences, session responses, diary notes, and progress you choose to save.',
  },
  {
    title: 'How we use it',
    body: 'We use this information to run your account, keep your sessions and notes available to you, and improve the product. We do not sell your information.',
  },
  {
    title: 'Where it is stored',
    body: 'Account and app data are stored with our hosting and database providers so the product can run. Access is limited to what is needed to operate QHRT.',
  },
  {
    title: 'Your choices',
    body: 'You can update your name and password in Settings, download a copy of your data, or delete your account. Deleting an account removes what you have written here.',
  },
  {
    title: 'This is not emergency care',
    body: 'QHRT is educational coaching, not therapy or a crisis service. If you are in danger or need urgent help, contact local emergency services.',
  },
];

export default function PrivacyPage() {
  return (
    <PublicPage
      title="Privacy"
      intro="We keep what you share as private as we can, and we only use it to run QHRT for you."
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
          Last updated September 7, 2026.
        </Typography>
      </section>
    </PublicPage>
  );
}
