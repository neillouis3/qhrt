import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestClient } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Create a response object to hold cookies and headers
    let response = NextResponse.json({});
    const supabase = createRequestClient(request, (cookies) => {
      cookies.forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      });
    });

    // Sign out via Supabase (clears session cookies)
    await supabase.auth.signOut();

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200, headers: response.headers }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
