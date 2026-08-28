'use client';

import { useState } from 'react';
import type { ConversationResponse, Prompt } from '@/lib/types/conversation';

interface ResponseHistoryProps {
  responses: ConversationResponse[];
  prompts: Prompt[];
}

export default function ResponseHistory({ responses, prompts }: ResponseHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (responses.length === 0) return null;

  // Build a map of prompt_id → prompt_text for display
  const promptMap = new Map<string, string>();
  for (const p of prompts) {
    promptMap.set(p.id, p.prompt_text);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden dark:border-gray-700">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/5 transition-colors dark:text-white dark:hover:bg-navy-light/10"
      >
        <span>Response History ({responses.length})</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible list */}
      {expanded && (
        <div className="max-h-60 overflow-y-auto border-t border-border dark:border-gray-700">
          {responses.map((resp, idx) => (
            <div
              key={resp.id ?? idx}
              className="px-4 py-3 border-b border-border last:border-b-0 dark:border-gray-700"
            >
              <p className="text-xs text-muted dark:text-gray-400 mb-1">
                {promptMap.get(resp.prompt_id) ?? `Prompt ${resp.prompt_id.slice(0, 8)}...`}
              </p>
              <p className="text-sm text-foreground dark:text-gray-200">{resp.response_value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
