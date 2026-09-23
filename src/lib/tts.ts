/**
 * CetThink 多级朗读 — 对齐 NativeThink 全链路
 * 离线 sherpa → 系统 TTS → 云端 /api/tts（Edge）→ Google TTS → Web
 */
import {
  isSherpaAvailable,
  sherpaSpeak,
  warmSherpa,
  isBundledEngineDisabled,
  reenableBundledEngine,
  getSherpaStatus,
  getSherpaInitLog,
} from './sherpa-tts';
import { isAndroidNative, nativeSpeak, nativeStop, pickPreferredEnglishVoice } from './native-tts';
import { toast } from './toast';
import { getAiProxy } from './ai';

type Listener = () => void;
type EngineId = 'sherpa' | 'native' | 'cloud' | 'google' | 'web' | 'none';

let rate = 0.95;
const listeners = new Set<Listener>();
let webVoice: SpeechSynthesisVoice | null = null;
let usingEngine: EngineId = 'none';
let audioEl: HTMLAudioElement | null = null;
let lastFailAt = 0;
let primed = false;

/** onEnd 只允许触发一次：一条 speak 链路会依次尝试多档引擎，逐档回调会让调用方重复推进 */
function once(fn?: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn?.();
  };
}

/** 给「第一声」加超时：安卓原生 TTS 插件在没有可用引擎时会永久挂起（真机实测），
 *  不设超时则整条降级链路卡死 —— 表现为点了朗读没反应、按钮一直停在「朗读中」。 */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), ms)),
  ]);
}

export interface ITtsPlaybackReport {
  engine: EngineId;
  firstAudioMs: number;
  fellBack: boolean;
  at: number;
}

let lastPlaybackReport: ITtsPlaybackReport | null = null;

export function getLastTtsReport(): ITtsPlaybackReport | null {
  return lastPlaybackReport;
}

function report(r: Omit<ITtsPlaybackReport, 'at'>) {
  lastPlaybackReport = { ...r, at: Date.now() };
}

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
}

function pickWebVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) {
    webVoice = null;
    return;
  }
  webVoice =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|natural|female|english/i.test(v.name)) ||
    voices.find((v) => /en[-_]US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0] ||
    null;
}

if (typeof speechSynthesis !== 'undefined') {
  pickWebVoice();
  speechSynthesis.onvoiceschanged = () => {
    pickWebVoice();
    listeners.forEach((l) => l());
  };
}

function primeAudio() {
  if (primed) return;
  try {
    const a = new Audio();
    a.volume = 0;
    void a.play().then(() => {
      a.pause();
      a.src = '';
    }).catch(() => {});
  } catch {
    /* ignore */
  }
  if (typeof speechSynthesis !== 'undefined') {
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }
  primed = true;
}

if (typeof document !== 'undefined') {
  const unlock = () => {
    primeAudio();
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}

function stopAudio() {
  try {
    const a = getAudio();
    a.onended = null;
    a.onerror = null;
    a.pause();
    a.removeAttribute('src');
    a.load();
  } catch {
    /* ignore */
  }
}

function cloudTtsBase(): string {
  try {
    const proxy = getAiProxy();
    // AI 代理是 .../api/ai/chat，TTS 用同源 .../api/tts
    return proxy.replace(/\/api\/ai\/chat.*$/, '') || 'https://nativethink.pages.dev';
  } catch {
    return 'https://nativethink.pages.dev';
  }
}

function cloudTtsUrl(text: string, r: number, voice?: string | null): string {
  const base = cloudTtsBase();
  const v = voice ? `&voice=${encodeURIComponent(voice)}` : '';
  return `${base}/api/tts?text=${encodeURIComponent(text)}&rate=${r.toFixed(2)}${v}&lang=en`;
}

function googleTtsUrl(text: string, lang = 'en'): string {
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text.slice(0, 200))}`;
}

const TTS_CACHE_NAME = 'cetthink-tts-v1';

async function cacheGetOrFetch(url: string): Promise<string> {
  try {
    if (typeof caches === 'undefined') {
      return url;
    }
    const cache = await caches.open(TTS_CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return URL.createObjectURL(await hit.blob());
    const resp = await fetch(url);
    if (resp.ok) {
      void cache.put(url, resp.clone());
      return URL.createObjectURL(await resp.blob());
    }
  } catch {
    /* ignore */
  }
  return url;
}

async function playUrl(url: string, onEnd?: () => void): Promise<boolean> {
  const a = getAudio();
  stopAudio();
  const src = url.startsWith('http') || url.startsWith('blob:') ? url : await cacheGetOrFetch(url);
  return new Promise((resolve) => {
    let settled = false;
    const ok = () => {
      if (settled) return;
      settled = true;
      resolve(true);
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      resolve(false);
    };
    a.onended = () => {
      onEnd?.();
      ok();
    };
    a.onerror = () => {
      onEnd?.();
      fail();
    };
    a.src = src;
    void a.play().then(ok).catch(fail);
  });
}

async function speakSherpa(text: string, t0: number, onEnd?: () => void): Promise<boolean> {
  if (!isSherpaAvailable() || isBundledEngineDisabled()) return false;
  try {
    const res = await sherpaSpeak(text, { speed: rate });
    const ok = await playUrl(res.url, onEnd);
    if (ok) {
      usingEngine = 'sherpa';
      report({ engine: 'sherpa', firstAudioMs: Date.now() - t0, fellBack: false });
      return true;
    }
  } catch {
    /* next */
  }
  return false;
}

async function speakNative(text: string, t0: number, onEnd?: () => void): Promise<boolean> {
  if (!isAndroidNative()) return false;
  try {
    // 2.5s 没返回就当作失败继续降级：安卓原生 TTS 插件在缺本地音色时会永久挂起（真机实测）
    const ok = await withTimeout(nativeSpeak(text, { rate }), 2500, false);
    if (!ok) return false;
    usingEngine = 'native';
    report({ engine: 'native', firstAudioMs: Date.now() - t0, fellBack: true });
    const ms = Math.min(15000, Math.max(700, text.split(/\s+/).length * 360));
    window.setTimeout(() => onEnd?.(), ms);
    return true;
  } catch {
    return false;
  }
}

async function speakCloud(text: string, t0: number, fellBack: boolean, onEnd?: () => void): Promise<boolean> {
  try {
    const url = cloudTtsUrl(text, rate);
    const ok = await playUrl(url, onEnd);
    if (ok) {
      usingEngine = 'cloud';
      report({ engine: 'cloud', firstAudioMs: Date.now() - t0, fellBack });
      return true;
    }
  } catch {
    /* next */
  }
  return false;
}

async function speakGoogle(text: string, t0: number, onEnd?: () => void): Promise<boolean> {
  try {
    const ok = await playUrl(googleTtsUrl(text), onEnd);
    if (ok) {
      usingEngine = 'google';
      report({ engine: 'google', firstAudioMs: Date.now() - t0, fellBack: true });
      return true;
    }
  } catch {
    /* next */
  }
  return false;
}

function speakWeb(text: string, t0: number, onEnd?: () => void): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  // 安卓 APK 的 WebView 里 speechSynthesis 会「回报成功却不出声」，且 onend 常常永不触发
  // —— 真机实测：点了朗读没声音，按钮永久停在「朗读中」。故安卓一律不走这一档，
  // 宁可让上层报「朗读失败」，也不静默假成功。
  if (isAndroidNative()) return false;
  try {
    speechSynthesis.cancel();
    if (!webVoice) pickWebVoice();
    const u = new SpeechSynthesisUtterance(text);
    if (webVoice) u.voice = webVoice;
    u.lang = webVoice?.lang || 'en-US';
    u.rate = rate;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
    usingEngine = 'web';
    report({ engine: 'web', firstAudioMs: Date.now() - t0, fellBack: true });
    return true;
  } catch {
    return false;
  }
}

function notifyFailOnce() {
  const now = Date.now();
  if (now - lastFailAt < 6000) return;
  lastFailAt = now;
  toast('朗读失败：可在设置中自检离线引擎 / 系统语音 / 网络', 'error', 4500);
}

export const tts = {
  isSupported: () => true,
  getEngine: () => usingEngine,
  getLastReport: getLastTtsReport,
  setRate(r: number) {
    rate = Math.min(1.6, Math.max(0.5, r));
  },
  getRate: () => rate,
  warm() {
    primeAudio();
    if (isSherpaAvailable() && !isBundledEngineDisabled()) void warmSherpa();
    if (isAndroidNative()) void pickPreferredEnglishVoice();
  },
  async diagnose() {
    const sherpa = await getSherpaStatus();
    return {
      engine: usingEngine,
      sherpaAvailable: isSherpaAvailable(),
      sherpaDisabled: isBundledEngineDisabled(),
      sherpaStatus: sherpa?.status || null,
      sherpaError: sherpa?.error || null,
      sherpaModels: sherpa?.loadedModels || [],
      log: isBundledEngineDisabled() ? await getSherpaInitLog() : '',
      android: isAndroidNative(),
      webVoices: typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices().length : 0,
      cloudBase: cloudTtsBase(),
      lastReport: lastPlaybackReport,
    };
  },
  reenableOffline() {
    reenableBundledEngine();
    void warmSherpa();
  },
  async speak(text: string, onEnd?: () => void) {
    if (!text?.trim()) {
      onEnd?.();
      return;
    }
    primeAudio();
    const t0 = Date.now();
    let fellBack = false;
    // 任何路径都只回调一次；再加一道看门狗 —— 调用方（如背词页的 speaking 高亮）
    // 绝不允许因为某个引擎不回调而永久卡在「朗读中」。
    const done = once(onEnd);
    const words = text.trim().split(/\s+/).length;
    const watchdog = window.setTimeout(done, Math.min(60000, Math.max(8000, words * 700)));

    if (isSherpaAvailable() && !isBundledEngineDisabled()) {
      if (await speakSherpa(text, t0, done)) return;
      fellBack = true;
    }
    if (isAndroidNative()) {
      if (await speakNative(text, t0, done)) return;
      fellBack = true;
    }
    // 有网时走云端 Edge；无网再 Google / Web
    if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
      if (await speakCloud(text, t0, fellBack, done)) return;
      if (await speakGoogle(text, t0, done)) return;
    }
    if (speakWeb(text, t0, done)) return;
    window.clearTimeout(watchdog);
    notifyFailOnce();
    done();
  },
  stop() {
    stopAudio();
    void nativeStop();
    try {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export { getLocalVoiceId, setLocalVoiceId } from './sherpa-tts';
export { listLocalVoices, KOKORO_VOICES, FALLBACK_VOICE } from './tts-voice-catalog';
