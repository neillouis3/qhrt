import { createHash } from 'crypto';
import { supabaseServer } from '@/lib/supabaseClient';
import { missingRelation } from '@/lib/apiError';

export const VOICE_BUCKET_UNAVAILABLE = 'not_configured';

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

function apiKey(): string {
  return process.env.ELEVENLABS_API_KEY?.trim() ?? '';
}

export function voiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
}

export function voiceConfigured(): boolean {
  return Boolean(apiKey());
}

export function voiceCacheKey(text: string): string {
  return createHash('sha256').update(`${voiceId()}:${DEFAULT_MODEL}:${text}`).digest('hex');
}

type CacheRow = { mime: string; audio_base64: string };

export async function readVoiceCache(cacheKey: string): Promise<{ buffer: Buffer; mime: string } | null> {
  const { data, error } = await supabaseServer
    .from('lesson_voice_cache')
    .select('mime, audio_base64')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (error) {
    if (!missingRelation(error)) {
      console.error('[voiceover] cache read', error.message, error.code);
    }
    return null;
  }
  const row = data as CacheRow | null;
  if (!row?.audio_base64) return null;
  try {
    return { buffer: Buffer.from(row.audio_base64, 'base64'), mime: row.mime || 'audio/mpeg' };
  } catch {
    return null;
  }
}

export async function writeVoiceCache(cacheKey: string, mime: string, buffer: Buffer): Promise<void> {
  const { error } = await supabaseServer.from('lesson_voice_cache').upsert({
    cache_key: cacheKey,
    mime,
    audio_base64: buffer.toString('base64'),
  });
  if (error && !missingRelation(error)) {
    console.error('[voiceover] cache write', error.message, error.code);
  }
}

export async function synthesizeSpeech(
  text: string
): Promise<{ buffer: Buffer; mime: string } | { error: string; status: number }> {
  const spoken = text.trim();
  if (!spoken) return { error: 'Nothing to speak on this slide.', status: 400 };
  const key = apiKey();
  if (!key) return { error: VOICE_BUCKET_UNAVAILABLE, status: 204 };

  const cacheKey = voiceCacheKey(spoken);
  const cached = await readVoiceCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId())}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: spoken.slice(0, 4500),
      model_id: DEFAULT_MODEL,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.7,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[voiceover] elevenlabs', response.status, detail.slice(0, 300));
    if (response.status === 401 || response.status === 403) {
      return { error: 'Voice is not available right now.', status: 503 };
    }
    if (response.status === 429) {
      return { error: 'Voice is busy. Try this slide again in a moment.', status: 429 };
    }
    return { error: 'Could not create voice for this slide.', status: 502 };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get('content-type') || 'audio/mpeg';
  await writeVoiceCache(cacheKey, mime, buffer);
  return { buffer, mime };
}
