'use client';

import BreathingPage from '@/components/user/BreathingPage';
import GroundingPractice from '@/components/user/GroundingPractice';
import MuscleRelaxPractice from '@/components/user/MuscleRelaxPractice';
import WindSettle from '@/components/user/WindSettle';
import { practiceById, type PracticeId } from '@/lib/practices';

export default function AssessmentPracticeStep({
  practiceId,
  prompt,
  onFinished,
}: {
  practiceId: PracticeId;
  prompt?: string;
  onFinished: () => void;
}) {
  const practice = practiceById(practiceId);
  const title = prompt?.trim() || practice?.title || 'Practice';

  if (practiceId === 'breathe') return <BreathingPage embedded title={title} onFinished={onFinished} />;
  if (practiceId === 'settle') return <WindSettle onFinished={onFinished} />;
  if (practiceId === 'grounding') return <GroundingPractice onFinished={onFinished} />;
  return <MuscleRelaxPractice onFinished={onFinished} />;
}
