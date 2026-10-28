import type { NameSource } from '@/lib/userName';

export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarMime = (typeof AVATAR_ALLOWED_TYPES)[number];

export const AVATAR_MAX_SOURCE_BYTES = 8 * 1024 * 1024;
export const AVATAR_MAX_STORED_BYTES = 350_000;
export const AVATAR_PIXEL_SIZE = 256;

export function isAvatarMime(value: string): value is AvatarMime {
  return (AVATAR_ALLOWED_TYPES as readonly string[]).includes(value);
}

export function avatarStampFromUser(user: NameSource): string {
  const value = user?.user_metadata?.avatar_at;
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export function avatarSrcFromUser(user: NameSource): string | undefined {
  const stamp = avatarStampFromUser(user);
  if (!stamp) return undefined;
  return `/api/settings/avatar?v=${encodeURIComponent(stamp)}`;
}

export function mimeFromMagicBytes(bytes: Uint8Array): AvatarMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  const riff = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  const webp = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
}
