import type { Metadata } from 'next';
import AssessmentRunner from '@/components/user/AssessmentRunner';

export const metadata: Metadata = {
  title: 'Assessment',
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;
  return <AssessmentRunner key={slug} slug={slug} showResult={view === 'result'} />;
}
