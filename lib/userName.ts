export type NameSource = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null | undefined;

function meta(user: NameSource, key: string): string {
  const value = user?.user_metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function emailLocal(user: NameSource): string {
  const email = user?.email;
  if (!email || !email.includes('@')) return '';
  return email.split('@')[0] ?? '';
}

/** First and last name for settings. Splits a stored display name when the parts were never saved. */
export function namePartsFromUser(user: NameSource): { firstName: string; lastName: string } {
  const firstName = meta(user, 'first_name');
  const lastName = meta(user, 'last_name');
  if (firstName || lastName) return { firstName, lastName };
  const display = fullNameFromUser(user, '');
  if (!display || display.includes('@')) return { firstName: '', lastName: '' };
  const parts = display.split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

/** Full name from metadata. Falls back to the email local-part only if nothing else is set. */
export function fullNameFromUser(user: NameSource, fallback = ''): string {
  const display = meta(user, 'display_name') || meta(user, 'full_name') || meta(user, 'name');
  if (display) return display;
  const joined = [meta(user, 'first_name'), meta(user, 'last_name')].filter(Boolean).join(' ');
  if (joined) return joined;
  return emailLocal(user) || fallback;
}

/** First name for greetings. */
export function firstNameFromUser(user: NameSource, fallback = 'there'): string {
  const first = meta(user, 'first_name');
  if (first) return first;
  const display = fullNameFromUser(user, '');
  if (display && !display.includes('@')) return display.split(/\s+/)[0] ?? fallback;
  return emailLocal(user) || fallback;
}

export function initialsFromUser(user: NameSource): string {
  const first = meta(user, 'first_name');
  const last = meta(user, 'last_name');
  if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  const name = firstNameFromUser(user, 'U');
  return name.charAt(0).toUpperCase();
}
