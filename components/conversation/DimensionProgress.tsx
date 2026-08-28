'use client';

import { useState } from 'react';
import type { DimensionCompletionState } from '@/lib/types/conversation';

interface DimensionProgressProps {
  dimensions: DimensionCompletionState[];
  currentDimensionId?: string | null;
}

export default function DimensionProgress({
  dimensions,
  currentDimensionId,
}: DimensionProgressProps) {
  const [collapsed, setCollapsed] = useState(false);
  const total = dimensions.length;
  const completed = dimensions.filter((d) => d.is_complete).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted dark:text-gray-400">Progress</span>
        <span className="font-medium text-foreground dark:text-white">
          {completed}/{total} ({percentage}%)
        </span>
      </div>

      <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden dark:bg-navy-light/20">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Dimension list - collapsible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-xs text-muted hover:text-foreground transition-colors dark:text-gray-500 dark:hover:text-gray-300"
      >
        <span>{collapsed ? 'Show dimensions' : 'Hide dimensions'}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {dimensions.map((dim) => {
            const isCurrent = dim.dimension_id === currentDimensionId;
            return (
              <div
                key={dim.dimension_id}
                className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary/30 dark:bg-primary/10'
                    : 'hover:bg-muted/5 dark:hover:bg-navy-light/10'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {dim.is_complete ? (
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted/40 dark:border-gray-600" />
                  )}
                </div>

                {/* Dimension name */}
                <span
                  className={`flex-1 ${
                    dim.is_complete
                      ? 'text-muted line-through dark:text-gray-500'
                      : isCurrent
                        ? 'font-medium text-foreground dark:text-white'
                        : 'text-foreground dark:text-gray-300'
                  }`}
                >
                  {dim.dimension_name}
                </span>

                {/* Response count */}
                <span className="text-xs text-muted dark:text-gray-500">
                  {dim.responded_prompt_keys.length}/{dim.required_prompt_keys.length}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
