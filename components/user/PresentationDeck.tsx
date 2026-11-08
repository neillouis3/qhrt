'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon, FullScreenIcon } from '@hugeicons/core-free-icons';
import FocusSessionLayout from '@/components/layout/FocusSessionLayout';
import ProgressNav from '@/components/session/ProgressNav';
import Modal from '@/components/ui/Modal';
import { useSession } from '@/hooks/useSession';
import { speechFromSlide, type GuideStep } from '@/lib/modules';
import SlideStage from '@/components/slides/SlideStage';
import { writeStartingOutDone } from '@/lib/startingOut';

interface DeckPayload {
  module: { id: string; slug: string; title: string };
  lesson: { id: string; position: number; title: string; kind?: string; steps: GuideStep[] };
}

const VOICE_RATES = [
  { id: 'slower', label: 'Slower', rate: 0.85 },
  { id: 'natural', label: 'Natural', rate: 0.95 },
  { id: 'faster', label: 'Faster', rate: 1.1 },
] as const;

type VoiceRateId = (typeof VOICE_RATES)[number]['id'];

function speakInBrowser(text: string, rate: number, onend: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onend();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 0.95;
  utterance.onend = onend;
  utterance.onerror = onend;
  window.speechSynthesis.speak(utterance);
}

function ThemeSetting() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="flex flex-col gap-2">
      <Typography type="body-sm" color="muted">
        Theme
      </Typography>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!isDark ? 'primary' : 'tertiary'} onPress={() => setTheme('light')}>
          Light
        </Button>
        <Button size="sm" variant={isDark ? 'primary' : 'tertiary'} onPress={() => setTheme('dark')}>
          Dark
        </Button>
      </div>
    </div>
  );
}

export default function PresentationDeck({ payload }: { payload: DeckPayload }) {
  const router = useRouter();
  const { session } = useSession();
  const [index, setIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [voiceRate, setVoiceRate] = useState<VoiceRateId>('natural');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [full, setFull] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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
      const rate = VOICE_RATES.find((item) => item.id === voiceRate)?.rate ?? 0.95;

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
          audio.playbackRate = rate;
          audio.onended = () => {
            if (playToken.current !== token) return;
            setSpeaking(false);
            if (autoNext && slideIndex < steps.length - 1) setIndex(slideIndex + 1);
          };
          await audio.play();
          return;
        }
      } catch {
        // Browser speech is the fallback.
      }
      if (playToken.current !== token) return;
      speakInBrowser(spoken, rate, () => {
        if (playToken.current !== token) return;
        setSpeaking(false);
        if (autoNext && slideIndex < steps.length - 1) setIndex(slideIndex + 1);
      });
    },
    [autoNext, payload.lesson.position, payload.module.slug, steps, voiceOn, voiceRate]
  );

  useEffect(() => {
    if (!autoNext || voiceOn || last) return;
    const timer = window.setTimeout(() => {
      setIndex((value) => Math.min(steps.length - 1, value + 1));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [autoNext, index, last, steps.length, voiceOn]);

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
      const handsOff = steps[steps.length - 1]?.key === 'selected-theme' || steps[steps.length - 1]?.key === 'guided-reflection';
      router.push(handsOff ? `/modules/${payload.module.slug}/themes` : `/modules/${payload.module.slug}`);
    } catch (err) {
      setFinishing(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save this lesson.');
    }
  };

  const go = (next: number) => {
    stopVoice();
    setIndex(next);
  };

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement == null) setFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!full) return;
    const node = stageRef.current;
    if (node && document.fullscreenElement !== node) {
      void node.requestFullscreen().catch(() => {});
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.fullscreenElement) return;
      setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [full]);

  const exitFull = async () => {
    setFull(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The overlay closes either way.
      }
    }
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
      <FocusSessionLayout showTheme={false} progress={progress} progressLabel="Module">
        <Typography type="body-sm" color="muted">
          Loading…
        </Typography>
      </FocusSessionLayout>
    );
  }

  return (
    <div ref={stageRef} className={full ? 'fixed inset-0 z-[80] h-screen w-screen' : 'contents'}>
    <FocusSessionLayout
      wide
      immersive={full}
      showTheme={false}
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
          {full ? (
            <span className="px-1 text-xs text-muted">
              {index + 1} / {steps.length}
            </span>
          ) : (
            <Button size="sm" variant="ghost" aria-label="Full screen" onPress={() => setFull(true)}>
              <HugeiconsIcon icon={FullScreenIcon} size={18} strokeWidth={1.5} />
            </Button>
          )}
          <Button size="sm" variant="ghost" aria-label="Settings" onPress={() => setSettingsOpen(true)}>
            <HugeiconsIcon icon={Settings01Icon} size={18} strokeWidth={1.5} />
          </Button>
          {last ? (
            <Button size="sm" variant="primary" isPending={finishing} isDisabled={finishing} onPress={() => void finish()}>
              {step.key === 'selected-theme' ? 'Choose a perspective' : 'Continue'}
            </Button>
          ) : (
            <Button size="sm" variant="primary" onPress={() => go(index + 1)}>
              Next
            </Button>
          )}
          {full ? (
            <Button size="sm" variant="ghost" onPress={() => void exitFull()}>
              Exit
            </Button>
          ) : null}
        </div>
      }
    >
      <div className={`flex flex-col justify-center ${full ? 'w-full' : 'min-h-[22rem] gap-6'}`}>
        {saveError ? <Typography type="body-sm">{saveError}</Typography> : null}
        {(step.blocks?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-3">
            {full ? null : (
            <div className="flex justify-end">
              <Typography type="body-xs" color="muted">
                {index + 1} / {steps.length}
              </Typography>
            </div>
            )}
            <SlideStage
              background={step.background}
              blocks={step.blocks ?? []}
              flush={(step.blocks ?? []).some((block) => block.type === 'image' && block.w >= 900 && block.h >= 500)}
            />
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <Typography type="body-xs" color="muted">
                {step.section || 'Presentation'}
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
          </>
        )}
      </div>
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="sm">
        <div className="flex flex-col gap-5">
          <ThemeSetting />
          <div className="flex flex-col gap-1">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Automatic next</span>
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(event) => setAutoNext(event.target.checked)}
              />
            </label>
            <Typography type="body-xs" color="muted">
              Moves on when the reading ends. With voice off, it waits a few seconds.
            </Typography>
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Read each slide aloud</span>
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(event) => setVoiceOn(event.target.checked)}
            />
          </label>
          <div className="flex flex-col gap-2">
            <Typography type="body-sm" color="muted">
              Speed
            </Typography>
            <div className="flex flex-wrap gap-2">
              {VOICE_RATES.map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={voiceRate === item.id ? 'primary' : 'tertiary'}
                  onPress={() => setVoiceRate(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              isDisabled={!voiceOn}
              onPress={() => {
                if (speaking) stopVoice();
                else void playSlide(index);
              }}
            >
              {speaking ? 'Stop' : 'Play this slide'}
            </Button>
          </div>
        </div>
      </Modal>
    </FocusSessionLayout>
    </div>
  );
}
