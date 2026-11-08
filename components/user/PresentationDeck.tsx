'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import ProgressNav from '@/components/session/ProgressNav';
import { useSession } from '@/hooks/useSession';
import { speechFromSlide, type GuideStep } from '@/lib/modules';
import { writeStartingOutDone } from '@/lib/startingOut';

interface DeckPayload {
  module: { id: string; slug: string; title: string };
  lesson: { id: string; position: number; title: string; kind?: string; steps: GuideStep[] };
}

function speakInBrowser(text: string, onend: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onend();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 0.95;
  utterance.onend = onend;
  utterance.onerror = onend;
  window.speechSynthesis.speak(utterance);
}

export default function PresentationDeck({ payload }: { payload: DeckPayload }) {
  const router = useRouter();
  const { session } = useSession();
  const [index, setIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const playToken = useRef(0);

  const steps = payload.lesson.steps;
  const step = steps[index];
  const last = steps.length > 0 && index === steps.length - 1;

  const stopVoice = useCallback(() => {
    playToken.current += 1;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const playSlide = useCallback(
    async (slideIndex: number) => {
      if (!voiceOn) return;
      const slide = steps[slideIndex];
      if (!slide) return;
      const token = playToken.current + 1;
      playToken.current = token;
      const spoken = speechFromSlide(slide);
      if (!spoken) return;

      setSpeaking(true);
      try {
        const res = await fetch(
          `/api/modules/${encodeURIComponent(payload.module.slug)}/${payload.lesson.position}/voice?slide=${slideIndex}`
        );
        if (playToken.current !== token) return;
        if (res.ok && res.status === 200) {
          const blob = await res.blob();
          if (playToken.current !== token) return;
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          const audio = audioRef.current ?? new Audio();
          audioRef.current = audio;
          audio.src = url;
          audio.onended = () => {
            if (playToken.current === token) setSpeaking(false);
          };
          await audio.play();
          return;
        }
      } catch {
        // Browser speech is the fallback.
      }
      if (playToken.current !== token) return;
      speakInBrowser(spoken, () => {
        if (playToken.current === token) setSpeaking(false);
      });
    },
    [payload.lesson.position, payload.module.slug, steps, voiceOn]
  );

  useEffect(() => {
    if (voiceOn) void playSlide(index);
    else stopVoice();
    return () => stopVoice();
  }, [index, playSlide, stopVoice, voiceOn]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        if (!last) setIndex((value) => Math.min(steps.length - 1, value + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setIndex((value) => Math.max(0, value - 1));
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        setVoiceOn((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, steps.length]);

  const finish = async () => {
    if (finishing) return;
    stopVoice();
    setFinishing(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `/api/modules/${encodeURIComponent(payload.module.slug)}/${payload.lesson.position}`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not save this lesson.');
      }
      const userId = session?.user?.id;
      if (userId && payload.module.slug === 'qhrt-foundation' && payload.lesson.position === 1) {
        writeStartingOutDone(userId);
      }
      router.push(`/modules/${payload.module.slug}`);
    } catch (err) {
      setFinishing(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save this lesson.');
    }
  };

  const go = (next: number) => {
    stopVoice();
    setIndex(next);
  };

  const progress = (
    <ProgressNav
      items={steps.map((item, itemIndex) => ({
        id: String(itemIndex),
        index: String(itemIndex + 1),
        label: item.title,
        status: itemIndex < index ? 'complete' : itemIndex === index ? 'current' : 'upcoming',
      }))}
      onSelect={(id) => {
        const next = Number(id);
        if (next >= 0 && next < steps.length) go(next);
      }}
    />
  );

  if (!step) {
    return (
      <FocusSessionLayout progress={progress} progressLabel="Module">
        <Typography type="body-sm" color="muted">
          Loading…
        </Typography>
      </FocusSessionLayout>
    );
  }

  return (
    <FocusSessionLayout
      progressLabel={`${payload.module.title} · Module ${payload.lesson.position}`}
      progress={progress}
      leadingActions={
        index === 0 ? (
          <Link href={`/modules/${payload.module.slug}`} className={buttonVariants({ size: 'sm', variant: 'tertiary' })}>
            Leave
          </Link>
        ) : (
          <Button size="sm" variant="tertiary" onPress={() => go(index - 1)}>
            Back
          </Button>
        )
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onPress={() => setVoiceOn((value) => !value)}>
            {voiceOn ? 'Voice on' : 'Voice off'}
          </Button>
          {voiceOn ? (
            <Button size="sm" variant="ghost" onPress={() => void playSlide(index)}>
              {speaking ? 'Playing' : 'Play'}
            </Button>
          ) : null}
          {last ? (
            <Button size="sm" variant="primary" isPending={finishing} isDisabled={finishing} onPress={() => void finish()}>
              Continue
            </Button>
          ) : (
            <Button size="sm" variant="primary" onPress={() => go(index + 1)}>
              Next
            </Button>
          )}
        </div>
      }
    >
      <div className="flex min-h-[22rem] flex-col justify-center gap-6">
        {saveError ? <Typography type="body-sm">{saveError}</Typography> : null}
        <div className="flex items-baseline justify-between gap-3">
          <Typography type="body-xs" color="muted">
            {step.section || 'Introduction'}
          </Typography>
          <Typography type="body-xs" color="muted">
            {index + 1} / {steps.length}
          </Typography>
        </div>
        <Typography type="h1" weight="normal">
          {step.title}
        </Typography>
        {step.paragraphs.map((paragraph) => (
          <Typography key={paragraph} type="body" color="muted">
            {paragraph}
          </Typography>
        ))}
        {step.points.length > 0 ? (
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {step.points.map((point) => (
              <li key={point}>
                <Typography type="body">{point}</Typography>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FocusSessionLayout>
  );
}
