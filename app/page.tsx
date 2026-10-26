import Image from 'next/image';
import Link from 'next/link';
import { Card, Typography } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import {
  BookOpen02Icon,
  ChartIncreaseIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Globe02Icon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import { surfaceClass } from '@/components/ui/AppCard';
import { LandingIcon } from '@/components/marketing/LandingIcons';
import HowItWorks from '@/components/marketing/HowItWorks';
import { LandingCta } from '@/components/marketing/MarketingCtas';
import SiteFooter from '@/components/layout/SiteFooter';

const facts = [
  { label: 'Privacy', value: 'PIPEDA compliant' },
  { label: 'Content', value: 'Expertly curated' },
  { label: 'Access', value: 'Free to use' },
];

const features = [
  {
    title: 'Guided programs',
    description: 'Structured modules on stress, sleep, and habits — built for self-improvement at your pace.',
    icon: BookOpen02Icon,
  },
  {
    title: 'Self-paced learning',
    description:
      'Work through content on your own schedule. Pause, revisit, and progress at a pace that feels right.',
    icon: Clock01Icon,
  },
  {
    title: 'Private & secure',
    description: 'Your data is protected under Canadian privacy law. Your privacy is our priority.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Accessible from anywhere',
    description: 'No commute, no waiting rooms. Practice from wherever feels comfortable.',
    icon: Globe02Icon,
  },
  {
    title: 'Progress tracking',
    description: 'Set goals, reflect on your journey, and see how far you have come.',
    icon: ChartIncreaseIcon,
  },
  {
    title: 'Free to access',
    description: 'Quality wellness and coaching resources should be accessible to everyone.',
    icon: CheckmarkCircle02Icon,
  },
];

const cardClass = surfaceClass;

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-col px-6 lg:w-[60%] lg:max-w-none">
        <section className="grid items-center gap-12 pt-28 pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pt-36 lg:pb-32">
          <div className="flex flex-col gap-8">
            <div className="flex max-w-xl flex-col gap-4">
              <Typography type="h1" weight="normal">
                QHRT
              </Typography>
              <Typography type="body-sm" className="text-muted">
                Wellness & resilience coaching
              </Typography>
              <Typography type="body" color="muted">
                Self-guided education for daily stress, habits, and mindset — not therapy or
                medical treatment. Pick a focus, unlock standard workbooks, and build routines that
                fit your life.
              </Typography>
            </div>

            <dl className="flex flex-wrap items-start gap-x-10 gap-y-5">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1">
                  <dt className="m-0">
                    <Typography type="body-xs" color="muted">
                      {fact.label}
                    </Typography>
                  </dt>
                  <dd className="m-0">
                    <Typography type="body-sm">{fact.value}</Typography>
                  </dd>
                </div>
              ))}
            </dl>

            <LandingCta />
          </div>

          <div className="relative min-h-64 w-full overflow-hidden rounded-lg lg:min-h-[380px]">
            <Image
              src="/hero-gradient.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 28vw, 90vw"
              className="object-cover object-center"
            />
          </div>
        </section>

        <HowItWorks />

        <section className="flex flex-col gap-10 py-24">
          <Typography type="h4" weight="normal">
            Why QHRT
          </Typography>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} variant="transparent" className={cardClass}>
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent-lighter dark:bg-primary/15">
                  <LandingIcon icon={feature.icon} size={18} className="text-primary" />
                </div>
                <Card.Header>
                  <Card.Title className="font-normal tracking-tight">{feature.title}</Card.Title>
                </Card.Header>
                <Card.Description>{feature.description}</Card.Description>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-24">
          <Card variant="transparent" className={`${cardClass} overflow-hidden p-0`}>
            <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:p-10">
              <div className="flex flex-col gap-4">
                <Typography type="h4" weight="normal">
                  Begin when you are ready
                </Typography>
                <Typography type="body-sm" color="muted">
                  Create an account to choose your focus areas. Pause or return whenever you like.
                </Typography>
                <div>
                  <Link
                    href="/signup"
                    className={buttonVariants({ size: 'sm', variant: 'primary' })}
                  >
                    Start your journey
                  </Link>
                </div>
              </div>
              <div className="cta-canopy">
                <Image
                  src="/begin-bokeh.jpg"
                  alt="Soft green light through leaves"
                  fill
                  sizes="(min-width: 1024px) 24vw, 80vw"
                  className="rounded-lg object-cover object-center"
                />
                <div className="cta-canopy__texture" aria-hidden />
              </div>
            </div>
          </Card>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
