/**
 * 多副本持久化：localStorage 主键 + 备份键 + IndexedDB
 * 解决：重启/更新后进度丢失、无导出文件
 */

const LS_MAIN = 'cetthink_store_v1';
const LS_BACKUP = 'cetthink_store_v1_backup';
const LS_SNAPSHOT = 'cetthink_store_v1_snapshot';
const LS_LAST_SAVE = 'cetthink_store_last_save_at';
const IDB_NAME = 'cetthink-db';
const IDB_STORE = 'kv';
const IDB_KEY = 'store_v1';

function openIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function parseState(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

/** 统计「有学习痕迹」的程度，用于恢复时挑最完整的副本 */
export function scoreRaw(raw: string | null): number {
  const p = parseState(raw);
  if (!p) return 0;
  const vocab = (p.vocab as Record<string, unknown>) || {};
  const daily = (p.daily as Record<string, unknown>) || {};
  const errors = Array.isArray(p.errors) ? p.errors.length : 0;
  const favs = Array.isArray(p.favorites) ? p.favorites.length : 0;
  const profile = (p.profile as { totalMinutes?: number; streak?: number }) || {};
  return (
    Object.keys(vocab).length * 2 +
    Object.keys(daily).length +
    errors +
    favs +
    (profile.totalMinutes || 0) / 10 +
    (profile.streak || 0) * 3
  );
}

/** 同步读：先本地镜像（启动极快） */
export function loadPersistedSync(): string | null {
  const candidates = [
    safeGet(LS_MAIN),
    safeGet(LS_BACKUP),
    safeGet(LS_SNAPSHOT),
  ].filter(Boolean) as string[];
  if (!candidates.length) return null;
  candidates.sort((a, b) => scoreRaw(b) - scoreRaw(a));
  return candidates[0];
}

/** 异步读：含 IndexedDB，启动后若发现更完整数据会回调 */
export async function loadPersistedDeep(): Promise<string | null> {
  const syncBest = loadPersistedSync();
  const idb = await idbGet(IDB_KEY);
  const all = [syncBest, idb].filter(Boolean) as string[];
  if (!all.length) return null;
  all.sort((a, b) => scoreRaw(b) - scoreRaw(a));
  return all[0];
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** 多副本写入 + 时间戳 + 自动快照 */
export function savePersisted(payload: unknown) {
  const raw = JSON.stringify(payload);
  safeSet(LS_MAIN, raw);
  safeSet(LS_BACKUP, raw);
  safeSet(LS_LAST_SAVE, String(Date.now()));
  // 每 20 次保存做一次 snapshot（防覆盖损坏）
  try {
    const n = Number(localStorage.getItem('cetthink_save_count') || '0') + 1;
    localStorage.setItem('cetthink_save_count', String(n));
    if (n % 20 === 1) safeSet(LS_SNAPSHOT, raw);
  } catch {
    safeSet(LS_SNAPSHOT, raw);
  }
  void idbSet(IDB_KEY, raw);
}

export function getLastSaveAt(): number | null {
  try {
    const v = Number(localStorage.getItem(LS_LAST_SAVE) || 0);
    return v || null;
  } catch {
    return null;
  }
}

export function exportPayloadLabel(): string {
  const d = new Date();
  return `cetthink-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
}

/** 数据健康摘要（设置页展示） */
export function storageHealth() {
  return {
    main: scoreRaw(safeGet(LS_MAIN)),
    backup: scoreRaw(safeGet(LS_BACKUP)),
    snapshot: scoreRaw(safeGet(LS_SNAPSHOT)),
    lastSave: getLastSaveAt(),
  };
}
