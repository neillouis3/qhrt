'use client';

import { useRouter } from 'next/navigation';
import ConversationView from '@/components/conversation/ConversationView';
import TherapeuticSessionView from '@/components/therapeutic/TherapeuticSessionView';

export function ConversationSessionPage({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  return <ConversationView conversationId={conversationId} onClose={() => router.push('/sessions')} />;
}

export function JourneySessionPage({ engineId }: { engineId: string }) {
  const router = useRouter();
  const goBack = () => router.push('/journeys');
  return <TherapeuticSessionView engineId={engineId} onClose={goBack} onComplete={goBack} />;
}
