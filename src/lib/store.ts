/**
 * CetThink 本地持久化 — localStorage 多副本 + IndexedDB + 可导出
 */

import { loadPersistedSync, loadPersistedDeep, savePersisted } from './persist';
import { safeStorage, STORE_CHANGED_EVENT } from './safe-storage';

export type ExamLevel = 'CET-4' | 'CET-6';

export interface VocabProgress {
  ease: number;
  interval: number;
  reps: number;
  due: number;
  mastery: number;
  lapses: number;
  lastWord?: string;
}

export interface ErrorItem {
  id: string;
  type: string;
  source: string;
  question: string;
  myAnswer: string;
  correctAnswer: string;
  explain: string;
  date: string;
  mastered: boolean;
}

export interface CetState {
  schema: 2;
  updatedAt: number;
  settings: {
    examLevel: ExamLevel;
    dailyWordTarget: number;
    theme: 'light' | 'dark';
    ttsRate: number;
    wordBook: string;
    autoSpeak: boolean;
    /** 答对/答错自动进入下一题的延迟 ms；0=关闭自动翻页 */
    autoAdvanceMs: number;
    /** 听力默认是否显示原文 */
    showTranscript: boolean;
    /** 评分前是否强制先看释义 */
    requireFlip: boolean;
    /** 模考是否必须做完全部板块才能交卷（false=可随时交卷） */
    examRequireAllDone: boolean;
    /** 词表排序 */
    vocabSort: 'freq' | 'alpha' | 'random';
    /** 每日模式是否严格卡名额（false=只提醒不拦截） */
    enforceDailyQuota: boolean;
  };
  profile: {
    streak: number;
    lastStudyDate: string | null;
    totalMinutes: number;
    learned: number;
    totalWords: number;
  };
  /** key: `${level}-${wordId}` 避免四/六级 id 冲突导致覆盖 */
  vocab: Record<string, VocabProgress>;
  favorites: string[];
  errors: ErrorItem[];
  daily: Record<string, { minutes: number; words: number; reviews: number }>;
  writingDraft: string;
  examHistory: { id: string; score: number; date: string; title: string }[];
  /** 背词位置等 UI 记忆 — 断点续学 */
  ui: {
    vocabIdx: Record<string, number>;
    /** 每词书的学习会话：模式 + 位置 + 今日进度，重启不从头 */
    vocabSession: Record<
      string,
      {
        mode: string;
        idx: number;
        todayDate: string;
        todayNew: number;
        todayReview: number;
        lastWordId?: number;
        lastWord?: string;
        sessionId: string;
        updatedAt: number;
      }
    >;
  };
}

export const STORE_KEY = 'cetthink_store_v1';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultState(): CetState {
  return {
    schema: 2,
    updatedAt: Date.now(),
    settings: {
      examLevel: 'CET-4',
      dailyWordTarget: 30,
      theme: 'light',
      ttsRate: 0.95,
      wordBook: 'cet4',
      autoSpeak: true,
      autoAdvanceMs: 0,
      showTranscript: false,
      requireFlip: false,
      examRequireAllDone: false,
      vocabSort: 'freq',
      enforceDailyQuota: false,
    },
    profile: {
      streak: 0,
      lastStudyDate: null,
      totalMinutes: 0,
      learned: 0,
      totalWords: 0,
    },
    vocab: {},
    favorites: [],
    errors: [],
    daily: {},
    writingDraft: '',
    examHistory: [],
    ui: { vocabIdx: {}, vocabSession: {} },
  };
}

function migrateVocab(raw: Record<string, unknown>): Record<string, VocabProgress> {
  const out: Record<string, VocabProgress> = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!v || typeof v !== 'object') continue;
    const p = v as VocabProgress;
    const id = k.includes('-') ? k : `4-${k}`;
    out[id] = {
      ease: p.ease ?? 2.5,
      interval: p.interval ?? 0,
      reps: p.reps ?? 0,
      due: p.due ?? 0,
      mastery: p.mastery ?? 0,
      lapses: p.lapses ?? 0,
      lastWord: p.lastWord,
    };
  }
  return out;
}

function normalize(raw: unknown): CetState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<CetState>;
  return {
    ...base,
    ...p,
    schema: 2,
    updatedAt: p.updatedAt || Date.now(),
    settings: { ...base.settings, ...(p.settings || {}) },
    profile: { ...base.profile, ...(p.profile || {}) },
    vocab: migrateVocab((p.vocab as Record<string, unknown>) || {}),
    favorites: Array.isArray(p.favorites) ? p.favorites : [],
    errors: Array.isArray(p.errors) ? p.errors : [],
    daily: p.daily && typeof p.daily === 'object' ? p.daily : {},
    examHistory: Array.isArray(p.examHistory) ? p.examHistory : [],
    writingDraft: typeof p.writingDraft === 'string' ? p.writingDraft : '',
    ui: { vocabIdx: p.ui?.vocabIdx || {}, vocabSession: p.ui?.vocabSession || {} },
  };
}

function loadSync(): CetState {
  try {
    // 先 persist，再作用域 safeStorage（NativeThink 键）
    const scoped = safeStorage.getItem('store_v1');
    const raw = loadPersistedSync() || scoped;
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

let state = loadSync();
const listeners = new Set<() => void>();

function save() {
  state.updatedAt = Date.now();
  savePersisted(state);
  try {
    safeStorage.setItem('store_v1', JSON.stringify(state));
    window.dispatchEvent(new Event(STORE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

/** 启动后从 IndexedDB 深恢复（若更完整则覆盖） */
export async function hydrateFromDeepStorage(): Promise<boolean> {
  try {
    const deep = await loadPersistedDeep();
    if (!deep) return false;
    const next = normalize(JSON.parse(deep));
    const curScore = JSON.stringify(state.vocab).length + state.profile.totalMinutes;
    const nextScore = JSON.stringify(next.vocab).length + next.profile.totalMinutes;
    if (nextScore > curScore) {
      state = next;
      save();
      notify();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function vocabKey(level: number | string, id: number | string) {
  return `${level}-${id}`;
}

export const store = {
  get: () => state,
  favoriteMeta: {} as Record<string, { content: string; meaning: string; example?: string; category: string }>,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** 供导入备份整包替换 */
  replace(next: unknown) {
    state = normalize(next);
    save();
    notify();
    return state;
  },
  update(patch: Partial<CetState>, opts?: { silent?: boolean }) {
    state = {
      ...state,
      ...patch,
      settings: { ...state.settings, ...(patch.settings || {}) },
      profile: { ...state.profile, ...(patch.profile || {}) },
      ui: { ...state.ui, ...(patch.ui || {}) },
    };
    save();
    if (!opts?.silent) notify();
    return state;
  },
  setSettings(partial: Partial<CetState['settings']>) {
    return store.update({ settings: { ...state.settings, ...partial } });
  },
  recordStudy(minutes: number, words = 0, reviews = 0) {
    const today = todayKey();
    const prevDay = state.daily[today] || { minutes: 0, words: 0, reviews: 0 };
    const day = {
      minutes: prevDay.minutes + minutes,
      words: prevDay.words + words,
      reviews: prevDay.reviews + reviews,
    };

    let streak = state.profile.streak;
    if (state.profile.lastStudyDate !== today) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      streak = state.profile.lastStudyDate === yKey ? streak + 1 : 1;
    }

    store.update({
      daily: { ...state.daily, [today]: day },
      profile: {
        ...state.profile,
        streak,
        lastStudyDate: today,
        totalMinutes: state.profile.totalMinutes + minutes,
        totalWords: (state.profile.totalWords || 0) + words,
      },
    });
  },
  today() {
    return state.daily[todayKey()] || { minutes: 0, words: 0, reviews: 0 };
  },
  isFavorite(id: string) {
    return state.favorites.includes(id);
  },
  toggleFavorite(id: string) {
    const has = state.favorites.includes(id);
    store.update({
      favorites: has ? state.favorites.filter((x) => x !== id) : [id, ...state.favorites],
    });
    return !has;
  },
  /** 结构化收藏元数据（NativeThink 风格，可存释义） */
  setFavoriteMeta(id: string, meta: { content: string; meaning: string; example?: string; category: string }) {
    (store.favoriteMeta as Record<string, unknown>)[id] = meta;
    try {
      safeStorage.setItem('favorite_meta', JSON.stringify(store.favoriteMeta));
    } catch {
      /* ignore */
    }
  },
  getFavoriteMeta(id: string) {
    return (store.favoriteMeta as Record<string, unknown>)[id] as
      | { content: string; meaning: string; example?: string; category: string }
      | undefined;
  },
  addError(item: Omit<ErrorItem, 'id' | 'date' | 'mastered'>) {
    const exists = state.errors.some((e) => e.question === item.question && e.myAnswer === item.myAnswer);
    if (exists) return;
    store.update({
      errors: [
        { ...item, id: `E_${Date.now().toString(36)}`, date: todayKey(), mastered: false },
        ...state.errors,
      ].slice(0, 500),
    });
  },
  removeError(id: string) {
    store.update({ errors: state.errors.filter((e) => e.id !== id) });
  },
  setVocab(key: string, p: VocabProgress) {
    store.update({ vocab: { ...state.vocab, [key]: p } });
  },
  getVocab(key: string): VocabProgress | null {
    return state.vocab[key] || null;
  },
  setVocabIdx(level: string, idx: number) {
    store.update({
      ui: {
        vocabIdx: { ...state.ui.vocabIdx, [level]: idx },
        vocabSession: state.ui.vocabSession || {},
      },
    });
  },
  getVocabIdx(level: string): number {
    return state.ui.vocabIdx?.[level] ?? 0;
  },
  /** 读取背词会话记忆（断点续学） */
  getVocabSession(level: string) {
    return state.ui.vocabSession?.[level] || null;
  },
  /** 写入/更新背词会话 — 每次翻页/切换模式都调用，保证重启不从头 */
  saveVocabSession(
    level: string,
    patch: Partial<{
      mode: string;
      idx: number;
      todayNew: number;
      todayReview: number;
      lastWordId: number;
      lastWord: string;
    }>,
  ) {
    const today = todayKey();
    const prev = state.ui.vocabSession?.[level];
    const sameDay = prev?.todayDate === today;
    const next = {
      mode: patch.mode || prev?.mode || 'flashcard',
      idx: patch.idx ?? prev?.idx ?? 0,
      todayDate: today,
      todayNew: sameDay ? (patch.todayNew ?? prev?.todayNew ?? 0) : patch.todayNew ?? 0,
      todayReview: sameDay ? (patch.todayReview ?? prev?.todayReview ?? 0) : patch.todayReview ?? 0,
      lastWordId: patch.lastWordId ?? prev?.lastWordId,
      lastWord: patch.lastWord ?? prev?.lastWord,
      sessionId: prev?.sessionId || `s_${Date.now().toString(36)}`,
      updatedAt: Date.now(),
    };
    store.update({
      ui: {
        vocabIdx: { ...state.ui.vocabIdx, [level]: next.idx },
        vocabSession: { ...(state.ui.vocabSession || {}), [level]: next },
      },
    });
    return next;
  },
  /** 重置会话（仅用户点「从头开始」时） */
  resetVocabSession(level: string) {
    const sess = { ...(state.ui.vocabSession || {}) };
    delete sess[level];
    store.update({
      ui: {
        vocabIdx: { ...state.ui.vocabIdx, [level]: 0 },
        vocabSession: sess,
      },
    });
  },
  /** 结构化收藏 — 与背词收藏同一真相源 */
  addFavoriteWord(level: number | string, id: number | string, meta: { word: string; meaning: string; example?: string }) {
    const key = `${level}-${id}`;
    if (!state.favorites.includes(key)) {
      store.update({ favorites: [key, ...state.favorites] });
    }
    store.setFavoriteMeta(key, {
      content: meta.word,
      meaning: meta.meaning,
      example: meta.example,
      category: `CET-${level}`,
    });
    return key;
  },
  removeFavoriteKey(key: string) {
    if (state.favorites.includes(key)) {
      store.update({ favorites: state.favorites.filter((x) => x !== key) });
    }
  },
  /** 数据摘要（设置/备份页） */
  summary() {
    return {
      wordsTracked: Object.keys(state.vocab).length,
      favorites: state.favorites.length,
      errors: state.errors.length,
      minutes: state.profile.totalMinutes,
      streak: state.profile.streak,
      lastStudyDate: state.profile.lastStudyDate,
      updatedAt: state.updatedAt,
    };
  },
  /**
   * 每日新词队列：未掌握词优先，今日已学不重复入队，严格受 dailyWordTarget 限制
   * level 可用 4/6 或 'CET-4'/'CET-6'（会话键统一归一化）
   */
  buildDailyNewQueue(
    words: { id: number; word: string }[],
    level: number | string,
  ): { id: number; word: string; key: string }[] {
    const levelNum = level === 'CET-6' || level === 6 ? 6 : 4;
    const sessKey = `CET-${levelNum}`;
    const today = todayKey();
    const sess = state.ui.vocabSession?.[sessKey];
    const todayNew = sess?.todayDate === today ? sess.todayNew || 0 : 0;
    const target = state.settings.dailyWordTarget || 30;
    const remaining = Math.max(0, target - todayNew);
    if (remaining === 0) return [];

    const seen = new Set<string>();
    const queue: { id: number; word: string; key: string }[] = [];
    for (const w of words) {
      if (queue.length >= remaining) break;
      const key = `${levelNum}-${w.id}`;
      if (seen.has(key)) continue;
      const p = state.vocab[key];
      if (!p || p.reps === 0) {
        seen.add(key);
        queue.push({ id: w.id, word: w.word, key });
      }
    }
    if (queue.length < remaining) {
      for (const w of words) {
        if (queue.length >= remaining) break;
        const key = `${levelNum}-${w.id}`;
        if (seen.has(key)) continue;
        const p = state.vocab[key];
        if (p && p.reps > 0 && (p.mastery || 0) < 0.6) {
          seen.add(key);
          queue.push({ id: w.id, word: w.word, key });
        }
      }
    }
    return queue;
  },
  /** 今日剩余新词名额 */
  dailyNewRemaining(level: number | string): number {
    const levelNum = level === 'CET-6' || level === 6 ? 6 : 4;
    const sessKey = `CET-${levelNum}`;
    const today = todayKey();
    const sess = state.ui.vocabSession?.[sessKey];
    const todayNew = sess?.todayDate === today ? sess.todayNew || 0 : 0;
    return Math.max(0, (state.settings.dailyWordTarget || 30) - todayNew);
  },
  /** 未掌握词列表（供「只练弱词」） */
  listWeakWords(words: { id: number; word: string }[], level: number | string) {
    const levelNum = level === 'CET-6' || level === 6 ? 6 : 4;
    return words.filter((w) => {
      const p = state.vocab[`${levelNum}-${w.id}`];
      return !p || p.reps === 0 || (p.mastery || 0) < 0.6;
    });
  },
  /** 模块活跃度（进度页柱图） */
  moduleActivity(): { key: string; label: string; value: number }[] {
    const day = store.today();
    return [
      { key: 'words', label: '背词', value: day.words },
      { key: 'reviews', label: '复习', value: day.reviews },
      { key: 'minutes', label: '分钟', value: day.minutes },
      { key: 'errors', label: '错题', value: Math.min(50, state.errors.filter((e) => !e.mastered).length) },
      { key: 'favorites', label: '收藏', value: Math.min(50, state.favorites.length) },
      { key: 'exams', label: '模考', value: state.examHistory.length * 5 },
    ];
  },
  /** 近 7 天学习分钟（进度页） */
  recentMinutes(days = 7): { date: string; minutes: number; words: number }[] {
    const out: { date: string; minutes: number; words: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rec = state.daily[key];
      out.push({ date: key, minutes: rec?.minutes || 0, words: rec?.words || 0 });
    }
    return out;
  },
  /** 到期复习数量（供首页展示） */
  dueReviewCount(words: { id: number }[], level: number | string): number {
    const levelNum = level === 'CET-6' || level === 6 ? 6 : 4;
    const now = Date.now();
    let n = 0;
    for (const w of words) {
      const p = state.vocab[`${levelNum}-${w.id}`];
      if (p && p.reps > 0 && p.due <= now && (p.mastery || 0) < 0.95) n++;
    }
    return n;
  },
};

// 启动恢复收藏元数据（作用域键）
try {
  const fm = safeStorage.getItem('favorite_meta');
  if (fm) store.favoriteMeta = JSON.parse(fm);
} catch {
  /* ignore */
}
