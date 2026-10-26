'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SessionUser {
  id: string;
  email: string;
  /** Additional Supabase user metadata (display name, etc.) — shape varies. */
  user_metadata?: Record<string, unknown>;
}

interface SessionData {
  user: SessionUser;
  role: string;
  intakeCompleted: boolean;
}

interface FetchResult {
  data: SessionData | null;
  error: string | null;
}

// Module-level cache so all components share the same data
let cachedSession: SessionData | null = null;
let cachedAt = 0;
let inFlightRequest: Promise<FetchResult> | null = null;

/** Cache TTL — after this long, the session is re-validated against the API. */
const CACHE_TTL_MS = 60_000;

function isCacheValid(): boolean {
  return cachedSession !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

// Refetch signal — incremented whenever session state changes (login/logout)
// All useSession instances watch this via a ref to trigger a re-fetch
let refetchToken = 0;
const refetchListeners: Set<() => void> = new Set();

function notifyRefetch() {
  refetchToken++;
  // Copy to array to avoid iteration issues if listeners modify the set
  for (const listener of Array.from(refetchListeners)) {
    listener();
  }
}

function fetchSessionInternal(): Promise<FetchResult> {
  // If we have a fresh cached session, return it immediately
  if (isCacheValid()) return Promise.resolve({ data: cachedSession, error: null });
  // If a request is already in flight, share it (deduplication)
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = fetch('/api/auth/session', { cache: 'no-store' })
    .then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as SessionData | { user: null };
        if (!data.user) {
          cachedSession = null;
          cachedAt = 0;
          return { data: null, error: null };
        }
        cachedSession = data as SessionData;
        cachedAt = Date.now();
        return { data: cachedSession, error: null };
      }
      return { data: null, error: `Session request failed (${res.status})` };
    })
    .catch((err) => ({
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load session',
    }))
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(cachedSession);
  const [loading, setLoading] = useState(!cachedSession);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // Stable ref to track the refetch token — forces effect re-run on login/logout
  const tokenRef = useRef(refetchToken);

  const applyResult = useCallback((data: SessionData | null, fetchError: string | null) => {
    if (!mountedRef.current) return;
    setSession(data);
    setError(fetchError);
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Fetch on mount — will use cache if available, or share in-flight request
    fetchSessionInternal().then((result) => applyResult(result.data, result.error));

    // Listen for refetch signals (login/logout events from anywhere in the app)
    const checkToken = () => {
      if (!mountedRef.current || refetchToken === tokenRef.current) return;
      tokenRef.current = refetchToken;
      setLoading(true);
      fetchSessionInternal().then((result) => applyResult(result.data, result.error));
    };

    refetchListeners.add(checkToken);

    return () => {
      mountedRef.current = false;
      refetchListeners.delete(checkToken);
    };
  }, [applyResult]);

  const invalidate = useCallback(() => {
    cachedSession = null;
    cachedAt = 0;
    inFlightRequest = null;
    setSession(null);
    setError(null);
    setLoading(true);
    notifyRefetch(); // Notify all instances to re-fetch
  }, []);

  return { session, loading, error, invalidate };
}

// Helper to clear the cache — call BEFORE redirect after login/logout
// This ensures useSession will re-fetch on next mount with fresh data
export function clearSessionCache() {
  cachedSession = null;
  cachedAt = 0;
  inFlightRequest = null;
  notifyRefetch(); // Notify all mounted instances to re-fetch immediately
}

export async function logoutOnClient(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
  clearSessionCache();
}
