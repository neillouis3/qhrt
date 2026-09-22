export type HomeTimePeriod = 'morning' | 'afternoon' | 'night';

export interface HomeSkyBlend {
  /** Deep blue night — 0–1 */
  night: number;
  /** Sunrise / sunset warmth — 0–1 */
  dawn: number;
  /** Midday yellow — 0–1 */
  day: number;
  /** Afternoon orange — 0–1 */
  afternoon: number;
}

type SkyStop = { t: number } & HomeSkyBlend;

/** Minutes from midnight → blend weights (smooth sunrise ~5–7, sunset ~17–21). */
const SKY_STOPS: SkyStop[] = [
  { t: 0, night: 1, dawn: 0, day: 0, afternoon: 0 },
  { t: 4 * 60, night: 1, dawn: 0, day: 0, afternoon: 0 },
  { t: 5 * 60, night: 0.9, dawn: 0.2, day: 0.05, afternoon: 0 },
  { t: 6 * 60, night: 0.32, dawn: 0.5, day: 0.55, afternoon: 0.08 },
  { t: 7 * 60, night: 0.06, dawn: 0.22, day: 0.88, afternoon: 0.1 },
  { t: 9 * 60, night: 0, dawn: 0.06, day: 1, afternoon: 0.18 },
  { t: 12 * 60, night: 0, dawn: 0, day: 0.78, afternoon: 0.52 },
  { t: 15 * 60, night: 0, dawn: 0, day: 0.42, afternoon: 0.88 },
  { t: 17 * 60, night: 0, dawn: 0.05, day: 0.22, afternoon: 1 },
  { t: 18 * 60, night: 0.12, dawn: 0.38, day: 0.18, afternoon: 0.78 },
  { t: 19 * 60, night: 0.4, dawn: 0.32, day: 0.08, afternoon: 0.48 },
  { t: 20 * 60, night: 0.72, dawn: 0.15, day: 0, afternoon: 0.18 },
  { t: 21 * 60, night: 0.9, dawn: 0.05, day: 0, afternoon: 0.05 },
  { t: 24 * 60, night: 1, dawn: 0, day: 0, afternoon: 0 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function homeSkyBlend(date: Date): HomeSkyBlend {
  const minutes = minutesSinceMidnight(date);
  let i = 0;
  while (i < SKY_STOPS.length - 1 && SKY_STOPS[i + 1]!.t <= minutes) i += 1;
  const a = SKY_STOPS[i]!;
  const b = SKY_STOPS[Math.min(i + 1, SKY_STOPS.length - 1)]!;
  if (a.t === b.t || minutes >= b.t) return { ...b };
  const f = (minutes - a.t) / (b.t - a.t);
  return {
    night: lerp(a.night, b.night, f),
    dawn: lerp(a.dawn, b.dawn, f),
    day: lerp(a.day, b.day, f),
    afternoon: lerp(a.afternoon, b.afternoon, f),
  };
}

/** UI bucket (not used for sky color — see `homeSkyBlend`). */
export function homeTimePeriod(date: Date): HomeTimePeriod {
  const hour = date.getHours();
  if (hour < 5 || hour >= 21) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'night';
}

export type HomeTimeLabelKey = 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening';

export function homeTimeLabelKey(date: Date): HomeTimeLabelKey {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 6) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function homeTimePeriodLabel(date: Date): string {
  const key = homeTimeLabelKey(date);
  const labels: Record<HomeTimeLabelKey, string> = {
    night: 'Night',
    dawn: 'Dawn',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  };
  return labels[key];
}

export function homeSkyGlobOpacity(blend: HomeSkyBlend): number {
  const peak = Math.max(blend.night, blend.dawn, blend.day, blend.afternoon);
  return 0.22 + peak * 0.38;
}

/** Indicator dot color from current blend. */
export function homeSkyDotColor(blend: HomeSkyBlend): string {
  const r =
    blend.night * 59 +
    blend.dawn * 255 +
    blend.day * 255 +
    blend.afternoon * 255;
  const g =
    blend.night * 90 +
    blend.dawn * 183 +
    blend.day * 213 +
    blend.afternoon * 152;
  const b =
    blend.night * 219 +
    blend.dawn * 77 +
    blend.day * 79 +
    blend.afternoon * 0;
  const w = blend.night + blend.dawn + blend.day + blend.afternoon + 0.001;
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n / w)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function formatHomeClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
