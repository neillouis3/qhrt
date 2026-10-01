export type WizardResponseType = 'free_text' | 'single_choice' | 'multiple_choice' | 'scale';

export type WizardPromptOption = {
  option_label: string;
  option_value: string;
  display_order?: number;
};

export type WizardPromptInput = {
  prompt_key: string;
  prompt_text: string;
  response_type: WizardResponseType;
  display_order: number;
  /** Index into the dimensions array from the same payload. */
  dimension_index?: number | null;
  options?: WizardPromptOption[];
  /** For scale when options omitted — generates numeric options. */
  scale_min?: number;
  scale_max?: number;
};

export type WizardDimensionInput = {
  name: string;
  description?: string | null;
  priority?: number;
  is_required?: boolean;
};

export type KnowledgeModelWizardPayload = {
  model: {
    name: string;
    description?: string | null;
    version?: string;
    is_active?: boolean;
  };
  dimensions?: WizardDimensionInput[];
  prompts: WizardPromptInput[];
};

export type WizardAssessmentQuestion = {
  question_text: string;
  scale_type?: string;
  minimum_value?: number;
  maximum_value?: number;
  display_order?: number;
};

export type ConditionWizardPayload = {
  category_id?: string;
  new_category?: { name: string; description?: string | null };
  condition: {
    name: string;
    short_description?: string | null;
    long_description?: string | null;
    display_order?: number;
    is_featured?: boolean;
  };
  questions: WizardAssessmentQuestion[];
};

export function slugifyPromptKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64) || 'prompt';
}

export function needsOptions(responseType: WizardResponseType): boolean {
  return (
    responseType === 'single_choice' ||
    responseType === 'multiple_choice' ||
    responseType === 'scale'
  );
}

export function buildScaleOptions(min: number, max: number): WizardPromptOption[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const options: WizardPromptOption[] = [];
  for (let n = lo; n <= hi; n += 1) {
    options.push({
      option_label: String(n),
      option_value: String(n),
      display_order: n - lo,
    });
  }
  return options;
}
