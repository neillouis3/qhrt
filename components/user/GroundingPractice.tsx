'use client';

import { useState } from 'react';
import { Button, Input, Typography } from '@heroui/react';
import { GuideStage } from '@/components/user/GuideStage';
import { usePhaseTimer } from '@/components/user/usePhaseTimer';
import { SenseAid, SenseRow } from '@/components/user/WindDownAids';

const STEP_MS = 12000;

const STEPS = [
  { count: 5, sense: 'see', prompt: 'Look around. Name 5 things you can see.' },
  { count: 4, sense: 'feel', prompt: 'Notice 4 things you can physically feel.' },
  { count: 3, sense: 'hear', prompt: 'Listen for 3 things you can hear.' },
  { count: 2, sense: 'smell', prompt: 'Name 2 things you can smell.' },
  { count: 1, sense: 'taste', prompt: 'Name 1 thing you can taste.' },
] as const;

export default function GroundingPractice({ onFinished }: { onFinished?: () => void } = {}) {
  const [typed, setTyped] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [items, setItems] = useState<string[][]>([[], [], [], [], []]);
  const [draft, setDraft] = useState('');
  const current = STEPS[Math.min(step, STEPS.length - 1)]!;
  const named = items[step] ?? [];
  const done = typed != null && step >= STEPS.length;
  const practicing = typed != null && !done;
  const leftToName = current.count - named.length;
  const { fill, remaining } = usePhaseTimer(practicing, STEP_MS, () => setWaiting(true), step);
  const canContinue = waiting && (!typed || named.length >= current.count);

  const add = () => {
    const value = draft.trim();
    if (!value || named.length >= current.count) return;
    setItems((all) =>
      all.map((list, index) => (index === step ? [...list, value.slice(0, 48)] : list))
    );
    setDraft('');
  };

  const goNext = () => {
    if (!canContinue) return;
    setDraft('');
    setWaiting(false);
    setStep((index) => index + 1);
  };

  if (typed == null) {
    return (
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <Typography type="h3" weight="normal">
          Grounding
        </Typography>
        <SenseRow />
        <Typography type="body-sm" color="muted">
          Five senses, one at a time. Do you want to type what you notice, or just name them to yourself?
        </Typography>
        <div className="flex flex-col items-center gap-3">
          <Button variant="primary" onPress={() => setTyped(true)}>
            I want to type
          </Button>
          <button
            type="button"
            onClick={() => setTyped(false)}
            className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            I will name them to myself
          </button>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <SenseRow />
        <Typography type="h3" weight="normal">
          You are here
        </Typography>
        <Typography type="body-sm" color="muted">
          Five senses. Stay with that for a moment.
        </Typography>
        {onFinished ? (
          <Button variant="primary" onPress={onFinished}>
            Continue
          </Button>
        ) : null}
      </main>
    );
  }

  const nextLabel = step === STEPS.length - 1 ? 'Finish' : 'Continue';

  return (
    <GuideStage
      kicker={`${step + 1} of ${STEPS.length}`}
      title={current.prompt}
      prompt=""
      fill={fill}
      remaining={remaining}
      waiting={waiting}
      extra={
        typed ? (
          <div className="flex w-full flex-col gap-2">
            <ol className="flex flex-col gap-1.5 text-left">
              {Array.from({ length: current.count }, (_, index) => (
                <li
                  key={index}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    named[index] ? 'bg-default/40 text-foreground' : 'bg-default/20 text-muted'
                  }`}
                >
                  {named[index] ?? `${index + 1}`}
                </li>
              ))}
            </ol>
            {named.length < current.count ? (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  add();
                }}
              >
                <Input
                  fullWidth
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`A thing you can ${current.sense}`}
                  autoComplete="off"
                  autoFocus
                />
                <Button size="sm" variant="primary" type="submit" isDisabled={!draft.trim()}>
                  Add
                </Button>
              </form>
            ) : null}
            {leftToName > 0 ? (
              <Typography type="body-xs" color="muted">
                {leftToName} more {leftToName === 1 ? 'thing' : 'things'}
              </Typography>
            ) : null}
          </div>
        ) : null
      }
      action={
        canContinue ? (
          <Button variant="primary" onPress={goNext}>
            {nextLabel}
          </Button>
        ) : (
          <Typography type="body-xs" color="muted">
            {typed && named.length < current.count
              ? 'Name each thing, then continue when the count ends.'
              : 'Continue when the count ends.'}
          </Typography>
        )
      }
    >
      <SenseAid sense={current.sense} className="size-full" />
    </GuideStage>
  );
}
