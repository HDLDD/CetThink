import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { store, vocabKey } from '../lib/store';
import { DAY, isDue, sm2Update } from '../lib/srs';
import { tts } from '../lib/tts';
import { sfx } from '../lib/sfx';
import type { Word } from './VocabPage';

async function loadVocab(level: 4 | 6): Promise<Word[]> {
  const res = await fetch(`/data/vocab-cet${level}.json`);
  return res.json();
}

/** 复习页：只练到期词；key 与背词一致（level-id） */
export default function ReviewPage() {
  const [state, setState] = useState(store.get());
  const [queue, setQueue] = useState<Word[]>([]);
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const level = state.settings.examLevel === 'CET-6' ? 6 : 4;

  useEffect(() => store.subscribe(() => setState(store.get())), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadVocab(level)
      .then((all) => {
        if (cancelled) return;
        const now = Date.now();
        // 到期判定与首页/store 共用 srs.isDue（原先这里另写一遍条件，
        // 且要求 reps > 0 —— 答错后 reps 归零的词从此永远进不了复习队列）
        const due = all.filter((w) => isDue(store.getVocab(vocabKey(level, w.id)), now));
        // 优先最久未复习
        due.sort((a, b) => {
          const pa = store.getVocab(vocabKey(level, a.id));
          const pb = store.getVocab(vocabKey(level, b.id));
          return (pa?.due || 0) - (pb?.due || 0);
        });
        // 不再硬截 50：截断后页面会谎报"当前没有到期复习"
        setQueue(due);
        setI(0);
        setShow(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, state.settings.examLevel]);

  const w = queue[i];

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">加载复习队列…</p>;

  if (!w) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-center">
        <div className="text-3xl">🎉</div>
        <p className="mt-2 font-black">当前没有到期复习</p>
        <p className="mt-1 text-sm text-muted-foreground">
          在「背词」里学过并评分后，SM-2 会按间隔把词排进这里
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/vocab" className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white">
            去背词（每日/闪卡）
          </Link>
          <Link to="/errors" className="rounded-2xl border border-border/60 px-4 py-2.5 text-sm font-bold">
            错题本
          </Link>
        </div>
      </div>
    );
  }

  const key = vocabKey(level, w.id);

  const grade = (q: number) => {
    const prev = store.getVocab(key);
    // 与背词页共用 sm2Update：原先这里 mastery +0.15/-0.2、间隔 max(i, i*e)，
    // 与背词页的 +0.2/-0.15、max(1, i*e) 分歧，同一个词两页结果不同
    store.setVocab(key, sm2Update(prev, q, Date.now(), w.word));
    store.recordStudy(0, 0, 1);
    if (q >= 3) sfx.correct();
    else sfx.wrong();
    setShow(false);
    setI((n) => n + 1);
  };

  const p = store.getVocab(key);
  const nextDays = p && p.status !== 'new' ? Math.max(0, Math.round((p.due - Date.now()) / DAY)) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground">
          到期 {queue.length - i} 个{nextDays != null ? ` · 本轮词下次复习 ${nextDays} 天后` : ''}
        </p>
        <button
          type="button"
          className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold"
          onClick={() => {
            if (confirm('确定结束本轮复习？')) setI(queue.length);
          }}
        >
          结束本轮
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShow(true)}
        className="w-full rounded-3xl border border-border/60 bg-card p-6 text-left shadow-sm"
      >
        <div className="text-3xl font-black">{w.word}</div>
        <div className="mt-1 text-sm text-muted-foreground">{w.phonetic}</div>
        {show ? (
          <div className="mt-4 space-y-1">
            <p className="text-base font-bold">{w.meaning}</p>
            {w.example && (
              <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: w.example }} />
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">点击显示释义，再评分</p>
        )}
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-2xl border border-border/60 bg-card py-3 text-sm font-bold"
          onClick={() => tts.speak(w.word)}
        >
          <Volume2 className="mr-1 inline size-4" />
          朗读
        </button>
        {show &&
          [1, 3, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => grade(q)}
              className="flex-1 rounded-2xl py-3 text-sm font-black active:scale-95"
              style={{
                background: q >= 3 ? undefined : undefined,
              }}
              // 样式：忘了=描边，记得=主色
              data-q={q}
            >
              <span
                className={
                  q === 1
                    ? 'block w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                    : q === 3
                      ? 'block w-full rounded-2xl border border-amber-200 bg-amber-50 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                      : 'block w-full rounded-2xl bg-primary py-3 text-white'
                }
              >
                {q === 1 ? '忘了' : q === 3 ? '模糊' : '记得'}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
