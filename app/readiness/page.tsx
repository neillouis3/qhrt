import type { Metadata } from 'next';
import ReadinessCheck from '@/components/readiness/ReadinessCheck';

export const metadata: Metadata = {
  title: 'Program readiness',
  description: 'A short check to see whether self-directed QHRT feels appropriate for you right now.',
  robots: { index: false, follow: false },
};

export default function ReadinessPage() {
  return <ReadinessCheck />;
}
