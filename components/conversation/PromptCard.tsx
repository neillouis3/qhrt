'use client';

import { useState } from 'react';
import type { Prompt, PromptResponseOption, ResponseType } from '@/lib/types/conversation';

interface PromptCardProps {
  prompt: Prompt;
  responseOptions: PromptResponseOption[];
  onResponse: (value: string) => void;
}

export default function PromptCard({ prompt, responseOptions, onResponse }: PromptCardProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onResponse(value);
    setValue('');
  };

  const handleSubmitWithOption = (optionValue: string) => {
    onResponse(optionValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Enter to submit for free_text (but Shift+Enter for newlines)
    if (e.key === 'Enter' && !e.shiftKey && prompt.response_type === 'free_text') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Prompt text */}
      <div className="rounded-xl border border-border bg-background p-5 dark:bg-navy">
        <p className="text-lg font-medium text-foreground leading-relaxed dark:text-white">
          {prompt.prompt_text}
        </p>
      </div>

      {/* Input based on response type */}
      {prompt.response_type === 'free_text' && (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-primary focus:border-transparent resize-none dark:bg-navy dark:border-gray-700 dark:text-white"
        />
      )}

      {prompt.response_type === 'single_choice' && (
        <div className="space-y-2">
          {responseOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSubmitWithOption(opt.option_value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                value === opt.option_value
                  ? 'border-primary bg-primary/10 text-foreground dark:bg-primary/10 dark:text-white'
                  : 'border-border hover:border-primary/50 hover:bg-muted/5 text-foreground dark:border-gray-700 dark:hover:border-primary/30 dark:text-gray-200'
              }`}
            >
              {opt.option_label}
            </button>
          ))}
        </div>
      )}

      {prompt.response_type === 'multiple_choice' && (
        <div className="space-y-2">
          {responseOptions.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                value.includes(opt.option_value)
                  ? 'border-primary bg-primary/10 dark:bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/5 dark:border-gray-700 dark:hover:border-primary/30'
              }`}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.option_value)}
                onChange={(e) => {
                  const vals = e.target.checked
                    ? [...value.split(','), opt.option_value].filter(Boolean).join(',')
                    : value
                        .split(',')
                        .filter((v) => v !== opt.option_value)
                        .join(',');
                  setValue(vals);
                }}
                className="accent-primary"
              />
              <span className="text-foreground dark:text-gray-200">{opt.option_label}</span>
            </label>
          ))}
        </div>
      )}

      {prompt.response_type === 'scale' && (
        <ScaleInput options={responseOptions} onValueChange={handleSubmitWithOption} />
      )}

      {/* Submit button for free_text and multiple_choice */}
      {(prompt.response_type === 'free_text' || prompt.response_type === 'multiple_choice') && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      )}
    </div>
  );
}

// Scale input for scale-type prompts
function ScaleInput({
  options,
  onValueChange,
}: {
  options: PromptResponseOption[];
  onValueChange: (value: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  // Try to parse numeric range from options
  const values = options
    .map((o) => {
      const num = parseInt(o.option_value, 10);
      return isNaN(num) ? null : num;
    })
    .filter(Boolean) as number[];

  if (values.length < 2) {
    // Fallback to option labels
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              setSelected(parseInt(opt.option_value, 10) ?? 0);
              onValueChange(opt.option_value);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
              selected === (parseInt(opt.option_value, 10) ?? -1)
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted/5 dark:border-gray-700'
            }`}
          >
            {opt.option_label}
          </button>
        ))}
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted w-6 text-center">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={selected ?? min}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelected(val);
            onValueChange(String(val));
          }}
          className="flex-1 accent-primary"
        />
        <span className="text-sm text-muted w-6 text-center">{max}</span>
        <span className="text-lg font-semibold text-foreground w-8 text-center">
          {selected ?? '—'}
        </span>
      </div>
    </div>
  );
}
