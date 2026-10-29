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
        d="M28 28h76a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H64l-18 18v-18H28a12 12 0 0 1-12-12V40a12 12 0 0 1 12-12z"
        fill="var(--aid-sky)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="62" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="72" cy="62" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="92" cy="62" r="5" fill="currentColor" opacity="0.35" />
      <path
        d="M56 78h88a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12h-28v18l-18-18H56a12 12 0 0 1-12-12V90a12 12 0 0 1 12-12z"
        fill="var(--aid-mint)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="108" r="8" fill="currentColor" />
      <path
        d="M100 122v6"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TestimonyAid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={`${FRAME} ${className ?? ''}`} aria-hidden>
      <path
        d="M28 44h52c8 0 14 6 14 14v36c0 8-6 14-14 14H54l-18 16v-16H28c-8 0-14-6-14-14V58c0-8 6-14 14-14z"
        fill="var(--aid-peach)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M44 68c0-10 8-16 16-16v14c-4 0-6 2-6 6h-10zM62 68c0-10 8-16 16-16v14c-4 0-6 2-6 6h-10z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M80 62h52c8 0 14 6 14 14v36c0 8-6 14-14 14h-24l-16 16v-16H80c-8 0-14-6-14-14V76c0-8 6-14 14-14z"
        fill="var(--aid-sun)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M96 86c0-10 8-16 16-16v14c-4 0-6 2-6 6H96zM114 86c0-10 8-16 16-16v14c-4 0-6 2-6 6h-10z"
        fill="currentColor"
        opacity="0.28"
      />
    </svg>
  );
}
