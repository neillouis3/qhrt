'use client';

import { Typography } from '@heroui/react';

export default function WellnessDisclaimer({ className = '' }: { className?: string }) {
  return (
    <Typography type="body-xs" color="muted" className={className}>
      Coaching and education only — not therapy, counseling, or medical care.
    </Typography>
  );
}
