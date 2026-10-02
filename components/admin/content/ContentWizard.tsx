'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Label,
  ProgressBar,
  TextArea,
  Typography,
} from '@heroui/react';
import Modal from '@/components/ui/Modal';
import AppCard, { surfaceClass } from '@/components/ui/AppCard';
import FieldSelect from '@/components/ui/FieldSelect';
import {
  buildScaleOptions,
  needsOptions,
  slugifyPromptKey,
  type ConditionWizardPayload,
  type KnowledgeModelWizardPayload,
  type WizardAssessmentQuestion,
  type WizardDimensionInput,
  type WizardPromptInput,
  type WizardResponseType,
} from '@/lib/admin/contentWizardTypes';

type WizardKind = 'knowledge_model' | 'condition';

type CategoryOption = { id: string; name: string };

const RESPONSE_TYPES: { id: WizardResponseType; name: string }[] = [
  { id: 'free_text', name: 'Free text' },
  { id: 'single_choice', name: 'Single choice' },
  { id: 'multiple_choice', name: 'Multiple choice' },
  { id: 'scale', name: 'Numeric scale' },
];

function FieldLabel({
  children,
  required = false,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="text-danger" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </Label>
  );
}

function WizardSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AppCard className={['flex flex-col gap-3 p-4', className].filter(Boolean).join(' ')}>
      {children}
    </AppCard>
  );
}

function KindOption({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${surfaceClass} rounded-lg p-4 text-left transition-[box-shadow,background-color] ${
        selected ? 'ring-2 ring-primary/60 ring-inset bg-default/50' : 'hover:bg-default/40'
      }`}
    >
      <Typography type="body-sm" className="font-medium">
        {title}
      </Typography>
      <Typography type="body-xs" color="muted" className="mt-1">
        {description}
      </Typography>
    </button>
  );
}

function emptyPrompt(order: number): WizardPromptInput {
  return {
    prompt_key: '',
    prompt_text: '',
    response_type: 'free_text',
    display_order: order,
    dimension_index: null,
    options: [],
    scale_min: 0,
    scale_max: 10,
  };
}

function emptyAssessment(order: number): WizardAssessmentQuestion {
  return {
    question_text: '',
    scale_type: '0-10',
    minimum_value: 0,
    maximum_value: 10,
    display_order: order,
  };
}

export function ContentWizard({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [kind, setKind] = useState<WizardKind>('knowledge_model');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Knowledge model
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelVersion, setModelVersion] = useState('1.0');
  const [activateModel, setActivateModel] = useState(false);
  const [dimensions, setDimensions] = useState<WizardDimensionInput[]>([]);
  const [prompts, setPrompts] = useState<WizardPromptInput[]>([emptyPrompt(0)]);

  // Condition library
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [conditionName, setConditionName] = useState('');
  const [conditionShort, setConditionShort] = useState('');
  const [assessmentQuestions, setAssessmentQuestions] = useState<WizardAssessmentQuestion[]>([
    emptyAssessment(0),
  ]);

  const kmSteps = ['Content type', 'Model details', 'Evidence topics', 'Session questions', 'Review'];
  const conditionSteps = ['Content type', 'Condition details', 'Assessment questions', 'Review'];
  const steps = kind === 'knowledge_model' ? kmSteps : conditionSteps;
  const stepCount = steps.length;

  const reset = useCallback(() => {
    setStep(0);
    setKind('knowledge_model');
    setModelName('');
    setModelDesc('');
    setModelVersion('1.0');
    setActivateModel(false);
    setDimensions([]);
    setPrompts([emptyPrompt(0)]);
    setCategoryId('');
    setNewCategoryName('');
    setConditionName('');
    setConditionShort('');
    setAssessmentQuestions([emptyAssessment(0)]);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((json) => {
        const list = (json.categories ?? []) as { id: string; name: string }[];
        setCategories(list.map((c) => ({ id: c.id, name: c.name })));
      })
      .catch(() => setCategories([]));
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (kind === 'knowledge_model') {
      if (step === 1) return modelName.trim().length > 0;
      if (step === 2) return true;
      if (step === 3) {
        return prompts.every((p) => p.prompt_text.trim() && p.prompt_key.trim());
      }
    } else {
      if (step === 1) {
        return (
          conditionName.trim().length > 0 &&
          (categoryId.length > 0 || newCategoryName.trim().length > 0)
        );
      }
      if (step === 2) {
        return assessmentQuestions.every((q) => q.question_text.trim().length > 0);
      }
    }
    return true;
  }, [
    step,
    kind,
    modelName,
    prompts,
    conditionName,
    categoryId,
    newCategoryName,
    assessmentQuestions,
  ]);

  const submitKnowledgeModel = async () => {
    const payload: KnowledgeModelWizardPayload = {
      model: {
        name: modelName.trim(),
        description: modelDesc.trim() || null,
        version: modelVersion.trim() || '1.0',
        is_active: activateModel,
      },
      dimensions: dimensions.filter((d) => d.name?.trim()),
      prompts: prompts.map((p, index) => ({
        ...p,
        prompt_key: p.prompt_key.trim() || slugifyPromptKey(p.prompt_text),
        display_order: index,
        options:
          p.response_type === 'single_choice' || p.response_type === 'multiple_choice'
            ? (p.options ?? []).filter((o) => o.option_label.trim() && o.option_value.trim())
            : undefined,
      })),
    };

    const res = await fetch('/api/admin/content-wizard/knowledge-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Could not create model');
    }
    onSuccess(`Knowledge model “${modelName.trim()}” created with ${payload.prompts.length} question(s).`);
  };

  const submitCondition = async () => {
    const payload: ConditionWizardPayload = {
      category_id: categoryId || undefined,
      new_category: !categoryId && newCategoryName.trim()
        ? { name: newCategoryName.trim() }
        : undefined,
      condition: {
        name: conditionName.trim(),
        short_description: conditionShort.trim() || null,
      },
      questions: assessmentQuestions.map((q, index) => ({
        ...q,
        display_order: index,
        scale_type: `${q.minimum_value ?? 0}-${q.maximum_value ?? 10}`,
      })),
    };

    const res = await fetch('/api/admin/content-wizard/condition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Could not create condition');
    }
    onSuccess(`Condition “${conditionName.trim()}” created with ${payload.questions.length} question(s).`);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      if (kind === 'knowledge_model') {
        await submitKnowledgeModel();
      } else {
        await submitCondition();
      }
      reset();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const title = steps[step] ?? 'Add content';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <div className="flex flex-col gap-6">
        <ProgressBar
          aria-label="Wizard progress"
          value={((step + 1) / stepCount) * 100}
          minValue={0}
          maxValue={100}
          color="accent"
          size="sm"
        >
          <div className="mb-1.5">
            <Typography type="body-xs" color="muted">
              Step {step + 1} of {stepCount}: {title}
            </Typography>
          </div>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <KindOption
              selected={kind === 'knowledge_model'}
              title="Guided session (knowledge model)"
              description="Title, evidence topics, and conversation prompts with answer types — saved like the Sleep model flow."
              onSelect={() => setKind('knowledge_model')}
            />
            <KindOption
              selected={kind === 'condition'}
              title="Condition assessment"
              description="Category, condition name, and scaled assessment questions for the condition library."
              onSelect={() => setKind('condition')}
            />
          </div>
        ) : null}

        {kind === 'knowledge_model' && step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="wizard-model-name" required>
                Model title
              </FieldLabel>
              <Input
                id="wizard-model-name"
                fullWidth
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Sleep support"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="wizard-model-desc">Description</FieldLabel>
              <TextArea
                id="wizard-model-desc"
                fullWidth
                rows={3}
                value={modelDesc}
                onChange={(e) => setModelDesc(e.target.value)}
                placeholder="What this session helps with"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="wizard-model-version">Version</FieldLabel>
                <Input
                  id="wizard-model-version"
                  fullWidth
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                />
              </div>
              <div className="flex items-end pb-1">
                <Checkbox isSelected={activateModel} onChange={setActivateModel}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    Active for users after create
                  </Checkbox.Content>
                </Checkbox>
              </div>
            </div>
          </div>
        ) : null}

        {kind === 'knowledge_model' && step === 2 ? (
          <div className="flex flex-col gap-3">
            <Typography type="body-sm" color="muted">
              Optional evidence dimensions (topics you track). Link questions to a topic on the next
              step.
            </Typography>
            {dimensions.map((dim, index) => (
              <WizardSection key={index}>
                <Input
                  fullWidth
                  placeholder="Topic name"
                  value={dim.name}
                  onChange={(e) => {
                    const next = [...dimensions];
                    next[index] = { ...next[index]!, name: e.target.value };
                    setDimensions(next);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setDimensions(dimensions.filter((_, i) => i !== index))}
                >
                  Remove topic
                </Button>
              </WizardSection>
            ))}
            <Button
              size="sm"
              variant="outline"
              onPress={() =>
                setDimensions([
                  ...dimensions,
                  { name: '', priority: dimensions.length, is_required: true },
                ])
              }
            >
              Add evidence topic
            </Button>
          </div>
        ) : null}

        {kind === 'knowledge_model' && step === 3 ? (
          <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
            {prompts.map((prompt, index) => (
              <PromptEditor
                key={index}
                prompt={prompt}
                dimensions={dimensions}
                onChange={(next) => {
                  const copy = [...prompts];
                  copy[index] = next;
                  setPrompts(copy);
                }}
                onRemove={
                  prompts.length > 1 ? () => setPrompts(prompts.filter((_, i) => i !== index)) : undefined
                }
              />
            ))}
            <Button
              size="sm"
              variant="outline"
              onPress={() => setPrompts([...prompts, emptyPrompt(prompts.length)])}
            >
              Add another question
            </Button>
          </div>
        ) : null}

        {kind === 'knowledge_model' && step === 4 ? (
          <ReviewKnowledgeModel
            modelName={modelName}
            modelDesc={modelDesc}
            dimensions={dimensions}
            prompts={prompts}
            activateModel={activateModel}
          />
        ) : null}

        {kind === 'condition' && step === 1 ? (
          <div className="flex flex-col gap-4">
            <FieldSelect
              label="Category"
              placeholder="Select category"
              selectedKey={categoryId}
              onChange={setCategoryId}
              items={categories}
            />
            <Typography type="body-xs" color="muted">
              Or create a category:
            </Typography>
            <div className={categoryId ? 'pointer-events-none opacity-50' : undefined}>
              <Input
                fullWidth
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="wizard-condition-name" required>
                Condition title
              </FieldLabel>
              <Input
                id="wizard-condition-name"
                fullWidth
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="wizard-condition-short">Short description</FieldLabel>
              <TextArea
                id="wizard-condition-short"
                fullWidth
                rows={2}
                value={conditionShort}
                onChange={(e) => setConditionShort(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {kind === 'condition' && step === 2 ? (
          <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
            {assessmentQuestions.map((q, index) => (
              <WizardSection key={index}>
                <Typography type="body-sm">Question {index + 1}</Typography>
                <TextArea
                  fullWidth
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => {
                    const next = [...assessmentQuestions];
                    next[index] = { ...next[index]!, question_text: e.target.value };
                    setAssessmentQuestions(next);
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={`wizard-q-min-${index}`}>Scale min</FieldLabel>
                    <Input
                      id={`wizard-q-min-${index}`}
                      fullWidth
                      type="number"
                      value={String(q.minimum_value ?? 0)}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        next[index] = {
                          ...next[index]!,
                          minimum_value: Number(e.target.value),
                        };
                        setAssessmentQuestions(next);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={`wizard-q-max-${index}`}>Scale max</FieldLabel>
                    <Input
                      id={`wizard-q-max-${index}`}
                      fullWidth
                      type="number"
                      value={String(q.maximum_value ?? 10)}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        next[index] = {
                          ...next[index]!,
                          maximum_value: Number(e.target.value),
                        };
                        setAssessmentQuestions(next);
                      }}
                    />
                  </div>
                </div>
                {assessmentQuestions.length > 1 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== index))
                    }
                  >
                    Remove question
                  </Button>
                ) : null}
              </WizardSection>
            ))}
            <Button
              size="sm"
              variant="outline"
              onPress={() =>
                setAssessmentQuestions([
                  ...assessmentQuestions,
                  emptyAssessment(assessmentQuestions.length),
                ])
              }
            >
              Add question
            </Button>
          </div>
        ) : null}

        {kind === 'condition' && step === 3 ? (
          <WizardSection className="gap-2 text-sm">
            <Typography type="body-sm">
              <strong>{conditionName}</strong> in{' '}
              {categoryId
                ? categories.find((c) => c.id === categoryId)?.name
                : newCategoryName || 'new category'}
            </Typography>
            <Typography type="body-xs" color="muted">
              {assessmentQuestions.length} assessment question(s)
            </Typography>
            <ul className="list-disc pl-5">
              {assessmentQuestions.map((q, i) => (
                <li key={i}>{q.question_text}</li>
              ))}
            </ul>
          </WizardSection>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            size="sm"
            variant="ghost"
            isDisabled={submitting || step === 0}
            onPress={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" isDisabled={submitting} onPress={handleClose}>
              Cancel
            </Button>
            {step < stepCount - 1 ? (
              <Button
                size="sm"
                variant="primary"
                isDisabled={!canNext}
                onPress={() => setStep((s) => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                isPending={submitting}
                isDisabled={submitting}
                onPress={() => void handleFinish()}
              >
                Create content
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PromptEditor({
  prompt,
  dimensions,
  onChange,
  onRemove,
}: {
  prompt: WizardPromptInput;
  dimensions: WizardDimensionInput[];
  onChange: (next: WizardPromptInput) => void;
  onRemove?: () => void;
}) {
  const dimItems = dimensions
    .filter((d) => d.name.trim())
    .map((d, index) => ({ id: String(index), name: d.name }));

  const showOptions = needsOptions(prompt.response_type);

  return (
    <WizardSection>
      <TextArea
        fullWidth
        rows={2}
        placeholder="Question / prompt text *"
        value={prompt.prompt_text}
        onChange={(e) => {
          const text = e.target.value;
          const next = { ...prompt, prompt_text: text };
          if (!prompt.prompt_key.trim()) {
            next.prompt_key = slugifyPromptKey(text);
          }
          onChange(next);
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <FieldLabel required>Prompt key</FieldLabel>
          <Input
            fullWidth
            value={prompt.prompt_key}
            onChange={(e) => onChange({ ...prompt, prompt_key: e.target.value })}
          />
        </div>
        <FieldSelect
          label="Answer type"
          placeholder="Type"
          selectedKey={prompt.response_type}
          onChange={(v) =>
            onChange({
              ...prompt,
              response_type: v as WizardResponseType,
              options: v === 'free_text' ? [] : prompt.options ?? [{ option_label: '', option_value: '' }, { option_label: '', option_value: '' }],
            })
          }
          items={RESPONSE_TYPES}
        />
      </div>
      {dimItems.length > 0 ? (
        <FieldSelect
          label="Evidence topic (optional)"
          placeholder="None"
          selectedKey={
            prompt.dimension_index != null ? String(prompt.dimension_index) : ''
          }
          onChange={(v) =>
            onChange({
              ...prompt,
              dimension_index: v === '' ? null : Number(v),
            })
          }
          items={[{ id: '', name: 'None' }, ...dimItems]}
        />
      ) : null}

      {showOptions && prompt.response_type === 'scale' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <FieldLabel>Scale min</FieldLabel>
            <Input
              fullWidth
              type="number"
              value={String(prompt.scale_min ?? 0)}
              onChange={(e) => onChange({ ...prompt, scale_min: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Scale max</FieldLabel>
            <Input
              fullWidth
              type="number"
              value={String(prompt.scale_max ?? 10)}
              onChange={(e) => onChange({ ...prompt, scale_max: Number(e.target.value) })}
            />
          </div>
          <Typography type="body-xs" color="muted" className="col-span-2">
            Creates {buildScaleOptions(prompt.scale_min ?? 0, prompt.scale_max ?? 10).length}{' '}
            scale options automatically.
          </Typography>
        </div>
      ) : null}

      {showOptions &&
      (prompt.response_type === 'single_choice' || prompt.response_type === 'multiple_choice') ? (
        <div className="flex flex-col gap-2">
          <Typography type="body-xs" color="muted">
            Answer choices (label and value)
          </Typography>
          {(prompt.options ?? []).map((opt, oi) => (
            <div key={oi} className="grid grid-cols-2 gap-2">
              <Input
                fullWidth
                placeholder="Label"
                value={opt.option_label}
                onChange={(e) => {
                  const options = [...(prompt.options ?? [])];
                  options[oi] = { ...options[oi]!, option_label: e.target.value };
                  onChange({ ...prompt, options });
                }}
              />
              <Input
                fullWidth
                placeholder="Value"
                value={opt.option_value}
                onChange={(e) => {
                  const options = [...(prompt.options ?? [])];
                  options[oi] = { ...options[oi]!, option_value: e.target.value };
                  onChange({ ...prompt, options });
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onPress={() =>
              onChange({
                ...prompt,
                options: [...(prompt.options ?? []), { option_label: '', option_value: '' }],
              })
            }
          >
            Add choice
          </Button>
        </div>
      ) : null}

      {onRemove ? (
        <Button size="sm" variant="ghost" onPress={onRemove}>
          Remove question
        </Button>
      ) : null}
    </WizardSection>
  );
}

function ReviewKnowledgeModel({
  modelName,
  modelDesc,
  dimensions,
  prompts,
  activateModel,
}: {
  modelName: string;
  modelDesc: string;
  dimensions: WizardDimensionInput[];
  prompts: WizardPromptInput[];
  activateModel: boolean;
}) {
  return (
    <WizardSection className="gap-3 text-sm">
      <div>
        <Typography type="body-sm" className="font-medium">
          {modelName}
        </Typography>
        {modelDesc ? (
          <Typography type="body-xs" color="muted">
            {modelDesc}
          </Typography>
        ) : null}
        <Typography type="body-xs" color="muted">
          {activateModel ? 'Will be active for users' : 'Saved as inactive'}
        </Typography>
      </div>
      {dimensions.filter((d) => d.name.trim()).length > 0 ? (
        <Typography type="body-xs" color="muted">
          Topics: {dimensions.filter((d) => d.name.trim()).map((d) => d.name).join(', ')}
        </Typography>
      ) : null}
      <Typography type="body-xs" color="muted">
        {prompts.length} session question(s)
      </Typography>
      <ol className="list-decimal pl-5">
        {prompts.map((p, i) => (
          <li key={i} className="mb-1">
            {p.prompt_text}{' '}
            <span className="text-muted">({p.response_type})</span>
          </li>
        ))}
      </ol>
      <Typography type="body-xs" color="muted">
        Branch rules and completion rules can be added later from their tabs.
      </Typography>
    </WizardSection>
  );
}
