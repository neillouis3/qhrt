'use client';

type Sense = 'see' | 'feel' | 'hear' | 'smell' | 'taste';

const FRAME = 'block size-full text-foreground';

export function SenseAid({ sense, className }: { sense: Sense; className?: string }) {
  const frame = className ?? 'size-[min(28vmin,9rem)]';
  switch (sense) {
    case 'see':
      return <SeeAid className={frame} />;
    case 'feel':
      return <FeelAid className={frame} />;
    case 'hear':
      return <HearAid className={frame} />;
    case 'smell':
      return <SmellAid className={frame} />;
    case 'taste':
      return <TasteAid className={frame} />;
  }
}

function SeeAid({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className}`} aria-hidden>
      <circle cx="80" cy="80" r="36" fill="var(--aid-sky)" />
      <ellipse cx="80" cy="80" rx="48" ry="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="80" cy="80" r="16" fill="currentColor" />
      <circle cx="86" cy="74" r="5" fill="white" opacity="0.85" />
    </svg>
  );
}

function FeelAid({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className}`} aria-hidden>
      <path
        d="M60 102
           C46 98 40 82 48 74
           C54 70 60 78 62 90
           C58 56 58 36 66 30
           C73 24 78 40 78 62
           C78 42 80 24 90 22
           C100 20 102 40 102 60
           C102 44 106 28 116 28
           C126 28 128 44 126 62
           C128 50 134 42 142 46
           C150 50 148 62 140 70
           C146 84 140 112 112 118
           C84 124 66 116 60 102Z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        transform="translate(-15 7)"
      />
    </svg>
  );
}

function HearAid({ className }: { className: string }) {
  const fill = 'var(--aid-lavender)';
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className}`} aria-hidden>
      <path
        d="M40 88c0-28 18-52 40-52s40 24 40 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect x="28" y="80" width="24" height="44" rx="12" fill={fill} stroke="currentColor" strokeWidth="2.5" />
      <rect x="108" y="80" width="24" height="44" rx="12" fill={fill} stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M40 92h8M112 92h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

function SmellAid({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className}`} aria-hidden>
      <circle cx="80" cy="62" r="22" fill="var(--aid-pink)" />
      <circle cx="58" cy="78" r="18" fill="var(--aid-rose)" />
      <circle cx="102" cy="78" r="18" fill="var(--aid-lavender)" />
      <circle cx="80" cy="80" r="12" fill="var(--aid-sun)" />
      <path
        d="M80 92c0 18-6 30-6 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M64 128c8-6 16-6 32 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TasteAid({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className}`} aria-hidden>
      <circle
        cx="80"
        cy="62"
        r="36"
        fill="var(--aid-rose)"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="68" cy="52" r="8" fill="white" opacity="0.45" />
      <path
        d="M56 90 L80 142 L104 90Z"
        fill="var(--aid-peach)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M66 106h28M70 120h20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

const MUSCLE_KEYS = ['Hands', 'Arms', 'Shoulders', 'Face', 'Belly', 'Legs', 'Feet'] as const;
export type MuscleGroupName = (typeof MUSCLE_KEYS)[number];

export function MuscleAid({
  group,
  phase,
  className,
}: {
  group: MuscleGroupName;
  phase: 'tense' | 'release';
  className?: string;
}) {
  const on = (name: MuscleGroupName) =>
    group === name
      ? phase === 'tense'
        ? 'oklch(0.72 0.09 28)'
        : 'oklch(0.78 0.08 170)'
      : 'color-mix(in oklab, currentColor 18%, transparent)';

  return (
    <svg
      viewBox="0 0 160 200"
      className={`text-foreground ${className ?? 'h-[min(34vmin,11rem)] w-auto'}`}
      aria-hidden
    >
      <circle cx="80" cy="28" r="16" fill={on('Face')} stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M58 52h44l8 18-10 8H60l-10-8z"
        fill={on('Shoulders')}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M44 68c-10 18-12 36-8 48"
        fill="none"
        stroke={on('Arms')}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M116 68c10 18 12 36 8 48"
        fill="none"
        stroke={on('Arms')}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="34" cy="122" r="9" fill={on('Hands')} />
      <circle cx="126" cy="122" r="9" fill={on('Hands')} />
      <rect
        x="60"
        y="70"
        width="40"
        height="44"
        rx="12"
        fill={on('Belly')}
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M66 116l-6 42M94 116l6 42"
        fill="none"
        stroke={on('Legs')}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M48 164h24M88 164h24"
        fill="none"
        stroke={on('Feet')}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BreatheAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`text-foreground ${className ?? 'size-16'}`} aria-hidden>
      <circle cx="80" cy="80" r="48" fill="var(--aid-sky)" />
      <circle cx="80" cy="80" r="28" fill="color-mix(in oklab, var(--aid-sky) 70%, var(--background))" />
      <circle cx="68" cy="70" r="10" fill="white" opacity="0.45" />
    </svg>
  );
}

export function MoonAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`text-foreground ${className ?? 'size-16'}`} aria-hidden>
      <path
        d="M92 34a46 46 0 1 0 12 86 38 38 0 1 1-12-86z"
        fill="var(--aid-paper)"
      />
      <circle cx="64" cy="72" r="6" fill="currentColor" opacity="0.12" />
      <circle cx="74" cy="96" r="9" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function SenseRow() {
  return (
    <div className="flex items-end justify-center gap-2 text-foreground" aria-hidden>
      {(['see', 'feel', 'hear', 'smell', 'taste'] as const).map((sense) => (
        <SenseAid key={sense} sense={sense} className="size-10" />
      ))}
    </div>
  );
}
