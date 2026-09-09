import type { Metadata } from 'next';
import { JourneySessionPage } from '@/components/session/SessionEntry';

export const metadata: Metadata = {
  title: 'Journey',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JourneySessionPage engineId={id} />;
}
