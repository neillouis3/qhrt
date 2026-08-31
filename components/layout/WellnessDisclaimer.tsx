'use client';

import { Typography } from '@heroui/react';
import { COACHING_DISCLAIMER_COMPACT } from '@/lib/wellnessCopy';

export default function WellnessDisclaimer({ className = '' }: { className?: string }) {
  return (
    <Typography type="body-xs" color="muted" className={className}>
      {COACHING_DISCLAIMER_COMPACT}
    </Typography>
  );
}
