/**
 * safeStorage — 与 NativeThink 同思路的用户作用域存储。
 * key → cetthink_<userId>__:<key>，多应用/多用户不串数据。
 * 写入后触发云同步钩子与变更事件。
 */

const ANON_ID_KEY = 'cetthink_anon_id_v1';

function generateAnonId(): string {
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function recoverAnonIdFromStorage(): string | null {
  try {
    const marker = 'cetthink_';
    const suffix = '__:';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(marker)) continue;
      const rest = k.slice(marker.length);
      const end = rest.indexOf(suffix);
      if (end <= 0) continue;
      const candidate = rest.slice(0, end);
      if (candidate.startsWith('anon_')) return candidate;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
  } catch {
    /* ignore */
  }
  const recovered = recoverAnonIdFromStorage();
  if (recovered) {
    try {
      localStorage.setItem(ANON_ID_KEY, recovered);
    } catch {
      /* ignore */
    }
    return recovered;
  }
  const id = generateAnonId();
  try {
    localStorage.setItem(ANON_ID_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

function getUserId(): string {
  try {
    const w = window as unknown as { _userInfo?: { user_id?: string }; __PLATFORM_USER__?: { user_id?: string } };
    if (w._userInfo?.user_id) return w._userInfo.user_id;
    if (w.__PLATFORM_USER__?.user_id) return w.__PLATFORM_USER__.user_id;
  } catch {
    /* ignore */
  }
  return getAnonId();
}

let _prefix: string | null = null;

function getPrefix(): string {
  if (_prefix) return _prefix;
  _prefix = `cetthink_${getUserId()}__:`;
  return _prefix;
}

export function clearPrefixCache(): void {
  _prefix = null;
}

type CloudSyncHandler = (key: string, value: string | null) => void;
let _cloudSyncHandler: CloudSyncHandler | null = null;

export function setCloudSyncHandler(handler: CloudSyncHandler | null): void {
  _cloudSyncHandler = handler;
}

export const STORE_CHANGED_EVENT = 'cetthink-store-changed';
export const FAVORITES_CHANGED_EVENT = 'cetthink-favorites-changed';
export const SYNC_DOWN_EVENT = 'cetthink-sync-down';

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(getPrefix() + key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(getPrefix() + key, value);
      if (_cloudSyncHandler) {
        try {
          _cloudSyncHandler(key, value);
        } catch {
          /* ignore */
        }
      }
      try {
        window.dispatchEvent(new CustomEvent(STORE_CHANGED_EVENT, { detail: { key } }));
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(getPrefix() + key);
      if (_cloudSyncHandler) {
        try {
          _cloudSyncHandler(key, null);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  },
  getPrefixedKey(key: string): string {
    return getPrefix() + key;
  },
  getCurrentUserId(): string {
    return getUserId();
  },
};

/** 导出作用域内全部应用键（备份用，NativeThink backup 同款） */
export function exportScopedKeys(): Record<string, string> {
  const prefix = getPrefix();
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      data[key.slice(prefix.length)] = localStorage.getItem(key) || '';
    }
  } catch {
    /* ignore */
  }
  return data;
}

/** 导入作用域键值 */
export function importScopedKeys(data: Record<string, string>): number {
  let n = 0;
  for (const [key, value] of Object.entries(data || {})) {
    if (typeof value !== 'string') continue;
    try {
      localStorage.setItem(safeStorage.getPrefixedKey(key), value);
      n++;
    } catch {
      /* ignore */
    }
  }
  try {
    window.dispatchEvent(new Event(SYNC_DOWN_EVENT));
  } catch {
    /* ignore */
  }
  return n;
}

export function notifyFavoritesChanged() {
  try {
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function notifySyncDown() {
  try {
    window.dispatchEvent(new Event(SYNC_DOWN_EVENT));
  } catch {
    /* ignore */
  }
}
