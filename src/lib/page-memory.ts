import { useEffect, useState } from 'react';
import { safeStorage } from './safe-storage';

function restoreValue<T>(raw: string | null, defaults: T): T {
  if (!raw) return defaults;
  try {
    const saved = JSON.parse(raw);
    if (typeof defaults === 'object' && defaults !== null && !Array.isArray(defaults)) {
      if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return defaults;
      return { ...(defaults as object), ...(saved as object) } as T;
    }
    if (typeof saved !== typeof defaults) return defaults;
    return saved as T;
  } catch {
    return defaults;
  }
}

/** 记住页面状态 — 走 safeStorage（与 NativeThink 同作用域） */
export function usePageMemory<T>(key: string, defaults: T): [T, (val: T | ((prev: T) => T)) => void] {
  const storageKey = `pm_${key}`;
  const [state, setState] = useState<T>(() => {
    try {
      return restoreValue(safeStorage.getItem(storageKey), defaults);
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
    // 兼容旧键
    const raw = safeStorage.getItem('last_visit') || localStorage.getItem('cetthink_last_visit');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.path || Date.now() - (p.ts || 0) > 14 * 24 * 3600 * 1000) return null;
    return p;
  } catch {
    return null;
  }
}
