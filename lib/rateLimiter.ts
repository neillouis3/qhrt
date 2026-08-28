import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Central rate limiter for API + auth endpoints.
 *
 * - When Upstash Redis is configured (UPSTASH_REDIS_REST_URL + _TOKEN), limits are
 *   enforced per-instance in Redis — correct across a multi-instance deployment.
 * - Otherwise (local dev / no Upstash keys), a single-process in-memory token bucket
 *   is used so development still gets protection without external infra.
 *
 * The in-memory bucket is keyed by identifier and uses a sliding counter that
 * resets after the window elapses. It is best-effort and only valid within one
 * Node process — acceptable for local development and the "implement something now,
 * tighten later" baseline.
 */

type RateLimitResult = {
  success: boolean;
  /** Unix timestamp (ms) when the limit resets, if denied. */
  reset?: number;
};

const AUTH_WINDOW_MS = 60_000; // 1 minute
const AUTH_LIMIT = 10; // 10 auth attempts / minute / identifier
const API_WINDOW_MS = 60_000; // 1 minute
const API_LIMIT = 300; // 300 requests / minute / identifier

// ---- Upstash (preferred) -------------------------------------------------
const upstashRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const upstashAuth = upstashRedis
  ? new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(AUTH_LIMIT, `${AUTH_WINDOW_MS / 1000} s`),
      prefix: 'qhrt:auth',
    })
  : null;

const upstashApi = upstashRedis
  ? new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(API_LIMIT, `${API_WINDOW_MS / 1000} s`),
      prefix: 'qhrt:api',
    })
  : null;

// ---- In-memory fallback (dev / no Upstash) -------------------------------
type Bucket = { count: number; windowStart: number };
const memoryStore = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; reset?: number } {
  const now = Date.now();
  const bucket = memoryStore.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return { success: true };
  }
  bucket.count += 1;
  const reset = bucket.windowStart + windowMs;
  return { success: bucket.count <= limit, reset };
}

// Periodically prune expired buckets so the Map does not grow unbounded.
const MAX_WINDOW = Math.max(AUTH_WINDOW_MS, API_WINDOW_MS);
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memoryStore) {
    if (now - bucket.windowStart > MAX_WINDOW) {
      memoryStore.delete(key);
    }
  }
}, 60_000).unref?.();

// ---- Public API ----------------------------------------------------------

/**
 * Apply a rate limit to the given identifier. Returns `{ success: true }` when the
 * request may proceed, or `{ success: false, reset }` when it should be rejected.
 */
export async function rateLimit(
  identifier: string,
  scope: 'auth' | 'api' = 'api'
): Promise<RateLimitResult> {
  if (scope === 'auth' && upstashAuth) {
    const res = await upstashAuth.limit(identifier);
    return { success: res.success, reset: res.success ? undefined : res.reset };
  }
  if (upstashApi) {
    const res = await upstashApi.limit(identifier);
    return { success: res.success, reset: res.success ? undefined : res.reset };
  }
  // Fallback: in-memory
  if (scope === 'auth') {
    return memoryLimit(`auth:${identifier}`, AUTH_LIMIT, AUTH_WINDOW_MS);
  }
  return memoryLimit(`api:${identifier}`, API_LIMIT, API_WINDOW_MS);
}

/**
 * True when Upstash Redis is configured (distributed limits active).
 * Exposed for logging/diagnostics.
 */
export const rateLimiterBackend: 'upstash' | 'memory' = upstashRedis ? 'upstash' : 'memory';
