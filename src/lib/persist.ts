/**
 * 多副本持久化：localStorage 主键 + 备份键 + IndexedDB
 * 解决：重启/更新后进度丢失、无导出文件
 */

const LS_MAIN = 'cetthink_store_v1';
const LS_BACKUP = 'cetthink_store_v1_backup';
const LS_SNAPSHOT = 'cetthink_store_v1_snapshot';
const LS_LAST_SAVE = 'cetthink_store_last_save_at';
const SAVE_COUNT_KEY = 'cetthink_save_count';
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

async function idbDelete(key: string): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
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

/** 副本写入时间（缺失或非法记 0） */
export function updatedAtOf(raw: string | null): number {
  const p = parseState(raw);
  const t = p && typeof p.updatedAt === 'number' ? p.updatedAt : 0;
  return Number.isFinite(t) ? t : 0;
}

/**
 * 选最可信副本：**先比 updatedAt，同一时间戳再比学习痕迹**。
 *
 * 旧实现只比 scoreRaw（"痕迹多者胜"），于是「清空全部数据」写出的是空状态（分低），
 * 而残留的旧 snapshot / IndexedDB 分更高 —— 刷新后旧数据原地复活（约 19/20 次必现）。
 * 时间戳才是"谁更新"的可靠依据，完整度只做同刻平局时的兜底。
 */
export function pickBest(copies: (string | null)[]): string | null {
  const list = copies.filter((c): c is string => !!c && !!parseState(c));
  if (!list.length) return null;
  list.sort((a, b) => updatedAtOf(b) - updatedAtOf(a) || scoreRaw(b) - scoreRaw(a));
  return list[0];
}

/** 同步读：先本地镜像（启动极快） */
export function loadPersistedSync(): string | null {
  return pickBest([safeGet(LS_MAIN), safeGet(LS_BACKUP), safeGet(LS_SNAPSHOT)]);
}

/** 异步读：含 IndexedDB，启动后若发现更新的数据会回调 */
export async function loadPersistedDeep(): Promise<string | null> {
  const idb = await idbGet(IDB_KEY);
  return pickBest([loadPersistedSync(), idb]);
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // 配额打满 / 隐私模式：必须让调用方知道，否则 UI 会一直显示"已保存"
    return false;
  }
}

/** 多副本写入 + 时间戳 + 自动快照；返回主副本是否写入成功（写盘失败不能再报"已保存"） */
export function savePersisted(payload: unknown): boolean {
  const raw = JSON.stringify(payload);
  const ok = safeSet(LS_MAIN, raw);
  if (!ok) return false;
  safeSet(LS_BACKUP, raw);
  safeSet(LS_LAST_SAVE, String(Date.now()));
  // 每 20 次保存做一次 snapshot（防覆盖损坏）
  try {
    const n = Number(localStorage.getItem(SAVE_COUNT_KEY) || '0') + 1;
    localStorage.setItem(SAVE_COUNT_KEY, String(n));
    if (n % 20 === 1) safeSet(LS_SNAPSHOT, raw);
  } catch {
    safeSet(LS_SNAPSHOT, raw);
  }
  void idbSet(IDB_KEY, raw);
  return true;
}

/**
 * 彻底清空所有持久化副本（含快照与 IndexedDB）。
 * 只清 main/backup 是不够的：snapshot 与 IDB 会在下次启动时把旧数据"复活"。
 */
export async function clearAllPersisted(): Promise<void> {
  try {
    localStorage.removeItem(LS_MAIN);
    localStorage.removeItem(LS_BACKUP);
    localStorage.removeItem(LS_SNAPSHOT);
    localStorage.removeItem(LS_LAST_SAVE);
    localStorage.removeItem(SAVE_COUNT_KEY);
  } catch {
    /* ignore */
  }
  await idbDelete(IDB_KEY);
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
