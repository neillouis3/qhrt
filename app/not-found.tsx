import { Typography } from '@heroui/react';
import Logo from '@/components/ui/Logo';
import { NotFoundCta } from '@/components/marketing/MarketingCtas';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24 lg:w-[60%] lg:max-w-none">
        <div className="flex max-w-xl flex-col gap-8">
          <Logo decorative className="h-14 w-14" />

          <div className="flex flex-col gap-4">
            <Typography type="body-xs" color="muted">
              404
            </Typography>
            <Typography type="h1" weight="normal">
              Page not found
            </Typography>
            <Typography type="body" color="muted">
              This page isn&apos;t here. Check the address, or continue from the home page.
            </Typography>
          </div>

          <NotFoundCta />
        </div>
      </div>
    </div>
  );
}
