import type { Metadata } from 'next';
import PublicPage from '@/components/layout/PublicPage';
import FaqPage from '@/components/marketing/FaqPage';

export const metadata: Metadata = {
  title: 'FAQ',
};

export default function FaqRoute() {
  return (
    <PublicPage title="FAQ" intro="Common questions about QHRT. If yours is not here, send it at the bottom.">
      <FaqPage />
    </PublicPage>
  );
}
