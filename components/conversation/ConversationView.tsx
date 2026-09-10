'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button, Typography, buttonVariants } from '@heroui/react';
import PromptCard from '@/components/conversation/PromptCard';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import { FocusContentSkeleton } from '@/components/layout/PageSkeleton';
import ProgressNav, { activeProgressIndex, linearProgressStatus } from '@/components/session/ProgressNav';
import { SessionOverview, SessionRecapFooter } from '@/components/session/SessionRecap';
import type {
  ConversationState,
  ConversationResponse,
  Prompt,
  PromptResponseOption,
  DimensionCompletionState,
  SessionRecapData,
} from '@/lib/types/conversation';

interface ConversationViewProps {
  conversationId: string;
  onClose?: () => void;
  onComplete?: () => void;
}

export default function ConversationView({
  conversationId,
  onClose,
  onComplete,
}: ConversationViewProps) {
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [responseOptions, setResponseOptions] = useState<PromptResponseOption[]>([]);
  const [responses, setResponses] = useState<ConversationResponse[]>([]);
  const [completedDimensions, setCompletedDimensions] = useState<DimensionCompletionState[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelName, setModelName] = useState('Guided workbook');
  const [modelDescription, setModelDescription] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const [draft, setDraft] = useState('');
  const [goingBack, setGoingBack] = useState(false);
  const [recap, setRecap] = useState<SessionRecapData>({ entries: [] });
  const [isRevisit, setIsRevisit] = useState(false);

  const completedRef = useRef(false);
  const wasAlreadyCompleteRef = useRef(false);

  const applyState = (state: ConversationState) => {
    setCurrentPrompt(state.currentPrompt);
    setResponseOptions(state.responseOptions);
    setResponses(state.responses);
    setCompletedDimensions(state.completedDimensions);
    setIsComplete(state.isComplete);
    if (state.knowledge_model_name) setModelName(state.knowledge_model_name);
    if (state.knowledge_model_description !== undefined) {
      setModelDescription(state.knowledge_model_description);
    }
    if (state.recap) setRecap(state.recap);
    if (state.responses.length > 0 || state.isComplete) {
      setShowOverview(false);
    }
  };

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversation/${conversationId}/state`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to load conversation state');
      }
      const data = await res.json();
      const state: ConversationState = data.state;
      applyState(state);
      setError(null);
      return state.isComplete;
    } catch (err) {
      console.error('[ConversationView] Failed to fetch state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchState().then((wasComplete) => {
      if (wasComplete) {
        wasAlreadyCompleteRef.current = true;
        setIsRevisit(true);
      }
    });
  }, [fetchState]);

  useEffect(() => {
    if (isComplete && !completedRef.current && !wasAlreadyCompleteRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
    if (!isComplete) {
      wasAlreadyCompleteRef.current = false;
    }
  }, [isComplete, onComplete]);

  const handleResponse = useCallback(
    async (value: string) => {
      if (!currentPrompt || submitting) return;

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/conversation/${conversationId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt_id: currentPrompt.id,
            response_value: value,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Failed to submit response');
        }

        const data = await res.json();
        applyState(data.state);
        setDraft('');
      } catch (err) {
        console.error('[ConversationView] Failed to submit response:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSubmitting(false);
      }
    },
    [conversationId, currentPrompt, submitting]
  );

  const handleGoBack = useCallback(async () => {
    if (goingBack) return;
    if (responses.length === 0) {
      setShowOverview(true);
      return;
    }

    setGoingBack(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversation/${conversationId}/back`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to go back');
      }

      const data = await res.json();
      applyState(data.state);
      setDraft('');
    } catch (err) {
      console.error('[ConversationView] Failed to go back:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGoingBack(false);
    }
  }, [conversationId, goingBack, responses.length]);

  const handleComplete = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversation/${conversationId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to complete conversation');
      }

      await fetchState();
    } catch (err) {
      console.error('[ConversationView] Failed to complete:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [conversationId, fetchState]);

  const canSubmitDraft = draft.trim().length > 0;
  const activeDimensionId = currentPrompt?.evidence_dimension_id ?? null;
  const activeDimensionIndex = activeProgressIndex(
    completedDimensions.map((dim) => ({ id: dim.dimension_id, is_complete: dim.is_complete })),
    activeDimensionId
  );
  const progress = (
    <ProgressNav
      items={completedDimensions.map((dim, index) => ({
        id: dim.dimension_id,
        label: dim.dimension_name,
        status: isComplete
          ? dim.is_complete
            ? 'complete'
            : 'skipped'
          : linearProgressStatus(index, activeDimensionIndex, dim.is_complete),
      }))}
    />
  );

  if (loading) {
    return (
      <FocusSessionLayout progress={progress}>
        <FocusContentSkeleton />
      </FocusSessionLayout>
    );
  }

  if (error && responses.length === 0 && !currentPrompt) {
    return (
      <FocusSessionLayout progress={progress}>
        <Typography type="body-sm" className="text-danger">
          {error}{' '}
          <button type="button" onClick={() => fetchState()} className="underline">
            Retry
          </button>
        </Typography>
      </FocusSessionLayout>
    );
  }

  if (isComplete) {
    const recapTitle = modelName.replace(/\s+assessment$/i, '').trim() || modelName;
    return (
      <FocusSessionLayout
        progress={progress}
        title={recapTitle}
        subtitle={
          isRevisit
            ? 'Your saved answers from this workbook.'
            : 'Here is what you wrote. Save it to your diary to revisit later.'
        }
        actions={
          <Link href="/home" className={buttonVariants({ size: 'sm', variant: 'primary' })}>
            Home
          </Link>
        }
      >
        <SessionRecapFooter
          sessionTitle={recapTitle}
          recap={recap}
          sourceKind="session"
          sourceId={conversationId}
          readOnlyNote={
            isRevisit
              ? 'Read-only recap — you can review answers here without restarting the session.'
              : undefined
          }
        />
      </FocusSessionLayout>
    );
  }

  if (showOverview) {
    return (
      <FocusSessionLayout
        progress={progress}
        title={modelName}
        subtitle={modelDescription ?? undefined}
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
          steps={completedDimensions.map((dim, index) => ({
            id: dim.dimension_id,
            index: String(index + 1),
            label: dim.dimension_name,
            description: dim.dimension_description,
          }))}
        />
      </FocusSessionLayout>
    );
  }

  return (
    <FocusSessionLayout
      progress={progress}
      leadingActions={
        <Button
          size="sm"
          variant="tertiary"
          isDisabled={submitting || goingBack}
          onPress={handleGoBack}
        >
          Back
        </Button>
      }
      actions={
        <>
          {onClose ? (
            <Button
              size="sm"
              variant="outline"
              isDisabled={submitting || goingBack}
              onPress={onClose}
            >
              Take a break
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="primary"
            isPending={submitting}
            isDisabled={submitting || goingBack || (currentPrompt ? !canSubmitDraft : false)}
            onPress={() => {
              if (currentPrompt) {
                void handleResponse(draft);
                return;
              }
              void handleComplete();
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      {error ? (
        <Typography type="body-sm" className="text-danger">
          {error}{' '}
          <button type="button" onClick={() => fetchState()} className="underline">
            Retry
          </button>
        </Typography>
      ) : null}

      {currentPrompt ? (
        <>
          <PromptCard
            key={currentPrompt.id}
            prompt={currentPrompt}
            responseOptions={responseOptions}
            onResponse={handleResponse}
            hideSubmit
            onDraftChange={setDraft}
          />
        </>
      ) : (
        <Typography type="body-sm" color="muted">
          No more prompts to display. You can finish this workbook when you are ready.
        </Typography>
      )}
    </FocusSessionLayout>
  );
}
