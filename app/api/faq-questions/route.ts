import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import { parseFaqQuestionInput } from '@/lib/faq';
import { rateLimit } from '@/lib/rateLimiter';
import { supabaseServer } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:faq-questions`, 'auth');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before sending another question.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Write the question you still have.' }, { status: 400 });
  }

  const parsed = parseFaqQuestionInput(raw);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await supabaseServer.from('faq_questions').insert({
    name: parsed.name,
    email: parsed.email,
    question: parsed.question,
  });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Question inbox is not set up yet. Run supabase/015_faq_questions.sql.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Could not send your question.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
