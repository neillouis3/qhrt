'use client';

import { useHomeTime } from '@/hooks/useHomeTime';
import type { HomeSkyBlend } from '@/lib/timeOfDay';

function SkyLayers({ blend }: { blend: HomeSkyBlend }) {
  return (
    <>
      <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: blend.night }} />
      <div className="home-ambient__layer home-ambient__layer--dawn" style={{ opacity: blend.dawn }} />
      <div className="home-ambient__layer home-ambient__layer--day" style={{ opacity: blend.day }} />
      <div
        className="home-ambient__layer home-ambient__layer--afternoon"
        style={{ opacity: blend.afternoon }}
      />
    </>
  );
}

function HomeTimeBackdrop() {
  const { sky, skyOpacity } = useHomeTime();

  const accentWarm = Math.min(1, sky.dawn + sky.day + sky.afternoon) * 0.65;
  const accentCool = Math.min(1, sky.night * 0.85 + sky.dawn * 0.35) * 0.6;

  return (
    <div
      aria-hidden
      className="home-ambient pointer-events-none absolute inset-0 z-0 min-h-full overflow-visible"
    >
      <div className="home-ambient__blobs" style={{ opacity: skyOpacity }}>
        <div className="home-ambient__glob home-ambient__glob--main">
          <SkyLayers blend={sky} />
        </div>
        <div
          className="home-ambient__glob home-ambient__glob--left"
          style={{ opacity: 0.25 + accentCool * 0.35 }}
        >
          <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: sky.night }} />
          <div className="home-ambient__layer home-ambient__layer--dawn" style={{ opacity: sky.dawn * 0.9 }} />
        </div>
        <div
          className="home-ambient__glob home-ambient__glob--right"
          style={{ opacity: 0.2 + accentWarm * 0.4 }}
        >
          <div className="home-ambient__layer home-ambient__layer--day" style={{ opacity: sky.day }} />
          <div
            className="home-ambient__layer home-ambient__layer--afternoon"
            style={{ opacity: sky.afternoon * 0.95 }}
          />
        </div>
        <div
          className="home-ambient__glob home-ambient__glob--mist"
          style={{ opacity: 0.15 + sky.night * 0.22 + sky.dawn * 0.12 }}
        >
          <div className="home-ambient__layer home-ambient__layer--night" style={{ opacity: 0.75 }} />
        </div>
      </div>
      <div className="home-ambient__veil" />
    </div>
  );
}

/** Home layout: scrollable sky backdrop under the transparent navbar. */
export default function HomePageChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex w-full min-h-full flex-1 flex-col -mt-[var(--app-navbar-height)] pt-[var(--app-navbar-height)]">
      <HomeTimeBackdrop />
      <div className="relative z-10 flex w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
