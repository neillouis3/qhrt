'use client';

import { useState } from 'react';
import { Button, Typography } from '@heroui/react';
import { GuideStage } from '@/components/user/GuideStage';
import { usePhaseTimer } from '@/components/user/usePhaseTimer';
import { MuscleAid } from '@/components/user/WindDownAids';

const TENSE_MS = 5000;
const RELEASE_MS = 6000;

const GROUPS = [
  { name: 'Hands', tense: 'Make fists.', release: 'Open your hands. Notice the warmth.' },
  { name: 'Arms', tense: 'Tighten your arms.', release: 'Let your arms hang. Notice the drop.' },
  { name: 'Shoulders', tense: 'Lift your shoulders toward your ears.', release: 'Let them fall. Notice the space.' },
  { name: 'Face', tense: 'Gently tighten your jaw and brow.', release: 'Soften. Unclench.' },
  { name: 'Belly', tense: 'Draw your belly in softly.', release: 'Let the breath be easy.' },
  { name: 'Legs', tense: 'Press your thighs together.', release: 'Release. Feel the weight in the chair.' },
  { name: 'Feet', tense: 'Curl your toes.', release: 'Let them rest. Notice the floor.' },
] as const;

type Phase = 'tense' | 'release';

export default function MuscleRelaxPractice({ onFinished }: { onFinished?: () => void } = {}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('tense');
  const [waiting, setWaiting] = useState(false);
  const done = started && index >= GROUPS.length;
  const group = GROUPS[Math.min(index, GROUPS.length - 1)]!;
  const duration = phase === 'tense' ? TENSE_MS : RELEASE_MS;
  const running = started && !done;
  const { fill, remaining } = usePhaseTimer(
    running,
    duration,
    () => {
      if (phase === 'tense') {
        setPhase('release');
        return;
      }
      setWaiting(true);
    },
    `${index}-${phase}`
  );

  const continueNext = () => {
    setWaiting(false);
    setPhase('tense');
    setIndex((value) => value + 1);
  };

  if (done) {
    return (
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <MuscleAid group="Shoulders" phase="release" />
        <Typography type="h3" weight="normal">
          Soft now
        </Typography>
        <Typography type="body-sm" color="muted">
          You tensed and released. Stay with the quiet in your body.
        </Typography>
        {onFinished ? (
          <Button variant="primary" onPress={onFinished}>
            Continue
          </Button>
        ) : null}
      </main>
    );
  }

  if (!started) {
    return (
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <Typography type="h3" weight="normal">
          Muscles
        </Typography>
        <MuscleAid group="Shoulders" phase="release" />
        <Typography type="body-sm" color="muted">
          Tense a group for five seconds, then let go. Click to start. Follow the count.
        </Typography>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Start
        </button>
      </main>
    );
  }

  return (
    <GuideStage
      kicker={`${index + 1} of ${GROUPS.length} · ${phase === 'tense' ? 'tense' : 'release'}`}
      title={group.name}
      prompt={phase === 'tense' ? group.tense : group.release}
      fill={fill}
      remaining={remaining}
      waiting={waiting}
      action={
        waiting ? (
          <Button variant="primary" onPress={continueNext}>
            {phase === 'release' && index === GROUPS.length - 1 ? 'Finish' : 'Continue'}
          </Button>
        ) : (
          <Typography type="body-xs" color="muted">
            {phase === 'tense' ? 'Hold, then let go.' : 'Continue when the count ends.'}
          </Typography>
        )
      }
    >
      <MuscleAid group={group.name} phase={phase} className="h-full w-auto" />
    </GuideStage>
  );
}
