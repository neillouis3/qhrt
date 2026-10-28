import { redirect } from 'next/navigation';

export default async function AssessmentWizardIndex({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  redirect(`/content/assessments/${assessmentId}/details`);
}
