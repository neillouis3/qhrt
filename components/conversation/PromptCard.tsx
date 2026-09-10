'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Label,
  Radio,
  RadioGroup,
  Slider,
  TextArea,
  Typography,
} from '@heroui/react';
import type { Prompt, PromptResponseOption } from '@/lib/types/conversation';

interface PromptCardProps {
  prompt: Prompt;
  responseOptions: PromptResponseOption[];
  onResponse: (value: string) => void;
  hideSubmit?: boolean;
  onDraftChange?: (value: string) => void;
}

export default function PromptCard({
  prompt,
  responseOptions,
  onResponse,
  hideSubmit = false,
  onDraftChange,
}: PromptCardProps) {
  const [value, setValue] = useState('');

  const setDraft = (next: string) => {
    setValue(next);
    onDraftChange?.(next);
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onResponse(value);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.response_type === 'free_text') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedChoices = value ? value.split(',').filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-4">
      <Typography type="body">{prompt.prompt_text}</Typography>

      {prompt.response_type === 'free_text' && (
        <TextArea
          fullWidth
          rows={4}
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response..."
          aria-label={prompt.prompt_text}
        />
      )}

      {prompt.response_type === 'single_choice' && (
        <RadioGroup
          value={value || undefined}
          onChange={setDraft}
          aria-label={prompt.prompt_text}
          className="flex flex-col gap-2"
        >
          {responseOptions.map((opt) => (
            <Radio key={opt.id} value={opt.option_value}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                {opt.option_label}
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      )}

      {prompt.response_type === 'multiple_choice' && (
        <CheckboxGroup
          value={selectedChoices}
          onChange={(keys) => setDraft([...keys].filter(Boolean).join(','))}
          aria-label={prompt.prompt_text}
          className="flex flex-col gap-2"
        >
          {responseOptions.map((opt) => (
            <Checkbox key={opt.id} value={opt.option_value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                {opt.option_label}
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      )}

      {prompt.response_type === 'scale' && (
        <ScaleInput
          options={responseOptions}
          promptText={prompt.prompt_text}
          value={value}
          onValueChange={setDraft}
        />
      )}

      {(prompt.response_type === 'free_text' ||
        prompt.response_type === 'multiple_choice' ||
        prompt.response_type === 'single_choice' ||
        prompt.response_type === 'scale') &&
        !hideSubmit && (
          <div className="flex justify-end">
            <Button size="sm" variant="primary" isDisabled={!value.trim()} onPress={handleSubmit}>
              Continue
            </Button>
          </div>
        )}
    </div>
  );
}

function ScaleInput({
  options,
  promptText,
  value,
  onValueChange,
}: {
  options: PromptResponseOption[];
  promptText: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const values = options
    .map((o) => {
      const num = parseInt(o.option_value, 10);
      return Number.isNaN(num) ? null : num;
    })
    .filter((n): n is number => n != null);

  if (values.length < 2) {
    return (
      <RadioGroup
        value={value || undefined}
        onChange={onValueChange}
        aria-label={promptText}
        className="flex flex-col gap-2"
      >
        {options.map((opt) => (
          <Radio key={opt.id} value={opt.option_value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              {opt.option_label}
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const parsed = parseInt(value, 10);
  const current = Number.isNaN(parsed) ? min : parsed;

  useEffect(() => {
    if (!value) onValueChange(String(min));
  }, [min, onValueChange, value]);

  return (
    <Slider
      minValue={min}
      maxValue={max}
      step={1}
      value={current}
      onChange={(next) => {
        const resolved = Array.isArray(next) ? (next[0] ?? current) : next;
        onValueChange(String(resolved));
      }}
      aria-label={promptText}
    >
      <div className="flex items-center justify-between">
        <Label>
          {min} – {max}
        </Label>
        <Slider.Output />
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}
