'use client';

import { useState, type ReactNode } from 'react';
import { Button, Input, Label, TextField, Typography } from '@heroui/react';
import type { LandingGrainTone } from '@/components/marketing/LandingIcons';

const steps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up in minutes. Then pick what you want to work on — sleep, stress, habits, or whatever you add next.',
    tone: 'bloom' as LandingGrainTone,
  },
  {
    step: '02',
    title: 'Take a focus-area check-in',
    description:
      'Each focus area has its own questions. Some follow-ups only appear when they apply — try answering this Sleep sample.',
    tone: 'meadow' as LandingGrainTone,
  },
  {
    step: '03',
    title: 'Open a matching workbook',
    description:
      'Your answers route you to coaching workbooks for that topic — not a diagnosis. Tap a card to preview the result.',
    tone: 'sunset' as LandingGrainTone,
  },
];

function PreviewStage({
  tone,
  label,
  children,
}: {
  tone: LandingGrainTone;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="how-it-works-stage flex items-center justify-center p-4 sm:p-5" role="group" aria-label={label}>
      <div
        className={`how-it-works-stage__blur landing-grain-bg landing-grain--${tone}`}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[17.75rem] rounded-xl bg-background/70 p-4 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-foreground/8 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

function AccountPreview() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [welcome, setWelcome] = useState(false);
  const isSignup = mode === 'signup';

  if (welcome) {
    return (
      <div className="flex flex-col gap-3">
        <Typography type="h5" weight="normal">
          Welcome.
        </Typography>
        <Typography type="body-sm" color="muted">
          We&apos;re glad you&apos;re here.
        </Typography>
        <Button size="sm" variant="outline" onPress={() => setWelcome(false)}>
          Back to form
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setWelcome(true);
      }}
    >
      <div className="flex flex-col gap-1">
        <Typography type="h5" weight="normal">
          {isSignup ? 'Create an account' : 'Sign in'}
        </Typography>
        <Typography type="body-xs" color="muted">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            className="text-brand hover:opacity-80"
            onClick={() => setMode(isSignup ? 'login' : 'signup')}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </Typography>
      </div>
      <TextField name="how-it-works-email" type="email" fullWidth>
        <Label>Email</Label>
        <Input
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </TextField>
      <TextField name="how-it-works-password" type="password" fullWidth>
        <Label>Password</Label>
        <Input
          autoComplete="off"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </TextField>
      <Button type="submit" size="sm" variant="primary" fullWidth>
        {isSignup ? 'Create account' : 'Sign in'}
      </Button>
      <Typography type="body-xs" color="muted">
        Preview only — nothing is submitted.
      </Typography>
    </form>
  );
}

const sleepQuestions = [
  {
    key: 'falling_asleep_difficulty',
    text: 'Do you have difficulty falling asleep?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    key: 'falling_asleep_time',
    text: 'Approximately how long does it usually take you to fall asleep?',
    showIfYes: true,
    options: [
      { value: 'under_15_min', label: 'Less than 15 minutes' },
      { value: '15_to_30_min', label: '15 to 30 minutes' },
      { value: '30_to_60_min', label: '30 to 60 minutes' },
      { value: 'over_60_min', label: 'More than 60 minutes' },
    ],
  },
] as const;

function OptionList({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
              selected ? 'bg-primary/12 text-foreground' : 'bg-default/40 text-foreground/80 hover:bg-default/60'
            }`}
          >
            <span
              className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                selected ? 'border-primary' : 'border-foreground/25'
              }`}
              aria-hidden
            >
              {selected ? <span className="size-1.5 rounded-full bg-primary" /> : null}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SleepPreview() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const visible = sleepQuestions.filter((question) => {
    if ('showIfYes' in question && question.showIfYes) {
      return answers.falling_asleep_difficulty === 'yes';
    }
    return true;
  });
  const question = visible[Math.min(index, Math.max(visible.length - 1, 0))];
  const answer = question ? (answers[question.key] ?? '') : '';
  const isLast = index >= visible.length - 1;

  if (done || !question) {
    const fallingAsleep = answers.falling_asleep_difficulty === 'yes';
    return (
      <div className="flex flex-col gap-3">
        <Typography type="body-xs" color="muted">
          Sleep habits check-in
        </Typography>
        <Typography type="h5" weight="normal">
          {fallingAsleep ? 'Falling asleep' : 'Steady rest'}
        </Typography>
        <Typography type="body-xs" color="muted">
          {fallingAsleep
            ? 'Settling down at night stood out. A wind-down routine is a good place to start.'
            : 'No single area stood out. Keep your routine steady.'}
        </Typography>
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            setAnswers({});
            setIndex(0);
            setDone(false);
          }}
        >
          Retake
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-default/40">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((index + 1) / visible.length) * 100}%` }}
          />
        </div>
        <Typography type="body-xs" color="muted">
          Question {index + 1} of {visible.length}
        </Typography>
      </div>
      <Typography type="body-sm">{question.text}</Typography>
      <OptionList
        name={question.text}
        value={answer}
        options={question.options}
        onChange={(value) => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="tertiary"
          isDisabled={index === 0}
          onPress={() => setIndex((current) => Math.max(0, current - 1))}
        >
          Back
        </Button>
        <Button
          size="sm"
          variant="primary"
          isDisabled={!answer}
          onPress={() => {
            if (isLast) setDone(true);
            else setIndex((current) => current + 1);
          }}
        >
          {isLast ? 'See my workbooks' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

const demoWorkbooks = [
  {
    id: 'wind-down',
    title: 'Wind-Down Routine Builder',
    description: 'Habit stacks for the hour before bed.',
  },
  {
    id: 'digital-sunset',
    title: 'Digital Sunset Checklist',
    description: 'Screen habits for the last 30 minutes before sleep.',
  },
] as const;

function WorkbookPreview() {
  const [selected, setSelected] = useState<string>(demoWorkbooks[0].id);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Typography type="h5" weight="normal">
          Falling asleep
        </Typography>
        <Typography type="body-xs" color="muted">
          Settling down at night stood out most. Try a workbook:
        </Typography>
      </div>
      <div className="flex flex-col gap-2">
        {demoWorkbooks.map((workbook) => {
          const active = selected === workbook.id;
          return (
            <button
              key={workbook.id}
              type="button"
              onClick={() => setSelected(workbook.id)}
              className={`rounded-lg p-3 text-left transition-colors ${
                active ? 'bg-primary/12 ring-1 ring-primary/30' : 'bg-default/40 hover:bg-default/55'
              }`}
            >
              <Typography type="body-sm">{workbook.title}</Typography>
              <Typography type="body-xs" color="muted">
                {workbook.description}
              </Typography>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const previews = [AccountPreview, SleepPreview, WorkbookPreview];

export default function HowItWorks() {
  return (
    <section className="flex flex-col gap-10 py-24">
      <Typography type="h4" weight="normal">
        How it works
      </Typography>
      <ol className="flex flex-col gap-16 lg:gap-24">
        {steps.map((item, index) => {
          const Preview = previews[index] ?? AccountPreview;
          const previewFirst = index % 2 === 1;
          return (
            <li
              key={item.step}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div className="flex max-w-md flex-col gap-3">
                <Typography type="body-xs" color="muted">
                  {item.step}
                </Typography>
                <Typography type="h4" weight="normal">
                  {item.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                  {item.description}
                </Typography>
              </div>
              <div className={previewFirst ? 'lg:order-first' : undefined}>
                <PreviewStage tone={item.tone} label={`Interactive preview: ${item.title}`}>
                  <Preview />
                </PreviewStage>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
