const FRAME = 'block size-full text-foreground';

export function SproutAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 220" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <path
        d="M18 188c36-14 62 10 102 0 40-10 68-16 104 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M120 188c2-36 0-78 0-118"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M120 122c-40-8-68 4-74 38 44 4 58-14 74-38z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M120 108c38-22 70-16 76 18-42 10-56-2-76-18z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <path
        d="M28 30h72a20 20 0 0 1 20 20v28a20 20 0 0 1-20 20H48l-22 16 6-16H28a20 20 0 0 1-20-20V50a20 20 0 0 1 20-20z"
        fill="var(--aid-sky)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="64" r="5" fill="currentColor" />
      <circle cx="66" cy="64" r="5" fill="currentColor" />
      <circle cx="82" cy="64" r="5" fill="currentColor" />
      <path
        d="M60 62h72a20 20 0 0 1 20 20v28a20 20 0 0 1-20 20h-28l6 16-22-16H60a20 20 0 0 1-20-20V82a20 20 0 0 1 20-20z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M96 80v16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="96" cy="108" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function TestimonyAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <path
        d="M28 34h72a20 20 0 0 1 20 20v28a20 20 0 0 1-20 20H48l-22 16 6-16H28a20 20 0 0 1-20-20V54a20 20 0 0 1 20-20z"
        fill="var(--aid-peach)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 62h72a20 20 0 0 1 20 20v28a20 20 0 0 1-20 20h-28l6 16-22-16H60a20 20 0 0 1-20-20V82a20 20 0 0 1 20-20z"
        fill="var(--aid-paper)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M90 80c0 0 10-4 12 8-6 2-8 6-8 10h-10c1-8 2-14 6-18zM110 80c0 0 10-4 12 8-6 2-8 6-8 10h-10c1-8 2-14 6-18z"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}
