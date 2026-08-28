'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PromptCard from '@/components/conversation/PromptCard';
import DimensionProgress from '@/components/conversation/DimensionProgress';
import ResponseHistory from '@/components/conversation/ResponseHistory';
import type {
  ConversationState,
  ConversationResponse,
  Prompt,
  PromptResponseOption,
  DimensionCompletionState,
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
  // State
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [responseOptions, setResponseOptions] = useState<PromptResponseOption[]>([]);
  const [responses, setResponses] = useState<ConversationResponse[]>([]);
  const [completedDimensions, setCompletedDimensions] = useState<DimensionCompletionState[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already called onComplete to avoid double-firing
  const completedRef = useRef(false);
  // Track whether the conversation was already-complete on initial load (i.e., "View" mode)
  const wasAlreadyCompleteRef = useRef(false);

  // Fetch conversation state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversation/${conversationId}/state`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to load conversation state');
      }
      const data = await res.json();
      const state: ConversationState = data.state;

      setCurrentPrompt(state.currentPrompt);
      setResponseOptions(state.responseOptions);
      setResponses(state.responses);
      setCompletedDimensions(state.completedDimensions);
      setIsComplete(state.isComplete);
      setError(null);

      // Store all prompts from the knowledge model for response history display
      if (state.prompts) {
        setAllPrompts(state.prompts);
      }

      return state.isComplete;
    } catch (err) {
      console.error('[ConversationView] Failed to fetch state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    fetchState().then((wasComplete) => {
      // If already complete on load, mark it so onComplete doesn't fire
      // (this happens when the user clicks "View" on a completed conversation)
      if (wasComplete) {
        wasAlreadyCompleteRef.current = true;
      }
    });
  }, [fetchState]);

  // Handle completion callback — only fire if we transitioned to complete (not already done)
  useEffect(() => {
    if (isComplete && !completedRef.current && !wasAlreadyCompleteRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
    // Reset flag when conversation changes
    if (!isComplete) {
      wasAlreadyCompleteRef.current = false;
    }
  }, [isComplete, onComplete]);

  // Submit a response
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
        const state: ConversationState = data.state;

        setCurrentPrompt(state.currentPrompt);
        setResponseOptions(state.responseOptions);
        setResponses(state.responses);
        setCompletedDimensions(state.completedDimensions);
        setIsComplete(state.isComplete);
        if (state.prompts) {
          setAllPrompts(state.prompts);
        }
      } catch (err) {
        console.error('[ConversationView] Failed to submit response:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSubmitting(false);
      }
    },
    [conversationId, currentPrompt, submitting]
  );

  // Handle manual completion
  const handleComplete = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversation/${conversationId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to complete conversation');
      }

      setIsComplete(true);
      setCurrentPrompt(null);
      setResponseOptions([]);
    } catch (err) {
      console.error('[ConversationView] Failed to complete:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [conversationId]);

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted dark:text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Completed
  // ---------------------------------------------------------------------------
  if (isComplete) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-6">
        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
            Conversation Complete
          </h3>
          <p className="text-sm text-muted dark:text-gray-400">
            All dimensions have been assessed. Your responses have been recorded.
          </p>
        </div>

        {/* Dimension summary */}
        <DimensionProgress dimensions={completedDimensions} />

        {/* Response history */}
        {responses.length > 0 && (
          <div className="w-full">
            <ResponseHistory responses={responses} prompts={allPrompts} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Active conversation
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={fetchState} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Dimension progress */}
      <DimensionProgress
        dimensions={completedDimensions}
        currentDimensionId={currentPrompt?.evidence_dimension_id ?? null}
      />

      {/* Current prompt */}
      {currentPrompt && (
        <>
          <div className="border-t border-border pt-4 dark:border-gray-700">
            <PromptCard
              key={currentPrompt.id} // Force re-mount on prompt change to reset state
              prompt={currentPrompt}
              responseOptions={responseOptions}
              onResponse={handleResponse}
            />
          </div>

          {/* Response history */}
          {responses.length > 0 && <ResponseHistory responses={responses} prompts={allPrompts} />}
        </>
      )}

      {/* No prompt but not complete — edge case, offer manual completion */}
      {!currentPrompt && !isComplete && (
        <div className="text-center py-8">
          <p className="text-sm text-muted dark:text-gray-400 mb-4">
            No more prompts to display. You can complete the conversation now.
          </p>
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
          >
            Complete Conversation
          </button>
        </div>
      )}

      {/* Close / pause button */}
      {onClose && (
        <div className="border-t border-border pt-4 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-muted/5 transition-colors disabled:opacity-50 dark:border-gray-700 dark:hover:bg-navy-light/10"
          >
            Pause & Exit
          </button>
        </div>
      )}
    </div>
  );
}
