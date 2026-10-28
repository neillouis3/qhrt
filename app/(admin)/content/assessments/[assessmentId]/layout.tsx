import { AssessmentDraftProvider } from '@/components/admin/content/assessments/AssessmentDraftProvider';

export default async function AssessmentWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <AssessmentDraftProvider assessmentId={assessmentId}>{children}</AssessmentDraftProvider>;
}
