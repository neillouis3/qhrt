const WASH_TONES = ['meadow', 'bloom', 'dusk', 'mist'] as const;

export function washTone(seed: string) {
  let hash = 0;
  for (const char of seed) hash += char.charCodeAt(0);
  return WASH_TONES[hash % WASH_TONES.length] ?? 'meadow';
}

export default function CoverWash({
  seed,
  fill = false,
}: {
  seed: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`focus-card-wash focus-card-wash--${washTone(seed)}${fill ? ' focus-card-wash--fill' : ''}`}
      aria-hidden
    >
      <span className="focus-card-wash__blob focus-card-wash__blob--a" />
      <span className="focus-card-wash__blob focus-card-wash__blob--b" />
      <span className="focus-card-wash__blob focus-card-wash__blob--c" />
    </div>
  );
}
