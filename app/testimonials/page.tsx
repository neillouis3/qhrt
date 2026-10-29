import type { Metadata } from 'next';
import PublicPage from '@/components/layout/PublicPage';
import TestimonialsPage from '@/components/marketing/TestimonialsPage';

export const metadata: Metadata = {
  title: 'Testimonials',
};

export default function TestimonialsRoute() {
  return (
    <PublicPage
      title="Testimonials"
      intro="If QHRT has been useful, leave a short note. Others starting out can read it here."
    >
      <TestimonialsPage />
    </PublicPage>
  );
}
