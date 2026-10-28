'use client';

import { use } from 'react';
import { ModuleEditor } from '@/components/admin/content/modules/ModuleEditor';

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  return <ModuleEditor moduleId={moduleId} />;
}
