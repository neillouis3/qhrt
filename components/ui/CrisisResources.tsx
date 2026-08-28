'use client';

import Link from 'next/link';
import { Typography } from '@heroui/react';
import { useLocale } from '@/context/LocaleContext';

type CrisisResourcesProps = {
  /** Tighter copy for Home; full list on Help. */
  variant?: 'compact' | 'full';
};

export default function CrisisResources({ variant = 'full' }: CrisisResourcesProps) {
  const { t } = useLocale();

  if (variant === 'compact') {
    return (
      <Typography type="body-xs" color="muted">
        {t('crisis.compactStart')}
        <Link href="tel:988" className="text-brand underline-offset-2 hover:underline">
          988
        </Link>
        {t('crisis.compactMiddle')}
        <Link href="tel:911" className="text-brand underline-offset-2 hover:underline">
          911
        </Link>
        {t('crisis.compactEnd')}
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography type="body-sm" color="muted">
        {t('crisis.intro')}
      </Typography>
      <ul className="flex flex-col gap-3">
        <li className="flex flex-col gap-0.5">
          <Link
            href="tel:988"
            className="text-sm text-brand underline-offset-2 hover:underline"
          >
            {t('crisis.line988')}
          </Link>
          <Typography type="body-xs" color="muted">
            {t('crisis.line988Detail')}
          </Typography>
        </li>
        <li className="flex flex-col gap-0.5">
          <Typography type="body-sm">{t('crisis.emergency')}</Typography>
          <Typography type="body-xs" color="muted">
            {t('crisis.emergencyDetail')}
          </Typography>
        </li>
      </ul>
    </div>
  );
}
