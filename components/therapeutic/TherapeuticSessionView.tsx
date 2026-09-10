'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Button, Typography, buttonVariants } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import { FocusContentSkeleton } from '@/components/layout/PageSkeleton';
import ProgressNav, { type ProgressStepStatus } from '@/components/session/ProgressNav';
import type {
  EngineSessionState,
  TherapeuticEngine,
  TherapeuticPhase,
} from '@/lib/types/therapeutic-engine';
import { SessionOverview, SessionRecapFooter } from '@/components/session/SessionRecap';
import { buildJourneyRecap } from '@/lib/journeyRecap';
import type { PhaseObservation } from '@/lib/types/therapeutic-engine';

function phaseStepStatus(status: string): ProgressStepStatus {
  if (status === 'completed') return 'complete';
  if (status === 'active') return 'current';
  if (status === 'skipped_by_rule') return 'skipped';
  if (status === 'requires_attention') return 'attention';
  return 'upcoming';
}

const PHASE_INDEX: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3A',
  4: '3B',
  5: '4',
  6: '5',
  7: '6',
  8: '7',
};

function JourneyProgress({ phases }: { phases: TherapeuticPhase[] }) {
  return (
    <ProgressNav
      items={phases.map((phase) => ({
        id: phase.id,
        index: PHASE_INDEX[phase.phase_order] || String(phase.phase_order),
        label: phase.name,
        status: phaseStepStatus(phase.status),
      }))}
    />
  );
}

// ---------------------------------------------------------------------------
// Observation Form — structured observation capture per phase
// ---------------------------------------------------------------------------
interface ObservationFormProps {
  onSave: (observations: {
    immediate_expression_change?: string;
    implementation_status?: string;
    remaining_organizational_uncertainty?: string;
    another_cycle_required?: boolean;
    domain_specific_observations?: string;
    client_reflection?: string;
  }) => void;
  onCancel: () => void;
}

function ObservationForm({ onSave, onCancel }: ObservationFormProps) {
  const [immediateExpressionChange, setImmediateExpressionChange] = useState('');
  const [implementationStatus, setImplementationStatus] = useState('');
  const [remainingUncertainty, setRemainingUncertainty] = useState('');
  const [anotherCycleRequired, setAnotherCycleRequired] = useState(false);
  const [domainSpecificObservations, setDomainSpecificObservations] = useState('');
  const [clientReflection, setClientReflection] = useState('');

  const handleSave = () => {
    onSave({
      immediate_expression_change: immediateExpressionChange || undefined,
      implementation_status: implementationStatus || undefined,
      remaining_organizational_uncertainty: remainingUncertainty || undefined,
      another_cycle_required: anotherCycleRequired,
      domain_specific_observations: domainSpecificObservations || undefined,
      client_reflection: clientReflection || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium text-foreground dark:text-white">How's It Going?</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted dark:text-gray-400">
          What have you noticed since last time?
        </label>
        <textarea
          value={immediateExpressionChange}
          onChange={(e) => setImmediateExpressionChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Any changes, big or small..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted dark:text-gray-400">
          How are things going overall?
        </label>
        <textarea
          value={implementationStatus}
          onChange={(e) => setImplementationStatus(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Share how you're feeling about your progress..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted dark:text-gray-400">
          Anything still feeling uncertain?
        </label>
        <textarea
          value={remainingUncertainty}
          onChange={(e) => setRemainingUncertainty(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Questions or things you'd like to explore more..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="anotherCycleRequired"
          checked={anotherCycleRequired}
          onChange={(e) => setAnotherCycleRequired(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary/50"
        />
        <label
          htmlFor="anotherCycleRequired"
          className="text-sm font-medium text-muted dark:text-gray-400"
        >
          I'd like to go through this again
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted dark:text-gray-400">
          Anything specific about your focus area?
        </label>
        <textarea
          value={domainSpecificObservations}
          onChange={(e) => setDomainSpecificObservations(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Thoughts about what you're working on..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted dark:text-gray-400">
          How are you feeling?
        </label>
        <textarea
          value={clientReflection}
          onChange={(e) => setClientReflection(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Share whatever is on your mind..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" variant="tertiary" onPress={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onPress={handleSave}>
          Save Reflections
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TherapeuticSessionView Component
// ---------------------------------------------------------------------------
interface TherapeuticSessionViewProps {
  engineId: string;
  onClose?: () => void;
  onComplete?: () => void;
}

export default function TherapeuticSessionView({
  engineId,
  onClose,
  onComplete,
}: TherapeuticSessionViewProps) {
  // State
  const [engine, setEngine] = useState<TherapeuticEngine | null>(null);
  const [phases, setPhases] = useState<TherapeuticPhase[]>([]);
  const [currentPhase, setCurrentPhase] = useState<TherapeuticPhase | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [domainDescription, setDomainDescription] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [savingObservations, setSavingObservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observations, setObservations] = useState<PhaseObservation[]>([]);
  const hasLoadedRef = useRef(false);

  const applyEngineState = (state: EngineSessionState) => {
    setEngine(state.engine);
    setPhases(state.allPhases);
    setCurrentPhase(state.currentPhase);
    setObservations(state.observations ?? []);
    setDomainName(state.functionalDomain?.name ?? null);
    setDomainDescription(state.functionalDomain?.description ?? null);
    const alreadyStarted =
      state.engine.status === 'running' ||
      state.engine.status === 'paused' ||
      state.engine.status === 'completed' ||
      state.allPhases.some((phase) => phase.status === 'completed');
    if (alreadyStarted) setShowOverview(false);
  };

  // Fetch engine state
  const fetchState = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);

      const res = await fetch(`/api/therapeutic-engine/${engineId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to load engine state');
      }
      const data = await res.json();
      const state = data.state as EngineSessionState;
      applyEngineState(state);
      hasLoadedRef.current = true;

      if (state.engine.status === 'paused') {
        await fetch(`/api/therapeutic-engine/${engineId}/resume`, { method: 'POST' });
        setEngine({ ...state.engine, status: 'running' });
      }
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to fetch state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [engineId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Save observations
  const handleSaveObservations = useCallback(
    async (observations: Record<string, any>) => {
      setSavingObservations(true);
      setError(null);

      try {
        const res = await fetch(`/api/therapeutic-engine/${engineId}/observations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase_order: currentPhase?.phase_order ?? engine?.current_phase_order,
            ...observations,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Failed to save observations');
        }
      } catch (err) {
        console.error('[TherapeuticSessionView] Failed to save observations:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSavingObservations(false);
        setShowObservationForm(false);
      }
    },
    [engineId, currentPhase, engine?.current_phase_order]
  );

  // Pause session and leave, same as assessments.
  const handlePause = useCallback(async () => {
    try {
      const res = await fetch(`/api/therapeutic-engine/${engineId}/pause`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to pause session');
      }

      onClose?.();
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to pause:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [engineId, onClose]);

  const handleGoBack = useCallback(async () => {
    const order = currentPhase?.phase_order ?? engine?.current_phase_order ?? 1;
    if (order <= 1) {
      setShowOverview(true);
      return;
    }

    setTransitioning(true);
    setError(null);

    try {
      const res = await fetch(`/api/therapeutic-engine/${engineId}/back`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to go back');
      }

      const data = await res.json();
      if (data.state) applyEngineState(data.state);
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to go back:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransitioning(false);
    }
  }, [engineId, currentPhase?.phase_order, engine?.current_phase_order]);

  const handleCompletePhase = useCallback(async () => {
    setTransitioning(true);
    setError(null);

    try {
      const currentOrder = currentPhase?.phase_order ?? engine?.current_phase_order;

      const res = await fetch(`/api/therapeutic-engine/${engineId}/complete-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to complete phase');
      }

      if (currentOrder === 8) {
        await fetchState();
        return;
      }

      const next = await fetch(`/api/therapeutic-engine/${engineId}/transition`, {
        method: 'POST',
      });

      if (!next.ok) {
        const err = await next.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to continue');
      }

      const data = await next.json();
      if (data.state) applyEngineState(data.state);
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to complete phase:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransitioning(false);
    }
  }, [engineId, fetchState, currentPhase?.phase_order, engine?.current_phase_order]);

  const displayPhase =
    currentPhase ??
    phases.find((phase) => phase.phase_order === engine?.current_phase_order) ??
    null;
  const phaseBody =
    displayPhase?.client_script?.trim() || displayPhase?.description?.trim() || '';

  const isEngineCompleted = engine?.status === 'completed';

  const journeyRecap = useMemo(
    () => buildJourneyRecap(phases, observations),
    [phases, observations]
  );
  const progress = <JourneyProgress phases={phases} />;
  const overviewTitle = domainName ?? 'Journey';

  if (loading) {
    return (
      <FocusSessionLayout progress={progress}>
        <FocusContentSkeleton />
      </FocusSessionLayout>
    );
  }

  if (error && !engine) {
    return (
      <FocusSessionLayout progress={progress}>
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
        <div>
          <Button size="sm" variant="primary" onPress={fetchState}>
            Retry
          </Button>
        </div>
      </FocusSessionLayout>
    );
  }

  if (isEngineCompleted) {
    const recapTitle = domainName?.trim() || 'Your journey';
    return (
      <FocusSessionLayout
        progress={progress}
        title={recapTitle}
        subtitle="That's it. Here's what you went through."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/home" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
              Home
            </Link>
            {onClose ? (
              <Button size="sm" variant="outline" onPress={onClose}>
                Journeys
              </Button>
            ) : (
              <Link href="/journeys" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                Journeys
              </Link>
            )}
          </div>
        }
      >
        <SessionRecapFooter
          sessionTitle={recapTitle}
          recap={journeyRecap}
          sourceKind="journey"
          sourceId={engineId}
          readOnlyNote="Read-only recap of your journey notes and reflections."
        />
      </FocusSessionLayout>
    );
  }

  if (showOverview) {
    return (
      <FocusSessionLayout
        progress={progress}
        title={overviewTitle}
        subtitle={domainDescription ?? undefined}
        actions={
          <>
            {onClose ? (
              <Button size="sm" variant="outline" onPress={onClose}>
                Take a break
              </Button>
            ) : null}
            <Button size="sm" variant="primary" onPress={() => setShowOverview(false)}>
              Begin
            </Button>
          </>
        }
      >
        <SessionOverview
          steps={phases.map((phase) => ({
            id: phase.id,
            index: PHASE_INDEX[phase.phase_order] || String(phase.phase_order),
            label: phase.name,
            description: phase.description,
          }))}
        />
      </FocusSessionLayout>
    );
  }

  return (
    <FocusSessionLayout
      progress={progress}
      leadingActions={
        displayPhase ? (
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={transitioning}
            onPress={handleGoBack}
          >
            Back
          </Button>
        ) : undefined
      }
      actions={
        displayPhase ? (
          <>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={savingObservations}
              onPress={() => setShowObservationForm(true)}
            >
              {savingObservations ? 'Saving...' : 'Add reflection'}
            </Button>
            <Button size="sm" variant="outline" onPress={handlePause}>
              Take a break
            </Button>
            <Button
              size="sm"
              variant="primary"
              isPending={transitioning}
              isDisabled={transitioning}
              onPress={handleCompletePhase}
            >
              Continue
            </Button>
          </>
        ) : undefined
      }
    >
      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      ) : null}

      {phaseBody ? (
        <div className="flex flex-col gap-3">
          {phaseBody.split('\n').map((paragraph, i) =>
            paragraph.trim() ? (
              <Typography key={i} type="body">
                {paragraph}
              </Typography>
            ) : null
          )}
        </div>
      ) : displayPhase ? (
        <Typography type="body">{displayPhase.name}</Typography>
      ) : null}

      <Modal
        isOpen={showObservationForm}
        onClose={() => setShowObservationForm(false)}
        title="Your Reflections"
        size="lg"
      >
        <ObservationForm
          onSave={handleSaveObservations}
          onCancel={() => setShowObservationForm(false)}
        />
      </Modal>
    </FocusSessionLayout>
  );
}
