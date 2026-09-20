/**
 * CetThink 内置离线朗读（sherpa-onnx + Piper/Kokoro）— 仅 Android APK
 * 方案与 NativeThink 一致：插件只合成 WAV，播放走 WebView <audio>
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from './toast';
import { DEFAULT_LOCAL_VOICE_ID, FALLBACK_VOICE, findLocalVoice } from './tts-voice-catalog';

const TRY_KEY = 'cetthink_sherpa_try';
const OFF_KEY = 'cetthink_sherpa_off';
const VOICE_KEY = 'cetthink_local_voice';

export function isBundledEngineDisabled(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === '1';
  } catch {
    return false;
  }
}

export function reenableBundledEngine(): void {
  try {
    localStorage.removeItem(OFF_KEY);
    localStorage.removeItem(TRY_KEY);
  } catch {
    /* ignore */
  }
}

export function getLocalVoiceId(): string {
  try {
    return localStorage.getItem(VOICE_KEY) || DEFAULT_LOCAL_VOICE_ID;
  } catch {
    return DEFAULT_LOCAL_VOICE_ID;
  }
}

export function setLocalVoiceId(id: string) {
  try {
    localStorage.setItem(VOICE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** 启动时：上次加载未完成 → 自动停用，防反复崩溃 */
export function checkBundledEngineHealth(): void {
  try {
    if (localStorage.getItem(OFF_KEY) === '1') return;
    const t = Number(localStorage.getItem(TRY_KEY) || 0);
    if (t > 0) {
      localStorage.setItem(OFF_KEY, '1');
      localStorage.removeItem(TRY_KEY);
    }
  } catch {
    /* ignore */
  }
}

export interface ISherpaStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  sampleRate?: number;
  cached?: number;
  route?: string | null;
  modelBytes?: number;
  espeakFiles?: number;
  loadedModels?: { modelId: string; sampleRate: number; numSpeakers: number }[];
  errorByModel?: Record<string, string>;
}

interface ISherpaTtsPlugin {
  status(): Promise<ISherpaStatus>;
  init(): Promise<ISherpaStatus>;
  speak(options: {
    text: string;
    modelId: string;
    speakerId: number;
    speed?: number;
  }): Promise<{ path: string; bytes: number; durationMs: number; cached: boolean; ms: number }>;
  purge(): Promise<{ removed: number }>;
  readLog(): Promise<{ log: string }>;
}

const SherpaTts = registerPlugin<ISherpaTtsPlugin>('SherpaTts');

export function isSherpaAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform?.() === true && Capacitor.getPlatform?.() === 'android';
  } catch {
    return false;
  }
}

let initPromise: Promise<ISherpaStatus | null> | null = null;

export function warmSherpa(): Promise<ISherpaStatus | null> {
  if (!isSherpaAvailable()) return Promise.resolve(null);
  if (isBundledEngineDisabled()) return Promise.resolve(null);
  if (!initPromise) {
    try {
      localStorage.setItem(TRY_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    initPromise = SherpaTts.init()
      .then((s) => {
        if (s?.status === 'ready') {
          try {
            localStorage.removeItem(TRY_KEY);
          } catch {
            /* ignore */
          }
        }
        return s;
      })
      .catch(() => {
        initPromise = null;
        try {
          localStorage.removeItem(TRY_KEY);
        } catch {
          /* ignore */
        }
        return null;
      });
  }
  return initPromise;
}

export async function getSherpaStatus(): Promise<ISherpaStatus | null> {
  if (!isSherpaAvailable()) return null;
  try {
    return await SherpaTts.status();
  } catch {
    return null;
  }
}

export async function getSherpaInitLog(): Promise<string> {
  if (!isSherpaAvailable()) return '';
  try {
    return (await SherpaTts.readLog()).log || '';
  } catch {
    return '';
  }
}

export async function purgeSherpaCache(): Promise<number> {
  if (!isSherpaAvailable()) return 0;
  try {
    return (await SherpaTts.purge()).removed;
  } catch {
    return 0;
  }
}

const urlCache = new Map<string, { url: string; durationMs: number }>();
const MAX_CACHE = 80;

export interface ISherpaSpeakOptions {
  voiceId?: string | null;
  speed?: number;
}

function normalizeOpts(opts?: ISherpaSpeakOptions | number): { voiceId: string; speed: number } {
  if (typeof opts === 'number') return { voiceId: getLocalVoiceId(), speed: opts };
  return {
    voiceId: opts?.voiceId || getLocalVoiceId(),
    speed: typeof opts?.speed === 'number' ? opts.speed : 1,
  };
}

function keyOf(voiceId: string, text: string, speed: number): string {
  return `${voiceId}|${speed.toFixed(2)}|${text}`;
}

let _lastVoiceFallbackAt = 0;
function notifyVoiceFallback(from: string, to: string) {
  const now = Date.now();
  if (now - _lastVoiceFallbackAt < 5000) return;
  _lastVoiceFallbackAt = now;
  toast(`音色「${from}」暂不可用，改用「${to}」`, 'info', 3500);
}

/** 离线合成 → 可播放 URL */
export async function sherpaSpeak(
  text: string,
  opts?: ISherpaSpeakOptions | number,
): Promise<{ url: string; durationMs: number; cached: boolean; ms: number }> {
  const clean = text.trim();
  if (!clean) throw new Error('empty_text');
  const { voiceId, speed } = normalizeOpts(opts);

  const hit = urlCache.get(keyOf(voiceId, clean, speed));
  if (hit) return { ...hit, cached: true, ms: 0 };

  await warmSherpa();

  const requested = findLocalVoice(voiceId) ?? FALLBACK_VOICE;
  let voice = requested;
  let res;
  try {
    res = await SherpaTts.speak({
      text: clean,
      modelId: voice.modelId,
      speakerId: voice.speakerId,
      speed,
    });
  } catch (e) {
    if (voice.id === FALLBACK_VOICE.id) throw e;
    voice = FALLBACK_VOICE;
    const fbKey = keyOf(voice.id, clean, speed);
    const fbHit = urlCache.get(fbKey);
    if (fbHit) {
      notifyVoiceFallback(requested.name, FALLBACK_VOICE.name);
      return { ...fbHit, cached: true, ms: 0 };
    }
    res = await SherpaTts.speak({
      text: clean,
      modelId: voice.modelId,
      speakerId: voice.speakerId,
      speed,
    });
    notifyVoiceFallback(requested.name, FALLBACK_VOICE.name);
  }

  const url = Capacitor.convertFileSrc(res.path);
  if (urlCache.size >= MAX_CACHE) {
    const oldest = urlCache.keys().next().value;
    if (oldest !== undefined) urlCache.delete(oldest);
  }
  urlCache.set(keyOf(voice.id, clean, speed), { url, durationMs: res.durationMs });
  return { url, durationMs: res.durationMs, cached: res.cached, ms: res.ms };
}

export function sherpaPrewarm(text: string, opts?: ISherpaSpeakOptions | number): void {
  if (!isSherpaAvailable() || !text.trim()) return;
  const { voiceId, speed } = normalizeOpts(opts);
  if (urlCache.has(keyOf(voiceId, text.trim(), speed))) return;
  void sherpaSpeak(text, { voiceId, speed }).catch(() => {});
}
