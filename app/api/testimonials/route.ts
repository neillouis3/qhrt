import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rateLimiter';
import { supabaseServer } from '@/lib/supabaseClient';
import { parseTestimonialInput, toTestimonial } from '@/lib/testimonials';

function tableMissing(error: { code?: string } | null): boolean {
  return error?.code === '42P01';
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from('testimonials')
    .select('id, name, body, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    if (tableMissing(error)) {
      return NextResponse.json({ testimonials: [], setup: false });
    }
    return NextResponse.json({ error: 'Could not load notes.' }, { status: 500 });
  }

  return NextResponse.json({
    testimonials: (data ?? []).map(toTestimonial),
    setup: true,
  });
}

export async function POST(request: NextRequest) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`${ip}:testimonials`, 'auth');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before sharing another note.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Add your name and a short note.' }, { status: 400 });
  }

  const parsed = parseTestimonialInput(raw);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('testimonials')
    .insert({ name: parsed.name, body: parsed.body, published: true })
    .select('id, name, body, created_at')
    .single();

  if (error || !data) {
    if (tableMissing(error)) {
      return NextResponse.json(
        { error: 'Testimonials are not set up yet. Run supabase/014_testimonials.sql.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Could not save your note.' }, { status: 500 });
  }

  return NextResponse.json({ testimonial: toTestimonial(data) });
}
