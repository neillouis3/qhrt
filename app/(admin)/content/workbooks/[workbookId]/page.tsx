'use client';

import { use } from 'react';
import { WorkbookEditor } from '@/components/admin/content/assessments/WorkbookEditor';

export default function WorkbookPage({ params }: { params: Promise<{ workbookId: string }> }) {
  const { workbookId } = use(params);
  return <WorkbookEditor workbookId={workbookId} />;
}
