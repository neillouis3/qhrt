import type { SessionRecapData, SessionRecapEntry } from '@/lib/types/conversation';
import type { PhaseObservation, TherapeuticPhase } from '@/lib/types/therapeutic-engine';

const OBSERVATION_LABELS: Array<{
  key: keyof Pick<
    PhaseObservation,
    | 'client_reflection'
    | 'immediate_expression_change'
    | 'implementation_status'
    | 'remaining_organizational_uncertainty'
    | 'domain_specific_observations'
  >;
  label: string;
}> = [
  { key: 'client_reflection', label: 'Your reflection' },
  { key: 'immediate_expression_change', label: 'What shifted' },
  { key: 'implementation_status', label: 'Implementation' },
  { key: 'remaining_organizational_uncertainty', label: 'What still feels unclear' },
  { key: 'domain_specific_observations', label: 'Notes' },
];

function phaseLabel(phases: TherapeuticPhase[], phaseOrder: number): string {
  const phase = phases.find((item) => item.phase_order === phaseOrder);
  return phase?.name ?? `Step ${phaseOrder}`;
}

export function buildJourneyRecap(
  phases: TherapeuticPhase[],
  observations: PhaseObservation[]
): SessionRecapData {
  const entries: SessionRecapEntry[] = [];
  const sorted = [...observations].sort((a, b) => a.phase_order - b.phase_order);

  for (const observation of sorted) {
    const step = phaseLabel(phases, observation.phase_order);
    for (const field of OBSERVATION_LABELS) {
      const answer = observation[field.key]?.trim();
      if (!answer) continue;
      entries.push({
        id: `${observation.id}-${field.key}`,
        prompt: `${step} — ${field.label}`,
        answer,
      });
    }
  }

  return { entries };
}
