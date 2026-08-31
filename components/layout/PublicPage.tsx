import { Typography } from '@heroui/react';
import SiteFooter from '@/components/layout/SiteFooter';

export default function PublicPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <div className="flex w-full max-w-3xl flex-col px-6 lg:w-[60%] lg:max-w-none">
        <section className="flex flex-col gap-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="flex max-w-xl flex-col gap-4">
            <Typography type="h1" weight="normal">
              {title}
            </Typography>
            {intro ? (
              <Typography type="body" color="muted">
                {intro}
              </Typography>
            ) : null}
          </div>
        </section>
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
