import { useEffect, useMemo, useState } from 'react';
import { Heart, Volume2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { store } from '../lib/store';
import { tts } from '../lib/tts';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';

interface Word {
  id: number;
  word: string;
  meaning: string;
  phonetic?: string;
  level: number;
}

/** 收藏本：以 store.favorites 为真相，自动补全词义 */
export default function FavoritesPage() {
  const [state, setState] = useState(store.get());
  const [dict, setDict] = useState<Map<string, Word>>(new Map());
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | '4' | '6' | 'other'>('all');

  useEffect(() => store.subscribe(() => setState(store.get())), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/data/vocab-cet4.json').then((r) => r.json()),
      fetch('/data/vocab-cet6.json').then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        const m = new Map<string, Word>();
        for (const w of a as Word[]) m.set(`4-${w.id}`, w);
        for (const w of b as Word[]) m.set(`6-${w.id}`, w);
        setDict(m);
      })
      .catch(() => setDict(new Map()));
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    return state.favorites.map((key) => {
      const meta = store.getFavoriteMeta(key);
      const w = dict.get(key);
      const level = key.startsWith('4-') ? 4 : key.startsWith('6-') ? 6 : 0;
      return {
        key,
        content: meta?.content || w?.word || key,
        meaning: meta?.meaning || w?.meaning || '',
        phonetic: w?.phonetic || '',
        level,
      };
    });
  }, [state.favorites, dict]);

  const list = items.filter((it) => {
    const okT =
      filter === 'all' ||
      (filter === '4' && it.level === 4) ||
      (filter === '6' && it.level === 6) ||
      (filter === 'other' && it.level === 0);
    const k = q.trim().toLowerCase();
    return okT && (!k || it.content.toLowerCase().includes(k) || it.meaning.includes(k));
  });

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-emerald-500/10 dark:to-teal-500/10">
        <div className="text-lg font-black">我的收藏</div>
        <p className="text-xs text-muted-foreground">
          {items.length} 词 · 与背词页同一份数据，重启仍在
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索单词 / 释义…"
        className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['all', '全部'],
            ['4', '四级'],
            ['6', '六级'],
            ['other', '其它'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
              filter === k ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!list.length && (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
          <Heart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-bold">暂无收藏</p>
          <p className="mt-1 text-xs text-muted-foreground">在背词模式中点心形即可收藏</p>
          <Link to="/vocab" className="mt-3 inline-block text-xs font-bold text-ink-teal">
            去背词 →
          </Link>
        </div>
      )}

      <div className="stagger space-y-2">
        {list.map((it) => (
          <div key={it.key} className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">{it.content}</span>
                {it.phonetic && <span className="text-[11px] text-muted-foreground">{it.phonetic}</span>}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{it.meaning || '—'}</div>
            </div>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/60"
              onClick={() => void tts.speak(it.content)}
              aria-label="朗读"
            >
              <Volume2 className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/60"
              onClick={() => {
                store.removeFavoriteKey(it.key);
                toast('已取消收藏', 'info');
              }}
              aria-label="取消收藏"
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
