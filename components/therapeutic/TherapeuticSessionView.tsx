'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import type {
  TherapeuticEngine,
  TherapeuticPhase,
  PhaseObservation,
} from '@/lib/types/therapeutic-engine';

// ---------------------------------------------------------------------------
// Phase name translation - map technical keys to client-friendly label
// ---------------------------------------------------------------------------
const PHASE_DISPLAY_NAMES: Record<string, string> = {
  conscious_regulatory_activation: 'Getting Started',
  aee_resolution: 'Finding Balance',
  universal_reverse_sequential: 'Clearing the Path',
  fd_reverse_sequential: 'Focusing In',
  current_conscious_program: 'Building New Patterns',
  universal_activation: 'Integrating Changes',
  fd_activation: 'Making It Real',
  conscious_release: 'Wrapping Up',
};

function getPhaseDisplayName(phase: { phase_key?: string; name: string }) {
  return phase.phase_key ? (PHASE_DISPLAY_NAMES[phase.phase_key] ?? phase.name) : phase.name;
}

// ---------------------------------------------------------------------------
// Phase status icon helper
// -----------------------------------------------------------------------------------
function phaseStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return '✓';
    case 'active':
      return '▶';
    case 'skipped_by_rule':
      return '—';
    case 'requires_attention':
      return '!';
    default:
      return '○';
  }
}

function phaseStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-500 dark:text-green-400';
    case 'active':
      return 'text-blue-500 dark:text-blue-400';
    case 'skipped_by_rule':
      return 'text-gray-400 dark:text-gray-500';
    case 'requires_attention':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-muted dark:text-gray-600';
  }
}

// ---------------------------------------------------------------------------
// Phase Stepper — shows all 8 phases with status indicators
// ---------------------------------------------------------------------------
interface PhaseStepperProps {
  phases: TherapeuticPhase[];
  currentOrder: number;
}

function PhaseStepper({ phases, currentOrder }: PhaseStepperProps) {
  // Label mapping for display (3A / 3B convention)
  const phaseLabels: Record<number, string> = {
    1: '1',
    2: '2',
    3: '3A',
    4: '3B',
    5: '4',
    6: '5',
    7: '6',
    8: '7',
  };

  return (
    <div className="flex flex-col gap-2">
      {phases.map((phase) => {
        const isActive = phase.status === 'active';
        const label = phaseLabels[phase.phase_order] || String(phase.phase_order);

        return (
          <div
            key={phase.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'border border-transparent hover:bg-muted/5'
            }`}
          >
            <span className={`text-base font-bold w-6 ${phaseStatusColor(phase.status)}`}>
              {phaseStatusIcon(phase.status)}
            </span>
            <span className="font-medium text-xs text-muted dark:text-gray-500 w-5">{label}</span>
            <span
              className={`flex-1 text-sm ${
                isActive
                  ? 'text-foreground font-medium dark:text-white'
                  : phase.status === 'completed'
                    ? 'text-muted dark:text-gray-400 line-through'
                    : 'text-muted dark:text-gray-500'
              }`}
            >
              {getPhaseDisplayName(phase)}
            </span>
          </div>
        );
      })}
    </div>
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

      <div className="flex gap-3 justify-end mt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors disabled:opacity-50 dark:border-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Save Reflections
        </button>
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
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [savingObservations, setSavingObservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);

  // Fetch engine state
  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/therapeutic-engine/${engineId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to load engine state');
      }
      const data = await res.json();
      const state = data.state;

      setEngine(state.engine);
      setPhases(state.allPhases);
      setCurrentPhase(state.currentPhase);
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

  // Transition to next phase
  const handleTransition = useCallback(async () => {
    setTransitioning(true);
    setError(null);

    try {
      const res = await fetch(`/api/therapeutic-engine/${engineId}/transition`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to transition phase');
      }

      const data = await res.json();
      if (data.state) {
        setEngine(data.state.engine);
        setPhases(data.state.allPhases);
        setCurrentPhase(data.state.currentPhase);
      }
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to transition:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransitioning(false);
    }
  }, [engineId]);

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

  // Pause session
  const handlePause = useCallback(async () => {
    try {
      const res = await fetch(`/api/therapeutic-engine/${engineId}/pause`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to pause session');
      }

      // Refresh state
      fetchState();
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to pause:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [engineId, fetchState]);

  // Resume session
  const handleResume = useCallback(async () => {
    try {
      const res = await fetch(`/api/therapeutic-engine/${engineId}/resume`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to resume session');
      }

      // Refresh state
      fetchState();
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to resume:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [engineId, fetchState]);

  // Complete current phase and transition
  const handleCompletePhase = useCallback(async () => {
    setTransitioning(true);
    setError(null);

    try {
      const currentOrder = currentPhase?.phase_order ?? engine?.current_phase_order;

      // Save observations if any were entered
      const res = await fetch(`/api/therapeutic-engine/${engineId}/complete-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to complete phase');
      }

      // Refresh state after completing the phase
      await fetchState();

      // Only transition if this wasn't the last phase
      // (Phase 8 completion marks the engine as 'completed', so no transition needed)
      if (currentOrder !== 8) {
        await handleTransition();
      }
    } catch (err) {
      console.error('[TherapeuticSessionView] Failed to complete phase:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransitioning(false);
    }
  }, [
    engineId,
    handleTransition,
    fetchState,
    currentPhase?.phase_order,
    engine?.current_phase_order,
  ]);

  // Check if engine is completed (all phases done)
  const isEngineCompleted = engine?.status === 'completed';
  const isEnginePaused = engine?.status === 'paused';

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted dark:text-gray-400">Loading your journey...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error && !engine) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchState}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Paused state overlay
  // ---------------------------------------------------------------------------
  if (isEnginePaused) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-4xl mb-2">⏸</div>
        <h3 className="text-lg font-medium text-foreground dark:text-white">On a Break</h3>
        <p className="text-sm text-muted dark:text-gray-400 text-center max-w-md">
          Your journey is paused. You can pick up right where you left off whenever you're ready.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleResume}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Continue Your Journey
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors dark:border-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Completed state
  // ---------------------------------------------------------------------------
  if (isEngineCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-4xl mb-2">✓</div>
        <h3 className="text-lg font-medium text-foreground dark:text-white">Journey Complete</h3>
        <p className="text-sm text-muted dark:text-gray-400 text-center max-w-md">
          You've completed all steps of this journey. Your progress has been saved.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors mt-4"
        >
          Close
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main session view
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground dark:text-white">Your Journey</h2>
          {currentPhase && (
            <p className="text-sm text-muted dark:text-gray-400">
              Step {currentPhase.phase_order}: {getPhaseDisplayName(currentPhase)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              engine?.status === 'running'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {engine?.status === 'running' ? 'In Progress' : engine?.status}
          </span>
        </div>
      </div>

      {/* Two-column layout: phase stepper + current phase content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Phase Stepper */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-medium text-muted dark:text-gray-400 mb-3">Your Progress</h3>
          <PhaseStepper phases={phases} currentOrder={engine?.current_phase_order ?? 1} />
        </div>

        {/* Right: Current Phase Content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {currentPhase ? (
            <>
              {/* Client-facing prompt */}
              <div className="rounded-xl border border-border bg-background p-6 dark:bg-navy">
                <h3 className="text-base font-medium text-foreground dark:text-white mb-3">
                  {getPhaseDisplayName(currentPhase)}
                </h3>

                {currentPhase.client_script ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {currentPhase.client_script.split('\n').map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-sm text-foreground dark:text-gray-300 leading-relaxed mb-2 last:mb-0"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted dark:text-gray-400 italic">
                    Take a moment to reflect on this step.
                  </p>
                )}
              </div>

              {/* Phase actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowObservationForm(true)}
                  disabled={savingObservations}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors disabled:opacity-50 dark:border-gray-700"
                >
                  {savingObservations ? 'Saving...' : 'Add Reflection'}
                </button>
                <button
                  onClick={handlePause}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors dark:border-gray-700"
                >
                  Take a Break
                </button>
                <button
                  onClick={handleCompletePhase}
                  disabled={transitioning}
                  className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {transitioning ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      Transitioning...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted dark:text-gray-400">
                Take your time with this step.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Observation Modal */}
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
    </div>
  );
}
