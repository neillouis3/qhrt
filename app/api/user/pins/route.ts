import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import {
  MAX_PINNED,
  pinKey,
  pinnedFromUserMetadata,
  parsePinnedPractices,
  type PinKind,
  type PinnedPractice,
} from '@/lib/pinnedPractices';

function isPinKind(value: unknown): value is PinKind {
  return value === 'assessment' || value === 'breathe' || value === 'wind-down';
}

async function readMeta(userId: string) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(userId);
  if (error) throw error;
  return (data.user?.user_metadata ?? {}) as Record<string, unknown>;
}

async function writePins(userId: string, meta: Record<string, unknown>, pins: PinnedPractice[]) {
  const { error } = await supabaseServer.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, pinned_practices: pins },
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pins = pinnedFromUserMetadata(userResult.user.user_metadata ?? {});
  return NextResponse.json({ pins });
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const action = body.action === 'unpin' ? 'unpin' : 'pin';
    const kind = body.kind;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
    const href = typeof body.href === 'string' ? body.href.trim().slice(0, 200) : '';

    if (!isPinKind(kind) || !id || !title || !href.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid pin payload.' }, { status: 400 });
    }

    const userId = userResult.user.id;
    const meta = await readMeta(userId);
    let pins = pinnedFromUserMetadata(meta);
    const key = pinKey(kind, id);

    if (action === 'unpin') {
      pins = pins.filter((item) => item.key !== key);
    } else {
      const next: PinnedPractice = {
        key,
        kind,
        id,
        title,
        href,
        pinnedAt: new Date().toISOString(),
      };
      pins = [next, ...pins.filter((item) => item.key !== key)].slice(0, MAX_PINNED);
    }

    await writePins(userId, meta, pins);
    return NextResponse.json({ pins: parsePinnedPractices(pins) });
  } catch (err) {
    return apiError(err, '[api/user/pins] POST');
  }
}
