'use client';

import { useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Description,
  Input,
  Label,
  ListBox,
  NumberField,
  ProgressBar,
  Radio,
  RadioGroup,
  Select,
  Slider,
  TextArea,
  Typography,
} from '@heroui/react';
import {
  ONBOARDING_CONCERNS,
  ONBOARDING_EXPERIENCE,
  ONBOARDING_PRACTICE_TIMES,
  ONBOARDING_PRONOUNS,
  ONBOARDING_REFERRALS,
  ONBOARDING_REGULATION,
  ONBOARDING_RESOURCES,
  ONBOARDING_SLEEP,
  ONBOARDING_STEPS,
  type OnboardingPayload,
} from '@/lib/onboarding';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const initialData: OnboardingPayload = {
  firstName: '',
  lastName: '',
  age: null,
  pronouns: null,
  referral: null,
  concerns: [],
  concernOther: '',
  sleepQuality: null,
  regulationIssue: null,
  resources: [],
  experience: null,
  practiceTime: null,
  stress: 5,
  emotionalIntensity: 5,
  bodyTension: 5,
  goals: '',
};

function FieldLabel({
  children,
  required = false,
  htmlFor,
  className,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className={className}>
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

function OptionSelect({
  label,
  placeholder,
  selectedKey,
  onChange,
  items,
  required = false,
}: {
  label: string;
  placeholder: string;
  selectedKey: string | null;
  onChange: (key: string) => void;
  items: readonly { id: string; label: string }[];
  required?: boolean;
}) {
  return (
    <Select
      fullWidth
      placeholder={placeholder}
      selectedKey={selectedKey}
      isRequired={required}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key));
      }}
    >
      <FieldLabel>{label}</FieldLabel>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function CheckRow({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <Checkbox value={value}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
    </Checkbox>
  );
}

function ScaleSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider
      minValue={1}
      maxValue={10}
      step={1}
      value={value}
      onChange={(next) => onChange(Array.isArray(next) ? next[0] ?? value : next)}
    >
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Slider.Output />
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingPayload>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<OnboardingPayload>) => setData((current) => ({ ...current, ...patch }));

  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const current = ONBOARDING_STEPS[step];

  const validateStep = (): string => {
    if (step === 0) {
      if (!data.firstName.trim()) return 'Please add your first name.';
      if (data.age == null) return 'Please add your age.';
    }
    if (step === 1 && data.concerns.length === 0 && !data.concernOther.trim()) {
      return 'Choose at least one area, or describe it below.';
    }
    if (step === 2 && data.resources.length === 0) {
      return 'Choose at least one kind of support.';
    }
    return '';
  };

  const handleNext = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === 'string' ? err.error : 'Failed to save');
      }
      onComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {!started ? (
        <>
          <div className="flex flex-col gap-2">
            <Typography type="h2" weight="normal">
              A few questions
            </Typography>
            <Typography type="body-sm" color="muted">
              This helps match sessions to what you need. You can skip and change it later. We do
              not share your information.
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button size="sm" variant="ghost" className="-ms-2.5" onPress={onSkip}>
              Skip for now
            </Button>
            <Button size="sm" onPress={() => setStarted(true)}>
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <Typography type="h4" weight="normal">
              {current?.title}
            </Typography>
            <Typography type="body-sm" color="muted">
              {step === 0 && 'A little about you so sessions can address you by name.'}
              {step === 1 && 'What is showing up for you right now? You can choose more than one.'}
              {step === 2 && 'Tell us the kind of support that would feel useful.'}
              {step === 3 && 'This helps pace the work. You can change it later.'}
            </Typography>
          </div>

          <ProgressBar
            aria-label="Onboarding progress"
            value={progress}
            minValue={0}
            maxValue={100}
            color="accent"
            size="sm"
          >
            <div className="mb-1.5">
              <Typography type="body-xs" color="muted">
                Step {step + 1} of {ONBOARDING_STEPS.length}
              </Typography>
            </div>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>

          <div className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="onboarding-first-name" required>
                  First name
                </FieldLabel>
                <Input
                  id="onboarding-first-name"
                  fullWidth
                  autoComplete="given-name"
                  value={data.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  placeholder="Alex"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="onboarding-last-name">Last name</FieldLabel>
                <Input
                  id="onboarding-last-name"
                  fullWidth
                  autoComplete="family-name"
                  value={data.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  placeholder="Morgan"
                />
              </div>
            </div>

            <NumberField
              fullWidth
              isRequired
              minValue={18}
              maxValue={120}
              value={data.age ?? Number.NaN}
              onChange={(value) => update({ age: Number.isNaN(value) ? null : value })}
            >
              <FieldLabel>Age</FieldLabel>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="18+" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <OptionSelect
              label="Pronouns"
              placeholder="Select pronouns"
              selectedKey={data.pronouns}
              onChange={(key) => update({ pronouns: key as OnboardingPayload['pronouns'] })}
              items={ONBOARDING_PRONOUNS}
            />

            <OptionSelect
              label="How did you find QHRT?"
              placeholder="Select one"
              selectedKey={data.referral}
              onChange={(key) => update({ referral: key as OnboardingPayload['referral'] })}
              items={ONBOARDING_REFERRALS}
            />
          </>
        )}

        {step === 1 && (
          <>
            <CheckboxGroup
              value={data.concerns}
              onChange={(keys) =>
                update({ concerns: keys as OnboardingPayload['concerns'] })
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <FieldLabel className="sm:col-span-2" required>
                Problems you are facing
              </FieldLabel>
              {ONBOARDING_CONCERNS.map((item) => (
                <CheckRow key={item.id} value={item.id} label={item.label} />
              ))}
            </CheckboxGroup>

            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="onboarding-concern-other">Something else</FieldLabel>
              <Input
                id="onboarding-concern-other"
                fullWidth
                value={data.concernOther}
                onChange={(e) => update({ concernOther: e.target.value })}
                placeholder="Describe in your own words"
              />
            </div>

            <OptionSelect
              label="Sleep lately"
              placeholder="Select sleep quality"
              selectedKey={data.sleepQuality}
              onChange={(key) => update({ sleepQuality: key as OnboardingPayload['sleepQuality'] })}
              items={ONBOARDING_SLEEP}
            />

            <OptionSelect
              label="When things feel like too much"
              placeholder="What happens most often?"
              selectedKey={data.regulationIssue}
              onChange={(key) =>
                update({ regulationIssue: key as OnboardingPayload['regulationIssue'] })
              }
              items={ONBOARDING_REGULATION}
            />
          </>
        )}

        {step === 2 && (
          <>
            <CheckboxGroup
              value={data.resources}
              onChange={(keys) =>
                update({ resources: keys as OnboardingPayload['resources'] })
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <FieldLabel className="sm:col-span-2" required>
                Recommended resources
              </FieldLabel>
              {ONBOARDING_RESOURCES.map((item) => (
                <CheckRow key={item.id} value={item.id} label={item.label} />
              ))}
            </CheckboxGroup>

            <RadioGroup
              value={data.experience ?? undefined}
              onChange={(value) =>
                update({ experience: value as OnboardingPayload['experience'] })
              }
              className="flex flex-col gap-2"
            >
              <FieldLabel>Experience with this kind of work</FieldLabel>
              {ONBOARDING_EXPERIENCE.map((item) => (
                <Radio key={item.id} value={item.id}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    {item.label}
                  </Radio.Content>
                  <Description>{item.description}</Description>
                </Radio>
              ))}
            </RadioGroup>

            <OptionSelect
              label="When do you usually have time?"
              placeholder="Select a time of day"
              selectedKey={data.practiceTime}
              onChange={(key) =>
                update({ practiceTime: key as OnboardingPayload['practiceTime'] })
              }
              items={ONBOARDING_PRACTICE_TIMES}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-5">
              <ScaleSlider
                label="Stress"
                value={data.stress}
                onChange={(value) => update({ stress: value })}
              />
              <ScaleSlider
                label="Emotional intensity"
                value={data.emotionalIntensity}
                onChange={(value) => update({ emotionalIntensity: value })}
              />
              <ScaleSlider
                label="Body tension"
                value={data.bodyTension}
                onChange={(value) => update({ bodyTension: value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="onboarding-goals">What would you like to work on?</FieldLabel>
              <TextArea
                id="onboarding-goals"
                fullWidth
                rows={4}
                value={data.goals}
                onChange={(e) => update({ goals: e.target.value })}
                placeholder="Sleep more steadily, feel less on edge, have a private practice I can return to…"
              />
            </div>
          </>
        )}

        {error && (
          <Typography type="body-sm" className="text-danger">
            {error}
          </Typography>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => {
            setError('');
            if (step === 0) setStarted(false);
            else setStep(step - 1);
          }}
        >
          Back
        </Button>
        <Button size="sm" onPress={handleNext} isPending={loading} isDisabled={loading}>
          {step === ONBOARDING_STEPS.length - 1
            ? loading
              ? 'Saving…'
              : 'Finish'
            : 'Continue'}
        </Button>
      </div>
        </>
      )}
    </div>
  );
}
