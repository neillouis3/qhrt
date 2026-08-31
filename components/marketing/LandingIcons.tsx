'use client';

import Image from 'next/image';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export type LandingGrainTone = 'bloom' | 'meadow' | 'sunset' | 'mist' | 'dusk';

/** Product UI mocks on grainy gradient — How it works */
export const HOW_IT_WORKS_SIGN_IN_PREVIEW = '/how-it-works-sign-in-preview.jpg';
export const HOW_IT_WORKS_SLEEP_PREVIEW = '/how-it-works-sleep-preview.jpg';

const grainImagePosition: Record<LandingGrainTone, string> = {
  bloom: '50% 50%',
  meadow: '50% 45%',
  sunset: '82% 50%',
  mist: '28% 42%',
  dusk: '74% 58%',
};

export function LandingIcon({
  icon,
  size = 20,
  className,
}: {
  icon: IconSvgElement;
  size?: number;
  className?: string;
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} className={className} />;
}

export function IllustrationPlaceholder({
  icon,
  label,
  className = '',
  iconSize = 64,
  grainTone = 'meadow',
  imageSrc = null,
  imageFit = 'cover',
  grainOverlay = true,
}: {
  icon?: IconSvgElement;
  label: string;
  className?: string;
  iconSize?: number;
  grainTone?: LandingGrainTone;
  /** Full-bleed photo (no icon). Omit for CSS grain + optional icon */
  imageSrc?: string | null;
  imageFit?: 'cover' | 'contain';
  grainOverlay?: boolean;
}) {
  const usePhoto = imageSrc != null && imageSrc.length > 0;

  return (
    <div
      role="img"
      aria-label={label}
      className={`landing-grain-bg ${usePhoto ? 'landing-grain-bg--photo' : `landing-grain--${grainTone}`} flex items-center justify-center rounded-lg ${className}`}
    >
      {usePhoto ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 28vw, 90vw"
          className={`landing-grain-bg__photo ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
          style={{ objectPosition: grainImagePosition[grainTone] }}
        />
      ) : null}
      {grainOverlay ? <div className="surface-grain-overlay" aria-hidden /> : null}
      {icon ? (
        <LandingIcon
          icon={icon}
          size={iconSize}
          className="relative z-10 text-foreground/40 dark:text-foreground/55"
        />
      ) : null}
    </div>
  );
}
