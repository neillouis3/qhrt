'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Typography, buttonVariants } from '@heroui/react';
import InfoBody from '@/components/readiness/InfoBody';
import CrisisResources from '@/components/ui/CrisisResources';
import UserPageShell from '@/components/layout/UserPageShell';
import { clearSessionCache } from '@/hooks/useSession';
import { pathwayCopy } from '@/lib/initialAccess';

type PathwayPayload = {
  pathway: string | null;
  allowSessions: boolean;
  acknowledged: boolean;
  programOpen: boolean;
  nextHref: string;
  copy: { title: string; body: string; allowSignup: boolean; allowSessions: boolean } | null;
  preparationFocus?: { title: string; items: string[] }[];
};

export default function StartingPointPage() {
  const router = useRouter();
  const [data, setData] = useState<PathwayPayload | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/user/pathway', { credentials: 'same-origin' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not load this starting point.');
        const payload = body as PathwayPayload;
        if (!cancelled && !payload.pathway) {
          router.replace('/home');
          return;
        }
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this starting point.');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const continueToProgram = async () => {
    if (!data?.allowSessions) return;
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/user/pathway', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'continue' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Could not continue just now.');
        return;
      }
      clearSessionCache();
      router.push(typeof body.nextHref === 'string' ? body.nextHref : data.nextHref);
      router.refresh();
    } catch {
      setError('Could not continue just now. Try again.');
    } finally {
      setPending(false);
    }
  };

  const spec = data?.pathway ? pathwayCopy(data.pathway) : null;
  const title = spec?.title || data?.copy?.title || 'Your starting point';
  const body = spec?.body || data?.copy?.body || '';

  return (
    <UserPageShell wide="75">
      <div className="flex flex-col gap-8">
        {data || error ? (
          <>
            <div className="flex flex-col gap-4">
              <Typography type="body-xs" color="muted">
                Before a session
              </Typography>
              <Typography type="h1" weight="normal">
                {title}
              </Typography>
              {body ? <InfoBody text={body} /> : null}
              {data?.pathway === 'preparation' && data.preparationFocus && data.preparationFocus.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {data.preparationFocus.map((group) => (
                    <div key={group.title} className="flex flex-col gap-2">
                      <Typography type="body" weight="medium">
                        {group.title}
                      </Typography>
                      <ul className="flex list-disc flex-col gap-1 pl-5">
                        {group.items.map((item) => (
                          <li key={item}>
                            <Typography type="body-sm" color="muted">
                              {item}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              {data?.allowSessions ? (
                <Button variant="primary" isPending={pending} isDisabled={pending} onPress={() => void continueToProgram()}>
                  Continue
                </Button>
              ) : (
                <>
                  <Link href="/readiness?again=1" className={buttonVariants({ variant: 'primary' })}>
                    {data?.pathway === 'preparation'
                      ? 'Repeat Program Readiness & Suitability Check'
                      : 'Answer the check again'}
                  </Link>
                  <Link href="/settings" className={buttonVariants({ variant: 'ghost' })}>
                    Settings
                  </Link>
                </>
              )}
            </div>
            <CrisisResources />
          </>
        ) : (
          <div role="status" aria-live="polite" className="sr-only">
            Loading starting point
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
