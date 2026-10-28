import type { TutorialStepId } from '@/lib/home';

const FRAME = 'block size-full text-foreground';

function FoundationAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <circle cx="80" cy="22" r="4" fill="var(--aid-peach)" stroke="currentColor" strokeWidth="2" />
      <path
        d="M72 42h16l-3 10H75z"
        fill="var(--aid-paper)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 60h32l-6 12H70z"
        fill="var(--aid-peach)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M52 82h56l-8 16H60z"
        fill="var(--aid-sky)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 110h88l-12 22H48z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OnboardingAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <path
        d="M50 48H68A16 16 0 0 1 100 48H118V70A16 16 0 0 0 118 102V124H50V102A16 16 0 0 1 50 70Z"
        fill="var(--aid-sky)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AssessmentAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <rect
        x="40"
        y="36"
        width="80"
        height="108"
        rx="12"
        fill="var(--aid-paper)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect x="62" y="24" width="36" height="22" rx="6" fill="var(--aid-sky)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="80" cy="28" r="4" fill="currentColor" />
      <rect x="54" y="62" width="16" height="16" rx="3" fill="var(--aid-mint)" stroke="currentColor" strokeWidth="2" />
      <rect x="54" y="86" width="16" height="16" rx="3" fill="var(--aid-mint)" stroke="currentColor" strokeWidth="2" />
      <rect x="54" y="110" width="16" height="16" rx="3" fill="var(--aid-mint)" stroke="currentColor" strokeWidth="2" />
      <path
        d="M57 70l4 4 7-8M57 94l4 4 7-8M57 118l4 4 7-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M78 68h28M78 76h18M78 92h28M78 100h18M78 116h28M78 124h18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function DiaryAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <rect x="116" y="50" width="16" height="18" rx="3" fill="var(--aid-sun)" />
      <rect x="116" y="72" width="16" height="18" rx="3" fill="var(--aid-mint)" />
      <rect x="116" y="94" width="16" height="18" rx="3" fill="var(--aid-rose)" />
      <path d="M78 132v16l8-5 8 5v-16" fill="var(--aid-sun)" />
      <rect
        x="38"
        y="26"
        width="84"
        height="108"
        rx="10"
        fill="var(--aid-sky)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect x="62" y="42" width="48" height="26" rx="4" fill="var(--aid-paper)" stroke="currentColor" strokeWidth="2" />
      <path
        d="M68 92c8 5 16-5 24 0s16-5 24 0M68 108c8 5 16-5 24 0s16-5 24 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="40" cy="42" r="6" fill="currentColor" />
      <circle cx="40" cy="60" r="6" fill="currentColor" />
      <circle cx="40" cy="78" r="6" fill="currentColor" />
      <circle cx="40" cy="96" r="6" fill="currentColor" />
      <circle cx="40" cy="114" r="6" fill="currentColor" />
    </svg>
  );
}

export function CheckInAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <circle cx="80" cy="80" r="32" fill="var(--aid-sun)" />
      <path
        d="M80 28v12M80 120v12M28 80h12M120 80h12"
        stroke="var(--aid-sun)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TutorialAid({
  id,
  className,
}: {
  id: TutorialStepId;
  className?: string;
}) {
  const frame = className ?? 'size-16';
  if (id === 'starting-out') return <FoundationAid className={frame} />;
  if (id === 'onboarding') return <OnboardingAid className={frame} />;
  if (id === 'assessment') return <AssessmentAid className={frame} />;
  return <DiaryAid className={frame} />;
}
