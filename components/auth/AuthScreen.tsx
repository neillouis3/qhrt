'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Typography } from '@heroui/react';
import LoginForm from '@/components/auth/LoginForm';
import OnboardingWizard from '@/components/auth/OnboardingWizard';
import { clearSessionCache } from '@/hooks/useSession';

interface AuthScreenProps {
  mode: 'login' | 'signup';
}

type SignupPhase = 'auth' | 'transition' | 'onboarding';

const WELCOME_TITLE = 'Welcome.';
const WELCOME_SUBTITLE = "We're glad you're here.";

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function SignupWelcomeTypeLine({
  text,
  active,
  speed,
  onDone,
}: {
  text: string;
  active: boolean;
  speed: number;
  onDone?: () => void;
}) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setCount(0);
      doneRef.current = false;
      return;
    }

    if (prefersReducedMotion()) {
      setCount(text.length);
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }

    if (count >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }

    const delay = count === 0 ? 480 : speed;
    const timer = window.setTimeout(() => setCount((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [active, count, speed, text]);

  const visible = text.slice(0, count);
  const rest = text.slice(count);
  const typing = active && count < text.length;

  return (
    <span>
      {visible}
      {typing ? <span className="signup-welcome__caret" aria-hidden /> : null}
      {rest ? (
        <span className="invisible" aria-hidden>
          {rest}
        </span>
      ) : null}
    </span>
  );
}

function SignupWelcome({ onDone }: { onDone: () => void }) {
  const [titleDone, setTitleDone] = useState(false);
  const [subtitleActive, setSubtitleActive] = useState(false);
  const [subtitleDone, setSubtitleDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!titleDone) return;
    if (prefersReducedMotion()) {
      setSubtitleActive(true);
      return;
    }
    const timer = window.setTimeout(() => setSubtitleActive(true), 400);
    return () => window.clearTimeout(timer);
  }, [titleDone]);

  useEffect(() => {
    if (!subtitleDone) return;
    const hold = prefersReducedMotion() ? 700 : 2200;
    const timer = window.setTimeout(() => onDoneRef.current(), hold);
    return () => window.clearTimeout(timer);
  }, [subtitleDone]);

  return (
    <div className="signup-welcome flex flex-col items-start gap-8">
      <div className="flex flex-col gap-2">
        <Typography type="h2" weight="normal">
          <SignupWelcomeTypeLine text={WELCOME_TITLE} active speed={78} onDone={() => setTitleDone(true)} />
        </Typography>
        <Typography type="body-sm" color="muted">
          <SignupWelcomeTypeLine
            text={WELCOME_SUBTITLE}
            active={subtitleActive}
            speed={36}
            onDone={() => setSubtitleDone(true)}
          />
        </Typography>
      </div>
    </div>
  );
}

export default function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [phase, setPhase] = useState<SignupPhase>('auth');
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const [fromWelcome, setFromWelcome] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const isLogin = mode === 'login';
  const illustrationVisible = isLogin || phase === 'auth';
  const showWelcome = !isLogin && (phase === 'transition' || welcomeLeaving);
  const showOnboarding = !isLogin && (phase === 'onboarding' || welcomeLeaving);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (!data.user) return;
          const role = data.role ?? 'user';
          if (role === 'admin') {
            router.push('/dashboard');
            return;
          }
          if (mode === 'signup' && !data.intakeCompleted) {
            setPhase('onboarding');
            setChecking(false);
            return;
          }
          router.push('/home');
          return;
        }
      } catch {
        // Not logged in
      } finally {
        setChecking(false);
      }
    };
    checkSession();

    return () => {
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [mode, router]);

  const goHome = () => {
    clearSessionCache();
    router.push('/home');
  };

  const handleWelcomeDone = () => {
    if (welcomeLeaving || phase === 'onboarding') return;

    if (prefersReducedMotion()) {
      setPhase('onboarding');
      return;
    }

    setFromWelcome(true);
    setWelcomeLeaving(true);
    leaveTimer.current = window.setTimeout(() => {
      setPhase('onboarding');
      setWelcomeLeaving(false);
    }, 1200);
  };

  const handleSuccess = async () => {
    clearSessionCache();

    if (mode === 'signup') {
      setPhase('transition');
      return;
    }

    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const role = data.role ?? 'user';
          router.push(role === 'admin' ? '/dashboard' : '/home');
          return;
        }
      }
    } catch {
      // Fallback to home on error
    }
    router.push('/home');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Typography type="body-sm" color="muted">
          Checking session…
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      <div className="flex min-h-screen min-w-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-16 sm:px-10">
        <div
          className={`mx-auto flex w-full flex-col gap-8 transition-[max-width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isLogin || phase === 'auth' ? 'max-w-sm' : 'max-w-md'
          }`}
        >
          {isLogin || phase === 'auth' ? (
            <>
              <div className="flex flex-col gap-2">
                <Typography type="h2" weight="normal">
                  {isLogin ? 'Sign in' : 'Create an account'}
                </Typography>
                <Typography type="body-sm" color="muted">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Link
                    href={isLogin ? '/signup' : '/login'}
                    className="text-brand hover:opacity-80"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Link>
                </Typography>
              </div>
              <LoginForm mode={mode} onSuccess={handleSuccess} />
            </>
          ) : (
            <div className="signup-stage">
              {showWelcome ? (
                <div
                  className={`signup-stage__pane signup-stage__welcome ${
                    welcomeLeaving ? 'is-leave' : ''
                  }`}
                  aria-hidden={welcomeLeaving || undefined}
                >
                  <SignupWelcome onDone={handleWelcomeDone} />
                </div>
              ) : null}
              {showOnboarding ? (
                <div
                  className={`signup-stage__pane signup-stage__onboarding ${
                    fromWelcome ? 'is-enter' : ''
                  }`}
                >
                  <OnboardingWizard onComplete={goHome} onSkip={goHome} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <aside
        aria-hidden={!illustrationVisible}
        className={`auth-illustration-panel hidden lg:block ${illustrationVisible ? '' : 'is-away'}`}
      >
        <div className="relative h-full overflow-hidden rounded-lg">
          <Image
            src="/auth-illustration.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="surface-grain-overlay" aria-hidden />
        </div>
      </aside>
    </div>
  );
}
