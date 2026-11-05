import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Typography } from '@heroui/react';
import GeoAccessForm from '@/components/geo/GeoAccessForm';
import Logo from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Not available here',
  description: 'QHRT is the United States program and is not offered in any Canadian province or territory.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function UnavailablePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9" decorative />
          <Typography type="body" weight="medium">
            QHRT
          </Typography>
        </div>
        <div className="flex flex-col gap-4">
          <Typography type="h1" weight="normal">
            Not available in Canada
          </Typography>
          <Typography type="body" color="muted">
            This program is written for the United States. Federal law applies across the country.
            Privacy rules and rules for who may practice a health profession also differ by state
            and territory.
          </Typography>
          <Typography type="body" color="muted">
            It is not offered in any Canadian province or territory. Provincial privacy laws, and
            the rules for health and counseling professions, differ from one province to another
            and from US state law. This site does not follow those provincial regimes.
          </Typography>
          <Typography type="body" color="muted">
            If you are working on QHRT, enter the developer code to continue.
          </Typography>
        </div>
        <Suspense fallback={null}>
          <GeoAccessForm />
        </Suspense>
      </div>
    </div>
  );
}
