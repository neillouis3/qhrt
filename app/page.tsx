import Link from 'next/link';
import LandingCta from '@/components/LandingCta';

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent-lighter via-muted/5 to-white dark:from-accent-lighter/30 dark:via-navy dark:to-black">
        {/* Subtle decorative circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl dark:bg-accent/5" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent-lighter/40 blur-3xl dark:bg-accent-lighter/10" />
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-28 text-center sm:py-36 lg:py-44">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-light bg-accent-lighter/80 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur dark:border-primary/30 dark:bg-primary/10 dark:text-primary-light">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Mental health resources, on your terms
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl lg:text-6xl dark:text-white">
            Therapy that meets you
            <span className="block text-primary dark:text-primary-light">where you are</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl dark:text-muted">
            QHRT provides guided mental health resources and self-paced programs designed to support
            your well-being — accessible anytime, from anywhere.
          </p>

          <LandingCta />

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary dark:text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>Privacy compliant (PIPEDA)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary dark:text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.201 16.25c-.505-.44-.938-.95-1.287-1.518A12.318 12.318 0 013 10.875C3 6.041 6.904 2 11.75 2c3.438 0 6.426 1.87 8.018 4.598"
                />
              </svg>
              <span>Expertly curated content</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary dark:text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              <span>Free to access</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-24 sm:py-32 dark:bg-black">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl dark:text-white">
              How QHRT works
            </h2>
            <p className="mt-4 text-lg text-muted">
              Getting started is simple. Three steps to begin your journey.
            </p>
          </div>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Create your account',
                description:
                  'Sign up in minutes and complete a brief intake form so we can understand your needs.',
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Explore guided resources',
                description:
                  'Browse self-paced programs and guided sessions designed to support your mental well-being.',
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Progress at your own pace',
                description:
                  'Work through programs on your schedule. Pause, revisit, and progress at a pace that feels right.',
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-lighter text-primary dark:bg-primary/10 dark:text-primary-light">
                  {item.icon}
                </div>
                <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary dark:text-primary-light">
                  Step {item.step}
                </span>
                <h3 className="text-lg font-semibold text-navy dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why QHRT Section */}
      <section className="bg-gradient-to-b from-accent-lighter to-white py-24 sm:py-32 dark:from-navy dark:to-black">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl dark:text-white">
              Why choose QHRT
            </h2>
            <p className="mt-4 text-lg text-muted">
              We&apos;ve built a platform that puts your well-being first.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Guided programs',
                description:
                  'Structured, evidence-based programs designed to support your mental well-being.',
              },
              {
                title: 'Self-paced learning',
                description:
                  'Work through content on your own schedule. Pause, revisit, and progress at a pace that feels right.',
              },
              {
                title: 'Private & secure',
                description:
                  'Your data is protected under Canadian privacy law. Your privacy is our priority.',
              },
              {
                title: 'Accessible from anywhere',
                description:
                  'No commute, no waiting rooms. Access support from wherever feels comfortable.',
              },
              {
                title: 'Progress tracking',
                description: 'Set goals, reflect on your journey, and see how far you have come.',
              },
              {
                title: 'Free to access',
                description: 'Quality mental health resources should be accessible to everyone.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-white p-8 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 dark:border-navy dark:bg-navy/50 dark:hover:border-primary/60 dark:hover:shadow-primary/5"
              >
                <h3 className="text-base font-semibold text-navy dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-24 sm:py-32 dark:bg-primary-dark">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Take the first step today
          </h2>
          <p className="mt-4 text-lg text-accent-lighter/80">
            You don&apos;t have to do this alone. Help is just a click away.
          </p>
          <div className="mt-10">
            <Link
              href="/auth/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-white px-10 text-sm font-semibold text-primary shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-accent-lighter hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary dark:bg-accent-lighter dark:text-primary-dark dark:hover:bg-accent-light"
            >
              Start your journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-accent-lighter/30 py-12 dark:border-navy dark:bg-navy">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-navy dark:text-white">QHRT</span>
              <nav className="flex gap-6 text-sm text-muted">
                <a
                  href="#"
                  className="transition-colors hover:text-primary dark:hover:text-primary-light"
                >
                  About
                </a>
                <a
                  href="#"
                  className="transition-colors hover:text-primary dark:hover:text-primary-light"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="transition-colors hover:text-primary dark:hover:text-primary-light"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="transition-colors hover:text-primary dark:hover:text-primary-light"
                >
                  Contact
                </a>
              </nav>
            </div>
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} QHRT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
