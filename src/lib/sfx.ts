/** 学习提示音 — Web Audio 合成，借鉴 NativeThink */
const ENABLE_KEY = 'cetthink_sfx';

export function isSfxEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSfxEnabled(on: boolean): void {
  try {
    localStorage.setItem(ENABLE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.04) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  correct() {
    if (!isSfxEnabled()) return;
    tone(523.25, 0, 0.08);
    tone(659.25, 0.07, 0.1);
  },
  wrong() {
    if (!isSfxEnabled()) return;
    tone(196, 0, 0.12, 0.035);
  },
  done() {
    if (!isSfxEnabled()) return;
    tone(523.25, 0, 0.07);
    tone(659.25, 0.06, 0.07);
    tone(783.99, 0.12, 0.14);
  },
  click() {
    if (!isSfxEnabled()) return;
    tone(880, 0, 0.04, 0.02);
  },
};
