'use client';

import { useRef, useCallback } from 'react';

const DEBOUNCE_MS = 500;

/**
 * Prevents rapid-fire navigation clicks. Blocks navigation
 * for 500ms after the first click on the same or different route.
 */
export default function useNavigationGuard() {
  const lastNav = useRef(0);

  const navigate = useCallback((href: string) => {
    const now = Date.now();
    if (now - lastNav.current < DEBOUNCE_MS) return false;
    lastNav.current = now;
    return true;
  }, []);

  return navigate;
}
