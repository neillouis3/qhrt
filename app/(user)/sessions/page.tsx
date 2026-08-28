'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/Modal';
import ConversationView from '@/components/conversation/ConversationView';
import TherapeuticSessionView from '@/components/therapeutic/TherapeuticSessionView';
import type { KnowledgeModel } from '@/lib/types/conversation';
import type {
  FunctionalDomainProtocol,
  ArchetypalEmotionalEnergetic,
  PersonalImplementationProgram,
} from '@/lib/types/therapeutic-engine';

// ---------------------------------------------------------------------------
// Types (join/projection shapes not covered by the shared entity types)
// ---------------------------------------------------------------------------

interface UserConversation {
  id: string;
  knowledge_model_id: string;
  knowledge_model_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
}

interface TherapeuticEngineSession {
  id: string;
  status: string;
  current_phase_order: number;
  created_at: string;
  functional_domain_protocol_id: string | null;
  aee_id: string | null;
  personal_program_id: string | null;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function Sessions() {
  const [knowledgeModels, setKnowledgeModels] = useState<KnowledgeModel[]>([]);
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Therapeutic engine state
  const [domainProtocols, setDomainProtocols] = useState<FunctionalDomainProtocol[]>([]);
  const [aeeEntries, setAeeEntries] = useState<ArchetypalEmotionalEnergetic[]>([]);
  const [personalPrograms, setPersonalPrograms] = useState<PersonalImplementationProgram[]>([]);
  const [engineSessions, setEngineSessions] = useState<TherapeuticEngineSession[]>([]);

  // Modal state — conversations
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [startingModelId, setStartingModelId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Modal state — therapeutic engines
  const [activeEngineId, setActiveEngineId] = useState<string | null>(null);
  const [showStartEngineModal, setShowStartEngineModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedAeeId, setSelectedAeeId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [startingEngine, setStartingEngine] = useState(false);

  // Fetch available Knowledge Models and existing conversations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [modelsRes, convsRes, domainsRes, aeeRes, programsRes, enginesRes] = await Promise.all([
        fetch('/api/conversation/models'),
        fetch('/api/conversation/sessions'),
        fetch('/api/therapeutic-engine/domains'),
        fetch('/api/therapeutic-engine/aee'),
        fetch('/api/therapeutic-engine/personal-programs'),
        fetch('/api/therapeutic-engine/user-sessions'),
      ]);

      // Models and conversations — expected to work
      if (!modelsRes.ok || !convsRes.ok) {
        throw new Error('Failed to load session data');
      }

      const modelsData = await modelsRes.json();
      const convsData = await convsRes.json();

      setKnowledgeModels(modelsData.knowledge_models ?? []);
      setConversations(convsData.conversations ?? []);

      // Therapeutic engine data — gracefully handle if not yet deployed
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
      console.error('[Sessions] Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start a new conversation
  const handleStartConversation = async (modelId: string) => {
    setStarting(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversation/start/${modelId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to start conversation');
      }

      const data = await res.json();
      setStartingModelId(null);
      setActiveConversationId(data.conversation_id);

      // Refresh conversations list
      fetchData();
    } catch (err) {
      console.error('[Sessions] Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStartingModelId(null);
    } finally {
      setStarting(false);
    }
  };

  // Resume an existing conversation
  const handleResumeConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  // Close modal and refresh
  const handleCloseModal = () => {
    setActiveConversationId(null);
    fetchData();
  };

  // Start a new therapeutic engine session
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
        throw new Error(err.error ?? 'Failed to start therapeutic engine');
      }

      const data = await res.json();
      setShowStartEngineModal(false);
      setActiveEngineId(data.engine_id);
      setSelectedDomainId('');
      setSelectedAeeId('');
      setSelectedProgramId('');

      // Refresh sessions list
      fetchData();
    } catch (err) {
      console.error('[Sessions] Failed to start engine:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setStartingEngine(false);
    }
  };

  // Resume an existing therapeutic engine session
  const handleResumeEngine = (engineId: string) => {
    setActiveEngineId(engineId);
  };

  // Close engine modal and refresh
  const handleCloseEngineModal = () => {
    setActiveEngineId(null);
    fetchData();
  };

  // Filter personal programs by selected domain
  const filteredPrograms = useMemo(
    () =>
      personalPrograms.filter(
        (p) => !selectedDomainId || p.functional_domain_id === selectedDomainId
      ),
    [personalPrograms, selectedDomainId]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col flex-1 p-8">
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted dark:text-gray-400">Loading sessions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-8">
      <main className="flex flex-1 flex-col gap-8">
        <h1 className="text-2xl font-semibold text-foreground dark:text-white">Sessions</h1>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Available Knowledge Models */}
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 dark:text-white">
            Available Assessments
          </h2>

          {knowledgeModels.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
              <p className="text-muted dark:text-gray-400">No assessments available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setStartingModelId(model.id)}
                  disabled={starting}
                  className="flex flex-col items-start text-left rounded-xl border border-border bg-background p-5 dark:bg-navy hover:border-primary/30 transition-colors disabled:opacity-50"
                >
                  <h3 className="font-medium text-foreground dark:text-white mb-1">{model.name}</h3>
                  {model.description && (
                    <p className="text-sm text-muted dark:text-gray-400 line-clamp-2">
                      {model.description}
                    </p>
                  )}
                  <span className="mt-3 text-xs text-muted dark:text-gray-500">
                    v{model.version}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Conversation History */}
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 dark:text-white">
            Your Conversations
          </h2>

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
              <p className="text-muted dark:text-gray-400">
                You haven&apos;t started any conversations yet.
              </p>
              <p className="text-sm text-muted dark:text-gray-500 mt-1">
                Select an assessment above to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:bg-navy"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-foreground dark:text-white">
                      {conv.knowledge_model_name}
                    </span>
                    <span className="text-xs text-muted dark:text-gray-400">
                      Started {new Date(conv.started_at).toLocaleDateString()} at{' '}
                      {new Date(conv.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status badge */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conv.status === 'completed'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : conv.status === 'active'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {conv.status === 'completed'
                        ? 'Completed'
                        : conv.status === 'active'
                          ? 'In Progress'
                          : 'Paused'}
                    </span>

                    {/* Resume button for non-completed conversations */}
                    {conv.status !== 'completed' && (
                      <button
                        onClick={() => handleResumeConversation(conv.id)}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
                      >
                        Resume
                      </button>
                    )}

                    {/* View button for completed conversations */}
                    {conv.status === 'completed' && (
                      <button
                        onClick={() => handleResumeConversation(conv.id)}
                        className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-muted/5 transition-colors dark:border-gray-700 dark:hover:bg-navy-light/10"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Therapeutic Engine Sessions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground dark:text-white">
              My Wellness Journeys
            </h2>
            {domainProtocols.length > 0 && (
              <button
                onClick={() => setShowStartEngineModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Start a New Journey
              </button>
            )}
          </div>

          {engineSessions.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
              <p className="text-muted dark:text-gray-400">No wellness journeys yet.</p>
              {domainProtocols.length > 0 ? (
                <p className="text-sm text-muted dark:text-gray-500 mt-1">
                  Click &quot;Start a New Journey&quot; above to begin.
                </p>
              ) : (
                <p className="text-sm text-muted dark:text-gray-500 mt-1">
                  New journeys will be available soon.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {engineSessions.map((engine) => {
                const domainName =
                  domainProtocols.find((d) => d.id === engine.functional_domain_protocol_id)
                    ?.name || 'Unknown Domain';

                return (
                  <div
                    key={engine.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:bg-navy"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm text-foreground dark:text-white">
                        {domainName} — Phase {engine.current_phase_order}
                      </span>
                      <span className="text-xs text-muted dark:text-gray-400">
                        Started {new Date(engine.created_at).toLocaleDateString()} at{' '}
                        {new Date(engine.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          engine.status === 'completed'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : engine.status === 'running'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {engine.status === 'completed'
                          ? 'Completed'
                          : engine.status === 'running'
                            ? 'In Progress'
                            : engine.status === 'paused'
                              ? 'Paused'
                              : engine.status}
                      </span>

                      {/* Resume/Continue button for non-completed engines */}
                      {engine.status !== 'completed' && (
                        <button
                          onClick={() => handleResumeEngine(engine.id)}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors"
                        >
                          {engine.status === 'paused' ? 'Resume' : 'Continue'}
                        </button>
                      )}

                      {/* View button for completed engines */}
                      {engine.status === 'completed' && (
                        <button
                          onClick={() => handleResumeEngine(engine.id)}
                          className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-muted/5 transition-colors dark:border-gray-700 dark:hover:bg-navy-light/10"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal for starting new conversation */}
      <Modal
        isOpen={startingModelId !== null}
        onClose={() => !starting && setStartingModelId(null)}
        title="Start Assessment"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted dark:text-gray-400">
            Are you sure you want to start a new assessment? You can pause and resume at any time.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStartingModelId(null)}
              disabled={starting}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors disabled:opacity-50 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => startingModelId && handleStartConversation(startingModelId)}
              disabled={starting}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Starting...
                </span>
              ) : (
                'Start'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Conversation Modal */}
      <Modal
        isOpen={activeConversationId !== null}
        onClose={handleCloseModal}
        title="Assessment"
        size="xl"
      >
        {activeConversationId && (
          <ConversationView
            conversationId={activeConversationId}
            onClose={handleCloseModal}
            onComplete={handleCloseModal}
          />
        )}
      </Modal>

      {/* Start Therapeutic Engine Modal */}
      <Modal
        isOpen={showStartEngineModal}
        onClose={() => !startingEngine && setShowStartEngineModal(false)}
        title="Start Your Journey"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted dark:text-gray-400">
            Choose what you&apos;d like to focus on and we&apos;ll guide you through the process.
          </p>

          {/* Functional Domain Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted dark:text-gray-400">
              What would you like to focus on? <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => {
                setSelectedDomainId(e.target.value);
                setSelectedProgramId(''); // Reset program when domain changes
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Choose your focus area...</option>
              {domainProtocols.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          {/* AEE Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted dark:text-gray-400">
              How are you feeling? (Optional)
            </label>
            <select
              value={selectedAeeId}
              onChange={(e) => setSelectedAeeId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Choose what resonates...</option>
              {aeeEntries.map((aee) => (
                <option key={aee.id} value={aee.id}>
                  {aee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Personal Program Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted dark:text-gray-400">
              Your Plan (Optional)
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              disabled={!selectedDomainId || filteredPrograms.length === 0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground dark:bg-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              <option value="">Choose a plan...</option>
              {filteredPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {!selectedDomainId && (
              <p className="text-xs text-muted dark:text-gray-500">
                Choose a focus area first to see available plans.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => setShowStartEngineModal(false)}
              disabled={startingEngine}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors disabled:opacity-50 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleStartEngine}
              disabled={startingEngine || !selectedDomainId}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {startingEngine ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Starting...
                </span>
              ) : (
                'Begin Journey'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Therapeutic Engine Session Modal */}
      <Modal
        isOpen={activeEngineId !== null}
        onClose={handleCloseEngineModal}
        title="Wellness Journey"
        size="xl"
      >
        {activeEngineId && (
          <TherapeuticSessionView
            engineId={activeEngineId}
            onClose={handleCloseEngineModal}
            onComplete={handleCloseEngineModal}
          />
        )}
      </Modal>
    </div>
  );
}
