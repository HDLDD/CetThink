import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../lib/cn';
import { tts } from '../lib/tts';
import { usePageMemory } from '../lib/page-memory';

interface RootEntry {
  id: string;
  root: string;
  meaning: string;
  words: string[];
}
interface SynEntry {
  id: string;
  group: string;
  words: string[];
  note?: string;
}

type Tab = 'roots' | 'synonyms' | 'collocations';

export default function SkillsPage() {
  const [tab, setTab] = usePageMemory<Tab>('skills-tab', 'roots');
  const [data, setData] = useState<{ rootsDictionary?: RootEntry[]; synonyms?: SynEntry[]; collocations?: { id: string; topic: string; pairs: { phrase: string; meaning: string }[] }[] }>({});
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => setData(p))
      .catch(() => setData({}));
  }, []);

  const roots = data.rootsDictionary || [];
  const syns = data.synonyms || [];
  const cols = data.collocations || [];

  const filteredRoots = useMemo(() => {
    const k = kw.trim().toLowerCase();
    if (!k) return roots.slice(0, 80);
    return roots.filter(
      (r) => r.root.toLowerCase().includes(k) || r.meaning.includes(kw) || r.words.some((w) => w.toLowerCase().includes(k)),
    );
  }, [roots, kw]);

  const filteredSyn = useMemo(() => {
    const k = kw.trim().toLowerCase();
    if (!k) return syns.slice(0, 60);
    return syns.filter((s) => s.group.includes(kw) || s.words.some((w) => w.toLowerCase().includes(k)));
  }, [syns, kw]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['roots', `词根字典 · ${roots.length}`],
            ['synonyms', `近义辨析 · ${syns.length}`],
            ['collocations', `搭配 · ${cols.length}`],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
              tab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索词根 / 释义 / 单词…"
          className="w-full rounded-2xl border border-border/60 bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {tab === 'roots' && (
        <div className="stagger space-y-2">
          {!roots.length && !kw && <p className="py-8 text-center text-sm text-muted-foreground">词根数据加载中…</p>}
          {!filteredRoots.length && !!roots.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">无匹配词根</p>
          )}
          {filteredRoots.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setOpen(open === r.id ? null : r.id)}
              className="w-full rounded-2xl border border-border/60 bg-card p-3 text-left"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-sm font-black text-ink-teal">{r.root}</span>
                <span className="text-xs font-bold text-muted-foreground">{r.meaning}</span>
              </div>
              {open === r.id && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.words.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void tts.speak(w);
                      }}
                      className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-ink-teal"
                    >
                      {w} 🔊
                    </button>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {tab === 'synonyms' && (
        <div className="stagger space-y-2">
          {!filteredSyn.length && <p className="py-8 text-center text-sm text-muted-foreground">无匹配近义组</p>}
          {filteredSyn.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-3">
              <div className="text-sm font-black">{s.group}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.words.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => void tts.speak(w)}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {w} 🔊
                  </button>
                ))}
              </div>
              {s.note && <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{s.note}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'collocations' && (
        <div className="stagger space-y-3">
          {cols.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-3">
              <div className="text-sm font-black">{c.topic}</div>
              <ul className="mt-2 space-y-1.5">
                {c.pairs.map((p) => (
                  <li key={p.phrase} className="flex items-baseline justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => void tts.speak(p.phrase)}
                      className="font-semibold text-foreground"
                    >
                      {p.phrase} 🔊
                    </button>
                    <span className="text-muted-foreground">{p.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
