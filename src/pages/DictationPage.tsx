import { useEffect, useState } from 'react';
import { Volume2, CheckCircle2, RotateCcw } from 'lucide-react';
import { tts } from '../lib/tts';
import { sfx } from '../lib/sfx';
import { store } from '../lib/store';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';

interface Pack {
  id: string;
  level: string;
  title: string;
  sentences: { en: string; zh: string }[];
}

/** 听写 — 断点续学 + 句级评分 */
export default function DictationPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [pack, setPack] = useState<Pack | null>(null);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const [resumePackId, setResumePackId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cetthink_dict_pack');
    } catch {
      return null;
    }
  });
  const [resumeIdx, setResumeIdx] = useState(() => {
    try {
      return Number(localStorage.getItem('cetthink_dict_idx') || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => {
        // 防御：空句子包不可选，避免 undefined 崩溃
        const safe = (p.dictation || []).filter(
          (d: Pack) => d && d.id && Array.isArray(d.sentences) && d.sentences.length > 0,
        );
        setPacks(safe);
      })
      .catch(() => setPacks([]));
  }, []);

  const persist = (packId: string, i: number) => {
    try {
      localStorage.setItem('cetthink_dict_pack', packId);
      localStorage.setItem('cetthink_dict_idx', String(i));
    } catch {
      /* ignore */
    }
    setResumePackId(packId || null);
    setResumeIdx(i);
  };

  const sentence = pack?.sentences?.[idx] || null;

  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const check = () => {
    if (!sentence) return;
    const ok = normalize(input) === normalize(sentence.en);
    setChecked(true);
    setCorrect(ok);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) {
      sfx.correct();
      store.recordStudy(0, 0, 1);
    } else {
      sfx.wrong();
      store.addError({
        type: 'dictation',
        source: pack?.title || '听写',
        question: sentence.zh || sentence.en,
        myAnswer: input || '（空）',
        correctAnswer: sentence.en,
        explain: '对照原句核对连读与拼写',
      });
    }
  };

  const next = () => {
    if (!pack) return;
    setInput('');
    setChecked(false);
    if (idx + 1 < pack.sentences.length) {
      setIdx(idx + 1);
      persist(pack.id, idx + 1);
    } else {
      sfx.done();
      store.recordStudy(Math.max(2, score.total), 0, score.total);
      toast(`本组完成 ${score.ok}/${score.total}`, 'success');
      persist('', 0);
      setPack(null);
      setIdx(0);
      setScore({ ok: 0, total: 0 });
    }
  };

  if (!pack) {
    return (
      <div className="stagger space-y-3">
        {resumePackId && resumeIdx > 0 && packs.some((p) => p.id === resumePackId) && (
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3"
            onClick={() => {
              const p = packs.find((x) => x.id === resumePackId);
              if (!p) return;
              setPack(p);
              setIdx(Math.min(resumeIdx, p.sentences.length - 1));
              setInput('');
              setChecked(false);
              setScore({ ok: 0, total: 0 });
              setTimeout(() => tts.speak(p.sentences[Math.min(resumeIdx, p.sentences.length - 1)]?.en || ''), 120);
            }}
          >
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Continue</div>
              <div className="text-sm font-black text-ink-teal">
                继续听写 · {packs.find((p) => p.id === resumePackId)?.title} · 第 {resumeIdx + 1} 句
              </div>
            </div>
            <span className="text-xl">▶</span>
          </button>
        )}
        {packs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPack(p);
              setIdx(0);
              setInput('');
              setChecked(false);
              setScore({ ok: 0, total: 0 });
              persist(p.id, 0);
              setTimeout(() => tts.speak(p.sentences[0]?.en || ''), 150);
            }}
            className="flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm"
          >
            <div>
              <div className="text-sm font-black">{p.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {p.level} · {p.sentences.length} 句
              </div>
            </div>
            <Volume2 className="size-4 text-muted-foreground" />
          </button>
        ))}
        {!packs.length && <p className="py-12 text-center text-sm text-muted-foreground">加载中…</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" className="text-xs font-bold text-ink-teal" onClick={() => setPack(null)}>
          ← 返回
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {idx + 1}/{pack.sentences.length} · 正确 {score.ok}/{score.total}
        </span>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="text-sm font-black">{pack.title}</div>
        <p className="mt-2 text-xs text-muted-foreground">{sentence?.zh}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white"
            onClick={() => sentence && tts.speak(sentence.en)}
          >
            <Volume2 className="mr-1 inline size-4" />
            播放
          </button>
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-bold"
            onClick={() => sentence && tts.speak(sentence.en)}
          >
            慢速重听
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={checked}
          placeholder="听后写出英文句子…"
          className="mt-4 min-h-[100px] w-full rounded-2xl border border-border/60 bg-background p-3 text-sm leading-6 outline-none focus:border-primary disabled:opacity-70"
        />
        {checked && (
          <div
            className={cn(
              'mt-3 rounded-2xl border p-3 text-sm',
              correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
            )}
          >
            <div className="flex items-center gap-1 font-black">
              <CheckCircle2 className="size-4" />
              {correct ? '正确' : '需订正'}
            </div>
            <p className="mt-1 text-xs opacity-90">参考：{sentence?.en}</p>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {!checked ? (
            <button
              type="button"
              className="col-span-2 rounded-2xl bg-primary py-3 text-sm font-black text-white"
              onClick={check}
            >
              提交
            </button>
          ) : (
            <button
              type="button"
              className="col-span-2 rounded-2xl bg-primary py-3 text-sm font-black text-white"
              onClick={next}
            >
              {idx + 1 < pack.sentences.length ? '下一句' : '完成本组'}
            </button>
          )}
        </div>
        {checked && (
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-2xl border border-border/60 py-2 text-xs font-bold text-muted-foreground"
            onClick={() => {
              setInput('');
              setChecked(false);
              if (sentence) tts.speak(sentence.en);
            }}
          >
            <RotateCcw className="size-3.5" />
            重听重写
          </button>
        )}
      </div>
    </div>
  );
}
