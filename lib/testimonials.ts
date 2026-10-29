export type Testimonial = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

const NAME_MAX = 40;
const BODY_MIN = 24;
const BODY_MAX = 600;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseTestimonialInput(raw: unknown): { name: string; body: string } | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Add your name and a short note.' };
  const data = raw as { name?: unknown; body?: unknown };
  const name = clean(data.name, NAME_MAX);
  const body = clean(data.body, BODY_MAX);
  if (name.length < 2) return { error: 'Add a first name, or how you want to be signed.' };
  if (body.length < BODY_MIN) return { error: 'A little more, please. A sentence or two is enough.' };
  return { name, body };
}

export function toTestimonial(row: { id: string; name: string; body: string; created_at: string }): Testimonial {
  return { id: row.id, name: row.name, body: row.body, createdAt: row.created_at };
}
