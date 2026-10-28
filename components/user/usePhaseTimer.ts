'use client';

import { useEffect, useRef, useState } from 'react';

export function usePhaseTimer(
  active: boolean,
  durationMs: number,
  onDone: () => void,
  cycle: string | number
) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    if (!active) {
      setFill(0);
      return;
    }
    const started = Date.now();
    let frame = 0;
    const tick = () => {
      const next = Math.min(1, (Date.now() - started) / durationMs);
      setFill(next);
      if (next >= 1) {
        doneRef.current();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, durationMs, cycle]);

  const remaining =
    !active || fill >= 1 ? 0 : Math.max(1, Math.ceil((1 - fill) * (durationMs / 1000)));
  return { fill, remaining };
}
