/**
 * NativeThink 风格记忆层：
 * - 学习统计 + 日历打卡（跨组件事件同步）
 * - 结构化收藏（content/meaning，可检索朗读）
 * - 页面状态记忆
 * - 词进度按 level-id 记忆
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  safeStorage,
  FAVORITES_CHANGED_EVENT,
  STORE_CHANGED_EVENT,
  SYNC_DOWN_EVENT,
  notifyFavoritesChanged,
} from './safe-storage';
import { store, type CetState, type VocabProgress } from './store';

const STATS_KEY = 'learning_stats';
const CALENDAR_KEY = 'learning_calendar';
const FAVORITES_KEY = 'favorites_meta';
const PAGE_PREFIX = 'pm_';

export const STATS_CHANGED_EVENT = 'cetthink-stats-changed';
export const CALENDAR_CHANGED_EVENT = 'cetthink-calendar-changed';

export interface ILearningStats {
  streakDays: number;
  dailyGoalMinutes: number;
  todayMinutes: number;
  todayWords: number;
  todayReviews: number;
  moduleProgress: {
    vocab: number;
    review: number;
    listening: number;
    reading: number;
    dictation: number;
    grammar: number;
    exam: number;
    writing: number;
  };
  totalDays: number;
  totalMinutes: number;
  totalWords: number;
  lastStudyDate: string;
}

export interface ICalendarRecord {
  date: string;
  checkedIn: boolean;
  minutes: number;
  words: number;
  reviews: number;
  modules: string[];
}

export interface IFavoriteItem {
  id: string;
  type: 'word' | 'chunk' | 'expression' | 'grammar' | 'sentence';
  content: string;
  meaning: string;
  example?: string;
  category: string;
  createdAt: number;
}

function formatDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultStats(state: CetState): ILearningStats {
  const t = store.today();
  return {
    streakDays: state.profile.streak,
    dailyGoalMinutes: state.settings.dailyWordTarget,
    todayMinutes: t.minutes,
    todayWords: t.words,
    todayReviews: t.reviews,
    moduleProgress: {
      vocab: Math.min(100, Object.keys(state.vocab).length),
      review: Math.min(100, t.reviews * 2),
      listening: 0,
      reading: 0,
      dictation: 0,
      grammar: 0,
      exam: state.examHistory.length,
      writing: state.writingDraft ? 50 : 0,
    },
    totalDays: Object.keys(state.daily).filter((k) => {
      const d = state.daily[k];
      return d && (d.minutes > 0 || d.words > 0 || d.reviews > 0);
    }).length,
    totalMinutes: state.profile.totalMinutes,
    totalWords: state.profile.totalWords || 0,
    lastStudyDate: state.profile.lastStudyDate || formatDate(),
  };
}

/** 从 store 派生 + 并入 safeStorage 覆盖（兼容 NativeThink 习惯键） */
export function readLearningStats(): ILearningStats {
  const state = store.get();
  const derived = defaultStats(state);
  try {
    const raw = safeStorage.getItem(STATS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ILearningStats>;
      return {
        ...derived,
        ...saved,
        moduleProgress: { ...derived.moduleProgress, ...(saved.moduleProgress || {}) },
        // 以 store 为准的实时字段
        streakDays: state.profile.streak,
        todayMinutes: store.today().minutes,
        todayWords: store.today().words,
        todayReviews: store.today().reviews,
        totalMinutes: state.profile.totalMinutes,
        lastStudyDate: state.profile.lastStudyDate || formatDate(),
      };
    }
  } catch {
    /* ignore */
  }
  return derived;
}

export function writeLearningStats(stats: ILearningStats) {
  try {
    safeStorage.setItem(STATS_KEY, JSON.stringify(stats));
    try {
      window.dispatchEvent(new Event(STATS_CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

export function readCalendar(): ICalendarRecord[] {
  try {
    const raw = safeStorage.getItem(CALENDAR_KEY);
    if (raw) return JSON.parse(raw) as ICalendarRecord[];
  } catch {
    /* ignore */
  }
  // 从 store.daily 迁移
  const state = store.get();
  return Object.entries(state.daily).map(([date, d]) => ({
    date,
    checkedIn: !!(d.minutes || d.words || d.reviews),
    minutes: d.minutes || 0,
    words: d.words || 0,
    reviews: d.reviews || 0,
    modules: [],
  }));
}

export function writeCalendar(records: ICalendarRecord[]) {
  try {
    safeStorage.setItem(CALENDAR_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event(CALENDAR_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/** 学习记忆 hook — 订阅 store + NativeThink 事件 */
export function useLearningMemory() {
  const state = useSyncExternalStore(store.subscribe, store.get);
  const [stats, setStats] = useState(() => readLearningStats());
  const [calendar, setCalendar] = useState<ICalendarRecord[]>(() => readCalendar());

  const refresh = useCallback(() => {
    setStats(readLearningStats());
    setCalendar(readCalendar());
  }, []);

  useEffect(() => {
    refresh();
    const events = [STORE_CHANGED_EVENT, STATS_CHANGED_EVENT, CALENDAR_CHANGED_EVENT, SYNC_DOWN_EVENT];
    const on = () => refresh();
    events.forEach((e) => window.addEventListener(e, on));
    return () => events.forEach((e) => window.removeEventListener(e, on));
  }, [refresh, state]);

  const recordModule = useCallback((module: keyof ILearningStats['moduleProgress'], minutes = 0, words = 0, reviews = 0) => {
    store.recordStudy(minutes, words, reviews);
    const next = readLearningStats();
    next.moduleProgress[module] = Math.min(100, (next.moduleProgress[module] || 0) + 5);
    writeLearningStats(next);
    const cal = readCalendar();
    const today = formatDate();
    const idx = cal.findIndex((c) => c.date === today);
    const row: ICalendarRecord = {
      date: today,
      checkedIn: true,
      minutes: next.todayMinutes,
      words: next.todayWords,
      reviews: next.todayReviews,
      modules: idx >= 0 && cal[idx].modules.includes(module) ? cal[idx].modules : [...(idx >= 0 ? cal[idx].modules : []), module],
    };
    if (idx >= 0) cal[idx] = row;
    else cal.push(row);
    writeCalendar(cal);
    refresh();
  }, [refresh]);

  return { state, stats, calendar, refresh, recordModule };
}

// ── 收藏（NativeThink IFavoriteItem） ──

function loadFavoritesMeta(): IFavoriteItem[] {
  try {
    const raw = safeStorage.getItem(FAVORITES_KEY);
    if (raw) return JSON.parse(raw) as IFavoriteItem[];
  } catch {
    /* ignore */
  }
  // 从 store.favorites string[] 迁移
  return store.get().favorites.map((id) => ({
    id,
    type: 'word' as const,
    content: store.get().vocab[id]?.lastWord || id.split('-').pop() || id,
    meaning: '',
    category: 'word',
    createdAt: Date.now(),
  }));
}

function persistFavoritesMeta(items: IFavoriteItem[]) {
  try {
    safeStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  notifyFavoritesChanged();
}

export function useFavoritesMemory() {
  const [items, setItems] = useState<IFavoriteItem[]>(() => loadFavoritesMeta());

  const refresh = useCallback(() => {
    setItems(loadFavoritesMeta());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(FAVORITES_CHANGED_EVENT, on);
    window.addEventListener(SYNC_DOWN_EVENT, on);
    window.addEventListener(STORE_CHANGED_EVENT, on);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, on);
      window.removeEventListener(SYNC_DOWN_EVENT, on);
      window.removeEventListener(STORE_CHANGED_EVENT, on);
    };
  }, [refresh]);

  const addFavorite = useCallback(
    (item: Omit<IFavoriteItem, 'id' | 'createdAt'> & { id?: string }) => {
      const list = loadFavoritesMeta();
      const exists = list.some((f) => f.content === item.content && f.type === item.type);
      if (exists) return false;
      const next: IFavoriteItem[] = [
        {
          ...item,
          id: item.id || `fav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now(),
        },
        ...list,
      ];
      persistFavoritesMeta(next);
      if (item.id) store.toggleFavorite(item.id);
      setItems(next);
      return true;
    },
    [],
  );

  const removeFavorite = useCallback((id: string) => {
    const list = loadFavoritesMeta().filter((f) => f.id !== id);
    persistFavoritesMeta(list);
    if (store.get().favorites.includes(id)) store.toggleFavorite(id);
    setItems(list);
  }, []);

  const isFavorited = useCallback(
    (content: string, type: IFavoriteItem['type']) => loadFavoritesMeta().some((f) => f.content === content && f.type === type),
    [],
  );

  return { favorites: items, addFavorite, removeFavorite, isFavorited, refresh };
}

// ── 页面记忆（NativeThink usePageMemory） ──

export function usePageMemory<T>(key: string, defaults: T): [T, (val: T | ((prev: T) => T)) => void] {
  const storageKey = PAGE_PREFIX + key;
  const [state, setState] = useState<T>(() => {
    try {
      const raw = safeStorage.getItem(storageKey);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      if (typeof defaults === 'object' && defaults && !Array.isArray(defaults)) {
        return { ...(defaults as object), ...(saved as object) } as T;
      }
      return (typeof saved === typeof defaults ? saved : defaults) as T;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      safeStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [storageKey, state]);

  return [state, setState];
}

export function rememberVisit(path: string, label: string) {
  if (path === '/') return;
  try {
    safeStorage.setItem('last_visit', JSON.stringify({ path, label, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function readLastVisit(): { path: string; label: string; ts: number } | null {
  try {
    const raw = safeStorage.getItem('last_visit');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.path || Date.now() - (p.ts || 0) > 14 * 24 * 3600 * 1000) return null;
    return p;
  } catch {
    return null;
  }
}

/** 词进度读写 — 与 NativeThink word learning 记忆一致 */
export function useWordMemory() {
  const getProgress = useCallback((level: number | string, id: number | string): VocabProgress | null => {
    return store.getVocab(`${level}-${id}`);
  }, []);

  const setProgress = useCallback((level: number | string, id: number | string, p: VocabProgress) => {
    store.setVocab(`${level}-${id}`, p);
  }, []);

  return { getProgress, setProgress };
}
