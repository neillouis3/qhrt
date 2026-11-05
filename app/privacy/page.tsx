import type { Metadata } from 'next';
import { Typography } from '@heroui/react';
import PublicPage from '@/components/layout/PublicPage';

export const metadata: Metadata = {
  title: 'Privacy',
};

const sections = [
  {
    title: 'What this covers',
    body: 'This notice describes how QHRT handles personal information when you use the web app in the United States. Federal law and the law of your state can both apply. State privacy laws are not the same, so this notice states what we do in every state, and where a state’s own statute asks for more.',
  },
  {
    title: 'What we collect',
    body: 'If you create an account, we store your email, the name you give us, and your sign-in session. As you use the product we also store your focus preferences, session responses, diary notes, and progress you choose to save.',
  },
  {
    title: 'How we use it',
    body: 'We use this information to run your account, keep your sessions and notes available to you, and improve the product. We do not sell your information. We do not share it for advertising.',
  },
  {
    title: 'Where it is stored',
    body: 'Account and app data are stored with our hosting and database providers so the product can run. Access is limited to what is needed to operate QHRT.',
  },
  {
    title: 'Your choices',
    body: 'You can update your name and password in Settings, download a copy of your data, or delete your account. Deleting an account removes what you have written here. Those controls are how you use access, correction, and deletion, in every state.',
  },
  {
    title: 'State privacy laws',
    body: 'California, Colorado, Connecticut, Texas, Virginia, and a growing list of other states give residents rights to access, correct, and delete personal information, and to opt out of a sale. We do not sell personal information in any state. The statute that applies is the one for the state where you live.',
  },
  {
    title: 'Consumer health data',
    body: 'Wellness notes are not a medical record under HIPAA. QHRT is education and coaching, not a health care provider, health plan, or insurer. Some states still treat this kind of information as consumer health data. Washington and Nevada have their own consumer health data laws. California, Connecticut, and Maryland add separate health-data rules. Most other states with a comprehensive privacy law treat health information as sensitive data and expect opt-in consent before it is used. Iowa and Utah are narrower and rely more on notice and an opt-out. We use wellness notes only to run QHRT for you, in every state.',
  },
  {
    title: 'This is not emergency care',
    body: 'QHRT is educational coaching, not therapy or a crisis service. If you are in immediate danger in the United States, call 911. That number is the same in every state and territory. If you need to talk with someone about suicidal thoughts or emotional distress, call or text 988. Your contact is routed to a crisis center for your area, so the center that answers depends on your state or territory.',
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
          Last updated November 2, 2026.
        </Typography>
      </section>
    </PublicPage>
  );
}
