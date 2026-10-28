'use client';

import { use } from 'react';
import { LessonEditor } from '@/components/admin/content/modules/LessonEditor';

export default function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  const { moduleId, lessonId } = use(params);
  return <LessonEditor moduleId={moduleId} lessonId={lessonId} />;
}
