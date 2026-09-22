import type {
  ConversationResponse,
  Prompt,
  PromptResponseOption,
  SessionRecapData,
  SessionRecapEntry,
} from '@/lib/types/conversation';

export type { SessionRecapData, SessionRecapEntry };

function formatAnswer(
  value: string,
  options: PromptResponseOption[] | undefined
): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!options?.length) return trimmed;

  const labelFor = (raw: string) => {
    const match = options.find((opt) => opt.option_value === raw);
    return match?.option_label ?? raw;
  };

  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map(labelFor)
      .join(', ');
  }

  return labelFor(trimmed);
}

export function buildSessionRecap({
  prompts,
  responses,
  optionsByPromptId,
}: {
  prompts: Prompt[];
  responses: ConversationResponse[];
  optionsByPromptId: Map<string, PromptResponseOption[]>;
}): SessionRecapData {
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));

  const entries: SessionRecapEntry[] = [];

  for (const response of responses) {
    const prompt = promptById.get(response.prompt_id);
    const answer = formatAnswer(
      response.response_value,
      optionsByPromptId.get(response.prompt_id)
    );
    if (!prompt || !answer) continue;
    entries.push({
      id: response.id,
      prompt: prompt.prompt_text,
      answer,
    });
  }

  return { entries };
}
