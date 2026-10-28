import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError, missingRelation, schemaMissingResponse } from '@/lib/apiError';
import { rateLimit } from '@/lib/rateLimiter';
import {
  AVATAR_MAX_STORED_BYTES,
  mimeFromMagicBytes,
  type AvatarMime,
} from '@/lib/userAvatar';

const SQL_FILE = 'supabase/011_user_avatars.sql';

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

async function setAvatarStamp(userId: string, stamp: string | null) {
  const { data: existingUser, error: getError } = await supabaseServer.auth.admin.getUserById(
    userId
  );
  if (getError) throw getError;
  const existingMeta = existingUser?.user?.user_metadata ?? {};
  const nextMeta = { ...existingMeta };
  nextMeta.avatar_at = stamp;
  const { error } = await supabaseServer.auth.admin.updateUserById(userId, {
    user_metadata: nextMeta,
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = createUserClient(request);
    const { data, error } = await db
      .from('user_avatars')
      .select('mime_type, image_base64')
      .eq('user_id', userResult.user.id)
      .maybeSingle();

    if (missingRelation(error)) return new NextResponse(null, { status: 404 });
    if (error) return apiError(error, '[api/settings/avatar] GET');
    if (!data?.image_base64 || typeof data.image_base64 !== 'string') {
      return new NextResponse(null, { status: 404 });
    }

    const mime = typeof data.mime_type === 'string' ? data.mime_type : 'image/jpeg';
    const bytes = Buffer.from(data.image_base64, 'base64');
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return apiError(err, '[api/settings/avatar] GET');
  }
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await rateLimit(`${userResult.user.id}:avatar`, 'auth');
  if (!rl.success) {
    const retryAfter = rl.reset ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 });
    }
    if (file.size > AVATAR_MAX_STORED_BYTES) {
      return NextResponse.json(
        { error: 'That photo is too large. Try a smaller image.' },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const mime: AvatarMime | null = mimeFromMagicBytes(buffer);
    if (!mime) {
      return NextResponse.json({ error: 'Use a JPEG, PNG, or WebP photo.' }, { status: 400 });
    }

    const db = createUserClient(request);
    const stamp = new Date().toISOString();
    const { error } = await db.from('user_avatars').upsert(
      {
        user_id: userResult.user.id,
        mime_type: mime,
        image_base64: bytesToBase64(buffer),
        updated_at: stamp,
      },
      { onConflict: 'user_id' }
    );

    if (missingRelation(error)) return schemaMissingResponse('Avatar', SQL_FILE);
    if (error) return apiError(error, '[api/settings/avatar] POST');

    await setAvatarStamp(userResult.user.id, stamp);
    return NextResponse.json({ success: true, avatarAt: stamp });
  } catch (err) {
    return apiError(err, '[api/settings/avatar] POST');
  }
}

export async function DELETE(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = createUserClient(request);
    const { error } = await db.from('user_avatars').delete().eq('user_id', userResult.user.id);
    if (missingRelation(error)) return schemaMissingResponse('Avatar', SQL_FILE);
    if (error) return apiError(error, '[api/settings/avatar] DELETE');

    await setAvatarStamp(userResult.user.id, null);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/settings/avatar] DELETE');
  }
}
