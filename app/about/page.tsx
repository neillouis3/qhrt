import type { Metadata } from 'next';
import { Card, Typography } from '@heroui/react';
import { surfaceClass } from '@/components/ui/AppCard';
import SiteFooter from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'About',
};

const team = [
  {
    name: 'Jack Ryan',
    role: 'First intern',
    bio: 'The first person to start this project. Neil is succeeding him on the web app.',
  },
  {
    name: 'Neil Louise Castillon',
    role: 'Intern and lead developer',
    bio: 'Succeeding Jack on the product, designing and building the QHRT web app from here.',
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-col gap-16 px-6 pt-12 lg:w-[60%] lg:max-w-none lg:pt-16">
        <section className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <Typography type="h1" weight="normal">
              About QHRT
            </Typography>
            <Typography type="body" color="muted">
              QHRT is a self-paced wellness and coaching platform. We help you build resilience,
              manage daily stress, and practice habits through educational workbooks and guided
              reflections — not licensed therapy or clinical treatment.
            </Typography>
          </div>
        </section>

        <section className="flex max-w-xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Typography type="body">
              &ldquo;You can&apos;t go back and change the beginning, but you can start where you
              are and change the ending.&rdquo;
            </Typography>
            <Typography type="body-xs" color="muted">
              C.S. Lewis
            </Typography>
          </div>
          <div className="flex flex-col gap-4">
            <Typography type="h4" weight="normal">
              Mission
            </Typography>
            <Typography type="body" color="muted">
              Make thoughtful coaching and educational tools available to anyone working on stress,
              sleep, boundaries, or mindset. Learn on your schedule: no commute, no waiting room, and
              no pressure to finish on someone else&apos;s timeline.
            </Typography>
            <Typography type="body" color="muted">
              QHRT is free to use. The work is to keep the sessions clear, the product calm, and
              your information protected under Canadian privacy law.
            </Typography>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <Typography type="h4" weight="normal">
            Team
          </Typography>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {team.map((person) => (
              <li key={person.name}>
                <Card variant="transparent" className={`${surfaceClass} flex h-full flex-col gap-4 p-5 sm:p-6`}>
                  <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted">
                      {person.role}
                    </Typography>
                    <Card.Title className="font-normal tracking-tight">{person.name}</Card.Title>
                  </div>
                  <Card.Description>{person.bio}</Card.Description>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
