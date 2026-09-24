import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { collectAccountExport } from '@/lib/accountExport';
import { apiError } from '@/lib/apiError';
import { fullNameFromUser } from '@/lib/userName';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: authUser, error: userError } = await supabaseServer.auth.admin.getUserById(
      userResult.user.id
    );
    if (userError || !authUser.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await collectAccountExport(createUserClient(request), {
      id: authUser.user.id,
      email: authUser.user.email,
      displayName: fullNameFromUser(authUser.user),
      createdAt: authUser.user.created_at,
    });

    const date = new Date().toISOString().slice(0, 10);
    const body = JSON.stringify(payload, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="qhrt-data-${date}.json"`,
      },
    });
  } catch (err) {
    return apiError(err, '[api/settings/export] GET');
  }
}
