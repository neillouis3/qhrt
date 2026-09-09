'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography } from '@heroui/react';
import FieldSelect from '@/components/ui/FieldSelect';
import Modal from '@/components/ui/Modal';
import AppCard from '@/components/ui/AppCard';
import UserPageShell from '@/components/layout/UserPageShell';
import { PageHeader } from '@/components/layout/UserPageShell';
import SessionRow from '@/components/session/SessionRow';
import { SessionListSkeleton } from '@/components/layout/PageSkeleton';
import { formatSectionDate, formatTime, groupByDate, statusLabel } from '@/lib/sessionUi';
import { usePinnedPractices } from '@/hooks/usePinnedPractices';
import { pinKey } from '@/lib/pinnedPractices';
import type {
  FunctionalDomainProtocol,
  ArchetypalEmotionalEnergetic,
  PersonalImplementationProgram,
} from '@/lib/types/therapeutic-engine';

interface TherapeuticEngineSession {
  id: string;
  status: string;
  current_phase_order: number;
  created_at: string;
  functional_domain_protocol_id: string | null;
  aee_id: string | null;
  personal_program_id: string | null;
}

export default function JourneysPage() {
  const router = useRouter();
  const [domainProtocols, setDomainProtocols] = useState<FunctionalDomainProtocol[]>([]);
  const [aeeEntries, setAeeEntries] = useState<ArchetypalEmotionalEnergetic[]>([]);
  const [personalPrograms, setPersonalPrograms] = useState<PersonalImplementationProgram[]>([]);
  const [engineSessions, setEngineSessions] = useState<TherapeuticEngineSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartEngineModal, setShowStartEngineModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedAeeId, setSelectedAeeId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [startingEngine, setStartingEngine] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinPendingKey, setPinPendingKey] = useState<string | null>(null);
  const { syncPins, isPinned, togglePin } = usePinnedPractices();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [domainsRes, aeeRes, programsRes, enginesRes, pinsRes] = await Promise.all([
        fetch('/api/therapeutic-engine/domains'),
        fetch('/api/therapeutic-engine/aee'),
        fetch('/api/therapeutic-engine/personal-programs'),
        fetch('/api/therapeutic-engine/user-sessions'),
        fetch('/api/user/pins'),
      ]);

      if (pinsRes.ok) {
        const pinsData = await pinsRes.json();
        if (Array.isArray(pinsData.pins)) syncPins(pinsData.pins);
      }

      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomainProtocols(domainsData.functional_domain_protocols ?? []);
      }
      if (aeeRes.ok) {
        const aeeData = await aeeRes.json();
        setAeeEntries(aeeData.aee_entries ?? []);
      }
      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPersonalPrograms(programsData.personal_programs ?? []);
      }
      if (enginesRes.ok) {
        const enginesData = await enginesRes.json();
        setEngineSessions(enginesData.therapeutic_engines ?? []);
      }
    } catch (err) {
      console.error('[Journeys] Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [syncPins]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePin = async (engine: TherapeuticEngineSession, title: string) => {
    const key = pinKey('journey', engine.id);
    setPinPendingKey(key);
    try {
      await togglePin({
        kind: 'journey',
        id: engine.id,
        title,
        href: `/journeys/${engine.id}`,
      });
    } catch (err) {
      console.error('[Journeys] Pin failed:', err);
    } finally {
      setPinPendingKey(null);
    }
  };

  const filteredPrograms = useMemo(
    () =>
      personalPrograms.filter(
        (p) => !selectedDomainId || p.functional_domain_id === selectedDomainId
      ),
    [personalPrograms, selectedDomainId]
  );

  const handleStartEngine = async () => {
    setStartingEngine(true);
    setError(null);

    try {
      const res = await fetch('/api/therapeutic-engine/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functional_domain_protocol_id: selectedDomainId,
          aee_id: selectedAeeId || undefined,
          personal_program_id: selectedProgramId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to start journey');
      }

      const data = await res.json();
      setShowStartEngineModal(false);
      setSelectedDomainId('');
      setSelectedAeeId('');
      setSelectedProgramId('');
      router.push(`/journeys/${data.engine_id}`);
    } catch (err) {
      console.error('[Journeys] Failed to start engine:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setStartingEngine(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/therapeutic-engine/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not delete journey');
      }
      setEngineSessions((current) => current.filter((engine) => engine.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete journey');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <SessionListSkeleton />;
  }

  return (
    <UserPageShell>
      <PageHeader
        title="Journeys"
        subtitle="A path of sessions around one thing you're working on."
        actions={
          engineSessions.length > 0 && domainProtocols.length > 0 ? (
            <Button size="sm" variant="primary" onPress={() => setShowStartEngineModal(true)}>
              Start a journey
            </Button>
          ) : null
        }
      />

      {error && (
        <Typography type="body-sm" className="text-danger">
          {error}
        </Typography>
      )}

      {engineSessions.length === 0 ? (
        <AppCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <AppCard.Title className="font-normal tracking-tight">
                {domainProtocols.length > 0 ? 'Start a journey' : 'Journeys will be here soon'}
              </AppCard.Title>
              <AppCard.Description>
                {domainProtocols.length > 0
                  ? 'Pick one thing to work on. We will walk you through it, one step at a time.'
                  : 'New paths will show up here when they are ready.'}
              </AppCard.Description>
            </div>
            {domainProtocols.length > 0 ? (
              <Button
                size="sm"
                variant="primary"
                className="shrink-0"
                onPress={() => setShowStartEngineModal(true)}
              >
                Begin
              </Button>
            ) : null}
          </div>
        </AppCard>
      ) : (
        <div className="flex flex-col gap-8">
          {groupByDate(engineSessions, (engine) => engine.created_at).map(({ key, items }) => (
            <section key={key} className="flex flex-col gap-3">
              <Typography type="body">{formatSectionDate(key)}</Typography>
              {items.map((engine) => {
                const domainName =
                  domainProtocols.find((d) => d.id === engine.functional_domain_protocol_id)
                    ?.name || 'Unknown domain';
                const title = `${domainName} — Phase ${engine.current_phase_order}`;
                return (
                  <SessionRow
                    key={engine.id}
                    title={title}
                    time={formatTime(engine.created_at)}
                    status={statusLabel(engine.status)}
                    actionLabel={
                      engine.status === 'completed'
                        ? 'View'
                        : engine.status === 'paused'
                          ? 'Resume'
                          : 'Continue'
                    }
                    actionVariant={engine.status === 'completed' ? 'outline' : 'primary'}
                    onAction={() => router.push(`/journeys/${engine.id}`)}
                    pinned={isPinned('journey', engine.id)}
                    pinPending={pinPendingKey === pinKey('journey', engine.id)}
                    onTogglePin={() => void handleTogglePin(engine, title)}
                    onDelete={() => void handleDelete(engine.id)}
                    deleting={deletingId === engine.id}
                    deleteLabel="Delete journey"
                  />
                );
              })}
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={showStartEngineModal}
        onClose={() => !startingEngine && setShowStartEngineModal(false)}
        title="Start a journey"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Typography type="body-sm" color="muted">
            Choose what you would like to focus on. You can pause and return later.
          </Typography>
          <FieldSelect
            label="What would you like to focus on?"
            placeholder="Choose your focus area"
            selectedKey={selectedDomainId}
            onChange={(key) => {
              setSelectedDomainId(key);
              setSelectedProgramId('');
            }}
            items={domainProtocols.map((domain) => ({ id: domain.id, name: domain.name }))}
          />
          <FieldSelect
            label="How are you feeling?"
            placeholder="Choose what resonates"
            selectedKey={selectedAeeId}
            onChange={setSelectedAeeId}
            items={aeeEntries.map((aee) => ({ id: aee.id, name: aee.name }))}
          />
          <FieldSelect
            label="Your plan"
            placeholder="Choose a plan"
            selectedKey={selectedProgramId}
            onChange={setSelectedProgramId}
            isDisabled={!selectedDomainId || filteredPrograms.length === 0}
            items={filteredPrograms.map((program) => ({ id: program.id, name: program.name }))}
          />
          {!selectedDomainId ? (
            <Typography type="body-xs" color="muted">
              Choose a focus area first to see available plans.
            </Typography>
          ) : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={startingEngine}
              onPress={() => setShowStartEngineModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isPending={startingEngine}
              isDisabled={startingEngine || !selectedDomainId}
              onPress={handleStartEngine}
            >
              Begin
            </Button>
          </div>
        </div>
      </Modal>
    </UserPageShell>
  );
}
