import { clearSessionCache } from '@/hooks/useSession';

/** Call after POST /api/auth/logout so the next session read is uncached. */
export async function logoutOnClient(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
  clearSessionCache();
}
