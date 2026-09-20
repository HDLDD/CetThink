/** Android 系统 TTS 封装 — 优先本地英语音色 */
import { Capacitor } from '@capacitor/core';

export interface INativeVoice {
  index: number;
  name: string;
  uri: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
  label?: string;
}

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export function isAndroidNative(): boolean {
  try {
    return isNativePlatform() && Capacitor.getPlatform?.() === 'android';
  } catch {
    return false;
  }
}

let pluginPromise: Promise<any | null> | null = null;

export function getNativeTts(): Promise<any | null> {
  if (!pluginPromise) {
    pluginPromise = (async () => {
      try {
        if (!Capacitor.isPluginAvailable?.('TextToSpeech')) return null;
        const mod = await import('@capacitor-community/text-to-speech');
        return (mod as { TextToSpeech?: unknown }).TextToSpeech || null;
      } catch {
        return null;
      }
    })();
  }
  return pluginPromise;
}

function nativeVoiceLabel(v: INativeVoice): string {
  const tail = v.uri.includes('#') ? v.uri.split('#').pop() || v.uri : v.uri;
  const cleaned = tail
    .replace(/-(local|network)$/i, '')
    .replace(/_(\d)/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
  const region = (v.lang || '').replace('-', ' ').toUpperCase();
  return `${cleaned || v.uri} · ${region} · ${v.localService ? '本地' : '网络'}`;
}

export async function listNativeVoices(): Promise<INativeVoice[]> {
  const plugin = await getNativeTts();
  if (!plugin?.getSupportedVoices) return [];
  try {
    const res = await plugin.getSupportedVoices();
    const raw: unknown[] = Array.isArray(res?.voices) ? res.voices : [];
    return raw.map((item, i) => {
      const v = item as Record<string, unknown>;
      return {
        index: i,
        name: String(v?.name || `语音 ${i + 1}`),
        uri: String(v?.voiceURI || v?.name || ''),
        lang: String(v?.lang || ''),
        localService: !!v?.localService,
        isDefault: !!v?.default,
      };
    });
  } catch {
    return [];
  }
}

export async function listNativeEnglishVoices(): Promise<INativeVoice[]> {
  const all = await listNativeVoices();
  const seen = new Set<string>();
  return all
    .filter((v) => (v.lang || '').toLowerCase().startsWith('en'))
    .filter((v) => {
      const key = v.uri || `${v.name}|${v.lang}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const sa = (a.isDefault ? 4 : 0) + (a.localService ? 2 : 0) + (a.lang.toLowerCase() === 'en-us' ? 1 : 0);
      const sb = (b.isDefault ? 4 : 0) + (b.localService ? 2 : 0) + (b.lang.toLowerCase() === 'en-us' ? 1 : 0);
      return sb - sa;
    })
    .map((v) => ({ ...v, label: nativeVoiceLabel(v) }));
}

let preferredVoicePromise: Promise<INativeVoice | null> | null = null;

export function pickPreferredEnglishVoice(): Promise<INativeVoice | null> {
  if (!preferredVoicePromise) {
    preferredVoicePromise = listNativeEnglishVoices()
      .then((list) => list.find((v) => v.localService) ?? null)
      .catch(() => null);
  }
  return preferredVoicePromise;
}

export async function openNativeTtsInstall(): Promise<boolean> {
  const plugin = await getNativeTts();
  if (!plugin?.openInstall) return false;
  try {
    await plugin.openInstall();
    return true;
  } catch {
    return false;
  }
}

export async function nativeSpeak(
  text: string,
  opts: { rate?: number; voiceIndex?: number | null } = {},
): Promise<boolean> {
  const plugin = await getNativeTts();
  if (!plugin?.speak) return false;
  try {
    const preferred = opts.voiceIndex != null ? null : await pickPreferredEnglishVoice();
    await plugin.speak({
      text,
      lang: preferred?.lang || 'en-US',
      rate: opts.rate ?? 0.95,
      pitch: 1,
      volume: 1,
      ...(typeof opts.voiceIndex === 'number' && opts.voiceIndex >= 0
        ? { voice: opts.voiceIndex }
        : preferred
          ? { voice: preferred.index }
          : {}),
    });
    return true;
  } catch {
    return false;
  }
}

export async function nativeStop(): Promise<void> {
  const plugin = await getNativeTts();
  try {
    await plugin?.stop?.();
  } catch {
    /* ignore */
  }
}

export async function openNativeTtsInstallPage(): Promise<void> {
  await openNativeTtsInstall();
}
