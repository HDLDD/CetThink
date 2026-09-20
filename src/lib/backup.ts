/**
 * backup — 对齐 NativeThink：备份全部作用域键 + store + 成就 + IndexedDB
 * 防更新/重装丢数据
 */
import { store } from './store';
import { exportScopedKeys, importScopedKeys, safeStorage } from './safe-storage';
import { loadPersistedDeep } from './persist';

export interface IBackupFile {
  app: 'cetthink';
  version: 3;
  exportedAt: string;
  /** NativeThink 风格：作用域键值全量 */
  data: Record<string, string>;
  /** 结构化 store（便于直接恢复） */
  store?: unknown;
  achievements?: string[];
  idb?: Record<string, string>;
}

export async function exportBackup(): Promise<{ raw: string; localStorageCount: number }> {
  const data = exportScopedKeys();
  // store 写入 data 中主键，保证旧/新备份都能恢复
  let storePayload = store.get();
  try {
    const deep = await loadPersistedDeep();
    if (deep) {
      const parsed = JSON.parse(deep) as typeof storePayload;
      if (Object.keys(parsed.vocab || {}).length >= Object.keys(storePayload.vocab || {}).length) {
        storePayload = parsed;
      }
    }
  } catch {
    /* ignore */
  }
  data.store_v1 = JSON.stringify(storePayload);
  data.achievements = localStorage.getItem('cetthink_achievements') || '[]';

  let idb: Record<string, string> | undefined;
  try {
    const idbRaw = localStorage.getItem('cetthink_store_v1') || '';
    if (idbRaw) idb = { store_v1: idbRaw };
  } catch {
    /* ignore */
  }

  const file: IBackupFile = {
    app: 'cetthink',
    version: 3,
    exportedAt: new Date().toISOString(),
    data,
    store: storePayload,
    achievements: JSON.parse(data.achievements || '[]'),
    ...(idb ? { idb } : {}),
  };
  return { raw: JSON.stringify(file, null, 2), localStorageCount: Object.keys(data).length };
}

export async function downloadBackup() {
  const { raw } = await exportBackup();
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  a.href = url;
  a.download = `cetthink-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as IBackupFile & { app?: string; store?: unknown };
    if (parsed.app !== 'cetthink') throw new Error('备份不是 CetThink 格式');

    // v3：作用域键全量
    if (parsed.data && typeof parsed.data === 'object') {
      importScopedKeys(parsed.data);
    }
    // 结构化 store 优先
    if (parsed.store) store.replace(parsed.store);
    else if (parsed.data?.store_v1) store.replace(JSON.parse(parsed.data.store_v1));

    if (Array.isArray(parsed.achievements)) {
      localStorage.setItem('cetthink_achievements', JSON.stringify(parsed.achievements));
    } else if (parsed.data?.achievements) {
      localStorage.setItem('cetthink_achievements', parsed.data.achievements);
    }
    return true;
  } catch {
    return false;
  }
}

export function storageKeysCount(): number {
  try {
    return exportScopedKeys() ? Object.keys(exportScopedKeys()).length : 0;
  } catch {
    return 0;
  }
}

export function describeStorageScope(): string {
  try {
    return safeStorage.getPrefixedKey('');
  } catch {
    return 'cetthink_';
  }
}
