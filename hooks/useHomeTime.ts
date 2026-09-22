'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  formatHomeClock,
  homeSkyBlend,
  homeSkyDotColor,
  homeSkyGlobOpacity,
  homeTimePeriod,
  homeTimePeriodLabel,
  type HomeTimePeriod,
} from '@/lib/timeOfDay';

export function useHomeTime(tickMs = 60_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return useMemo(() => {
    const period: HomeTimePeriod = homeTimePeriod(now);
    const sky = homeSkyBlend(now);
    return {
      now,
      period,
      periodLabel: homeTimePeriodLabel(now),
      clock: formatHomeClock(now),
      sky,
      skyOpacity: homeSkyGlobOpacity(sky),
      dotColor: homeSkyDotColor(sky),
    };
  }, [now]);
}
