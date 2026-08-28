import Link from 'next/link';
import LandingCta from '@/components/LandingCta';

const steps = [
  {
    step: '01',
    title: 'Create your account',
    description:
      'Sign up in minutes and complete a brief intake form so we can understand your needs.',
  },
  {
    step: '02',
    title: 'Explore guided resources',
    description:
      'Browse self-paced programs and guided sessions designed to support your mental well-being.',
  },
  {
    step: '03',
    title: 'Progress at your own pace',
    description:
      'Work through programs on your schedule. Pause, revisit, and progress at a pace that feels right.',
  },
];

const features = [
  {
    title: 'Guided programs',
    description: 'Structured, evidence-based programs designed to support your mental well-being.',
  },
  {
    title: 'Self-paced learning',
    description:
      'Work through content on your own schedule. Pause, revisit, and progress at a pace that feels right.',
  },
  {
    title: 'Private & secure',
    description: 'Your data is protected under Canadian privacy law. Your privacy is our priority.',
  },
  {
    title: 'Accessible from anywhere',
    description: 'No commute, no waiting rooms. Access support from wherever feels comfortable.',
  },
  {
    title: 'Progress tracking',
    description: 'Set goals, reflect on your journey, and see how far you have come.',
  },
  {
    title: 'Free to access',
    description: 'Quality mental health resources should be accessible to everyone.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-col px-6 lg:w-[60%] lg:max-w-none">
        <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-16">
          <p className="text-xs uppercase tracking-widest text-muted">Mental health resources</p>
          <h1 className="mt-3 max-w-xl text-3xl font-normal leading-tight tracking-tight text-foreground">
            Therapy that meets you where you are
          </h1>

          <div className="mt-8 flex flex-wrap items-start gap-x-10 gap-y-5 sm:gap-x-12">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-muted">Privacy</span>
              <span className="text-sm text-foreground">PIPEDA compliant</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-muted">Content</span>
              <span className="text-sm text-foreground">Expertly curated</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-muted">Access</span>
              <span className="text-sm text-foreground">Free to use</span>
            </div>
          </div>

          <p className="mt-10 w-[90%] text-sm leading-relaxed text-foreground">
            QHRT provides guided mental health resources and self-paced programs designed to support
            your well-being — accessible anytime, from anywhere.
          </p>

          <LandingCta />
        </section>

        <section className="flex flex-col gap-8 py-24">
          <h2 className="text-xs uppercase tracking-widest text-muted">How it works</h2>
          <ol className="flex flex-col gap-8">
            {steps.map((item) => (
              <li key={item.step} className="flex flex-col gap-1">
                <p className="text-sm text-foreground">
                  <span className="text-muted">{item.step}</span>
                  <span className="mx-2 text-muted">·</span>
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-8 py-24">
          <h2 className="text-xs uppercase tracking-widest text-muted">Why QHRT</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col py-24">
          <h2 className="text-3xl font-normal tracking-tight text-foreground">
            Take the first step today
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            You don&apos;t have to do this alone. Help is just a click away.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-normal text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Start your journey
            </Link>
          </div>
        </section>

        <footer className="border-t border-border py-12 pb-24">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <span className="text-sm tracking-tight text-foreground">QHRT</span>
              <nav className="flex gap-4 text-sm text-muted">
                <a
                  href="#"
                  className="underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  About
                </a>
                <a
                  href="#"
                  className="underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Contact
                </a>
              </nav>
            </div>
            <p className="text-xs text-muted">&copy; {new Date().getFullYear()} QHRT</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
