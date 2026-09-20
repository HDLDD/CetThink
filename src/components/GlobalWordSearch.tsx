import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tts } from '../lib/tts';
import { cn } from '../lib/cn';

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  level: number;
}

/** 全局查词：按需加载词库，避免一打开就拉 4MB */
export default function GlobalWordSearch() {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState('');
  const [pool, setPool] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Word[]>([]);
  const loadedRef = useState({ done: false })[0];

  useEffect(() => {
    if (!open || loadedRef.done) return;
    setLoading(true);
    Promise.all([
      fetch('/data/vocab-cet4.json').then((r) => (r.ok ? r.json() : [])),
      fetch('/data/vocab-cet6.json').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([a, b]) => {
        const list: Word[] = [...(a as Word[]), ...(b as Word[])];
        setPool(list);
        loadedRef.done = true;
      })
      .catch(() => setPool([]))
      .finally(() => setLoading(false));
  }, [open, loadedRef]);

  useEffect(() => {
    const k = kw.trim().toLowerCase();
    if (!k) {
      setResults([]);
      return;
    }
    const hits: Word[] = [];
    for (const w of pool) {
      if (w.word?.toLowerCase().startsWith(k)) hits.push(w);
      if (hits.length >= 25) break;
    }
    if (hits.length < 15) {
      for (const w of pool) {
        if (hits.some((h) => h.id === w.id && h.level === w.level)) continue;
        if (w.word?.toLowerCase().includes(k) || w.meaning?.includes(kw.trim())) hits.push(w);
        if (hits.length >= 25) break;
      }
    }
    setResults(hits.slice(0, 25));
  }, [kw, pool]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="查词"
        onClick={() => setOpen(true)}
        className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/60 bg-card shadow-sm active:scale-95"
      >
        <Search className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-14 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="搜索单词 / 中文释义…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading && <p className="p-6 text-center text-xs text-muted-foreground">词库加载中…</p>}
              {!loading && !kw && (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  输入英文或中文开始查询{pool.length ? ` · 共 ${pool.length} 词` : ''}
                </p>
              )}
              {!loading && kw && !results.length && (
                <p className="p-6 text-center text-xs text-muted-foreground">无匹配结果</p>
              )}
              {results.map((w) => (
                <button
                  key={`${w.level}-${w.id}`}
                  type="button"
                  onClick={() => void tts.speak(w.word)}
                  className={cn('flex w-full items-start justify-between gap-2 rounded-2xl px-3 py-2.5 text-left hover:bg-muted/60')}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-black">
                      {w.word}
                      <span className="ml-2 text-[10px] font-bold text-muted-foreground">
                        {w.level === 4 ? 'CET-4' : 'CET-6'}
                      </span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {w.phonetic} · {w.meaning}
                    </div>
                  </div>
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-muted-foreground">🔊</span>
                </button>
              ))}
            </div>
            <div className="border-t border-border/60 px-4 py-2 text-center">
              <Link to="/vocab" className="text-[11px] font-bold text-ink-teal" onClick={() => setOpen(false)}>
                去背词页系统学习 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
