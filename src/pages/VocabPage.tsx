/**
 * 多元背词 — 模式：每日 / 闪卡 / 选择 / 拼写 / 听写 / 快刷 / 词库
 * 断点续学：store 会话记忆，重启从上次位置继续，不从头开始
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Volume2,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  BookOpen,
  Shuffle,
  PenLine,
  Headphones,
  Zap,
  Check,
  X,
} from 'lucide-react';
import { store, vocabKey } from '../lib/store';
import { isNew, sm2Update } from '../lib/srs';
import { tts } from '../lib/tts';
import { sfx } from '../lib/sfx';
import { cn } from '../lib/cn';
import { toast } from '../lib/toast';

export interface Word {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  level: number;
  freq: number;
  collocations?: string[];
  similar?: string[];
  tip?: string;
  exampleZh?: string;
  forms?: Record<string, string>;
}

type Mode = 'daily' | 'flashcard' | 'choice' | 'spelling' | 'listening' | 'quick' | 'browse';

const MODES: { key: Mode; label: string; icon: typeof BookOpen; desc: string }[] = [
  { key: 'daily', label: '每日学习', icon: BookOpen, desc: '新词+复习，按计划推进' },
  { key: 'flashcard', label: '闪卡', icon: Shuffle, desc: '看词想义，SM-2 评分' },
  { key: 'choice', label: '选择题', icon: Check, desc: '四选一释义自测' },
  { key: 'spelling', label: '拼写', icon: PenLine, desc: '看释义拼单词' },
  { key: 'listening', label: '听写', icon: Headphones, desc: '听音拼写' },
  { key: 'quick', label: '快刷', icon: Zap, desc: '认识/不认识极速过' },
  { key: 'browse', label: '词库', icon: BookOpen, desc: '浏览全部词条' },
];

const vocabCache = new Map<number, Word[]>();

async function loadVocab(level: 4 | 6): Promise<Word[]> {
  if (vocabCache.has(level)) return vocabCache.get(level)!;
  const res = await fetch(`/data/vocab-cet${level}.json`);
  if (!res.ok) throw new Error('词库加载失败');
  const list = (await res.json()) as Word[];
  const sorted = [...list].sort((a, b) => (b.freq || 0) - (a.freq || 0));
  vocabCache.set(level, sorted);
  return sorted;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, '');
}

function shuffleArr<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function ActionBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'grid min-h-12 min-w-12 flex-1 place-items-center rounded-2xl border border-border/70 bg-background active:scale-95',
        active && 'border-primary/50 bg-primary-soft',
      )}
    >
      {children}
    </button>
  );
}

export default function VocabPage() {
  const [state, setState] = useState(store.get());
  const [words, setWords] = useState<Word[]>([]);
  const [showModes, setShowModes] = useState(false);
  const level = state.settings.examLevel === 'CET-6' ? 6 : 4;
  const bookKey = state.settings.examLevel;

  const session = store.getVocabSession(bookKey);
  const [mode, setMode] = useState<Mode>((session?.mode as Mode) || 'flashcard');
  const [idx, setIdx] = useState(() => store.getVocabSession(bookKey)?.idx ?? store.getVocabIdx(bookKey));
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [choiceOpts, setChoiceOpts] = useState<{ text: string; ok: boolean }[]>([]);
  const [choicePicked, setChoicePicked] = useState<string | null>(null);
  const [spellInput, setSpellInput] = useState('');
  const [spellChecked, setSpellChecked] = useState(false);
  // 今日新学 / 复习从词进度派生（srs 的 firstAt/lastAt）：
  // 跨天自动归零，也不再与首页进度环出现"两个计数器各说各话"
  const counters = store.dailyCounters(bookKey);
  const sessionNew = counters.learned;
  const sessionRev = counters.reviewed;
  /** 本轮已评分，防止「回看上一个」后重复评分导致 reps 多加 */
  const [rated, setRated] = useState(false);
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [searchJump, setSearchJump] = useState('');
  const [displayWords, setDisplayWords] = useState<Word[]>(words);

  useEffect(() => store.subscribe(() => setState(store.get())), []);
  useEffect(() => {
    tts.warm();
    const t = window.setTimeout(() => {
      void loadVocab(level === 4 ? 6 : 4).catch(() => {});
    }, 4000);
    return () => window.clearTimeout(t);
  }, [level]);

  useEffect(() => {
    if (!onlyWeak) {
      setDisplayWords(words);
      return;
    }
    setDisplayWords(store.listWeakWords(words, level) as Word[]);
  }, [onlyWeak, words, level]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadVocab(level)
      .then((list) => {
        if (cancelled) return;
        const sort = state.settings.vocabSort || 'freq';
        let arranged = list;
        if (sort === 'alpha') arranged = [...list].sort((a, b) => a.word.localeCompare(b.word));
        else if (sort === 'random') arranged = [...list].sort(() => Math.random() - 0.5);
        setWords(arranged);
        const s = store.getVocabSession(bookKey);
        const savedIdx = s?.idx ?? store.getVocabIdx(bookKey);
        setIdx(Math.min(Math.max(0, savedIdx), Math.max(0, arranged.length - 1)));
        setMode((s?.mode as Mode) || 'flashcard');
        if (s?.idx != null && s.idx > 0) {
          toast(`继续上次：${s.lastWord || '词汇'} · 第 ${s.idx + 1} 词 · ${MODES.find((m) => m.key === s.mode)?.label || ''}`, 'info', 2800);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, bookKey, state.settings.vocabSort]);

  const jumpToWord = () => {
    const k = searchJump.trim().toLowerCase();
    if (!k || !words.length) return;
    if (/^\d+$/.test(k)) {
      const n = Number(k);
      const next = Math.max(0, Math.min(words.length - 1, n - 1));
      setIdx(next);
      persist({ idx: next });
      toast(`跳到第 ${next + 1} 词`, 'info', 1000);
      return;
    }
    const pos = words.findIndex((x) => x.word.toLowerCase() === k || x.word.toLowerCase().startsWith(k));
    if (pos >= 0) {
      setIdx(pos);
      persist({ idx: pos });
      toast(`找到 ${words[pos].word}`, 'success', 1200);
    } else {
      toast('未找到该词', 'error');
    }
  };

  const w = words[idx];
  const key = w ? vocabKey(level, w.id) : '';
  const fav = w ? store.isFavorite(key) : false;
  const progress = w ? store.getVocab(key) : null;
  const mastery = progress?.mastery || 0;
  const learnedCount = useMemo(() => {
    return Object.keys(state.vocab).filter((k) => k.startsWith(`${level}-`) && (state.vocab[k]?.reps || 0) > 0).length;
  }, [state.vocab, level]);

  // 持久化会话
  const persist = (patch: Partial<Parameters<typeof store.saveVocabSession>[1]>) => {
    store.saveVocabSession(bookKey, {
      mode,
      idx,
      todayNew: sessionNew,
      todayReview: sessionRev,
      lastWordId: w?.id,
      lastWord: w?.word,
      ...patch,
    });
  };

  useEffect(() => {
    if (!words.length) return;
    persist({ mode, idx });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode, words.length, bookKey]);

  // 选择题选项
  useEffect(() => {
    if (!w || !words.length || mode !== 'choice') {
      setChoiceOpts([]);
      return;
    }
    const others = shuffleArr(words.filter((x) => x.id !== w.id)).slice(0, 3);
    const opts = shuffleArr([
      { text: w.meaning, ok: true },
      ...others.map((o) => ({ text: o.meaning, ok: false })),
    ]);
    setChoiceOpts(opts);
    setChoicePicked(null);
  }, [w?.id, mode, words]);

  // 自动朗读（闪卡/听写/快刷）
  useEffect(() => {
    if (!w || !state.settings.autoSpeak) return;
    if (mode !== 'flashcard' && mode !== 'listening' && mode !== 'quick' && mode !== 'daily') return;
    const t = window.setTimeout(() => {
      setSpeaking(true);
      void tts.speak(w.word, () => setSpeaking(false));
    }, 180);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode, state.settings.autoSpeak]);

  const speak = (text: string) => {
    if (!text) return;
    setSpeaking(true);
    void tts.speak(text, () => setSpeaking(false));
  };

  const go = (n: number) => {
    setFlipped(false);
    setSpellInput('');
    setSpellChecked(false);
    setChoicePicked(null);
    setRated(false);
    const next = Math.max(0, Math.min(words.length - 1, idx + n));
    setIdx(next);
    persist({ idx: next });
  };

  /**
   * 唯一评分入口 —— 状态机在 lib/srs.ts，计数与音效都在这里。
   * 修掉三处旧问题：① 答错的词 reps 归零后不再被当新词（isNew 看 status）；
   * ② 新词/复习分类只按"评分前是不是新词"，不再无条件按复习计；
   * ③ 每条路径只写一次 store。
   */
  const commit = (q: number) => {
    if (!w) return;
    const prev = store.getVocab(key);
    const wasNew = isNew(prev);
    store.setVocab(key, sm2Update(prev, q, Date.now(), w.word));
    store.recordStudy(0, wasNew ? 1 : 0, wasNew ? 0 : 1);
    if (q >= 3) sfx.correct();
    else sfx.wrong();
  };

  const gradeAndNext = (q: number) => {
    if (!w || rated) return;
    // 默认不强制翻面；设置里可打开 requireFlip
    if (!flipped && state.settings.requireFlip) {
      setFlipped(true);
      toast('设置要求先看释义（可在设置关闭）', 'info');
      return;
    }
    setRated(true);
    commit(q);
    const nextIdx = Math.min(words.length - 1, idx + 1);
    persist({ idx: nextIdx, mode });
    go(1);
  };

  const quickMark = (known: boolean) => {
    if (!w || rated) return;
    setRated(true);
    commit(known ? 4 : 1);
    const nextIdx = Math.min(words.length - 1, idx + 1);
    persist({ idx: nextIdx, mode });
    sfx.click();
    go(1);
  };

  const checkChoice = (opt: { text: string; ok: boolean }) => {
    if (choicePicked || !w) return;
    setChoicePicked(opt.text);
    commit(opt.ok ? 4 : 1);
    toast(opt.ok ? '正确' : `正确：${w.meaning}`, opt.ok ? 'success' : 'error');
    persist({ idx, mode });
    // 答完自动前进，避免卡在原题
    const adv = state.settings.autoAdvanceMs || 0;
    if (adv > 0) window.setTimeout(() => go(1), opt.ok ? adv : Math.max(adv, 900));
  };

  const checkSpell = () => {
    if (!w || !spellInput.trim()) return;
    const ok = spellInput.trim().toLowerCase() === w.word.toLowerCase();
    setSpellChecked(true);
    commit(ok ? 4 : 1);
    toast(ok ? '正确' : `正确拼写：${w.word}`, ok ? 'success' : 'error');
    persist({ idx, mode });
    const adv = state.settings.autoAdvanceMs || 0;
    if (adv > 0) window.setTimeout(() => go(1), ok ? adv : Math.max(adv, 900));
  };

  /** 每日模式队列：未学习优先 + 未掌握补位，受 dailyWordTarget 限制 */
  const dailyQueue = useMemo(() => {
    if (!words.length) return [] as { id: number; word: string; key: string }[];
    // 用 bookKey（CET-4/CET-6）与会话键一致
    return store.buildDailyNewQueue(words, bookKey);
  }, [words, bookKey, state.ui.vocabSession, state.vocab, state.settings.dailyWordTarget]);

  const dailyRemaining = store.dailyNewRemaining(bookKey);

  /** 每日模式：优先「未掌握」的词，已学会的往后排 */
  const nextUnlearnedIdx = (from: number) => {
    // 若队列非空，跳到队列中第一个尚未在当前位置的词
    if (dailyQueue.length) {
      const first = dailyQueue[0];
      const pos = words.findIndex((x) => x.id === first.id);
      if (pos >= 0) return pos;
    }
    for (let i = from; i < words.length; i++) {
      const p = store.getVocab(vocabKey(level, words[i].id));
      if (!p || p.reps === 0 || p.mastery < 0.6) return i;
    }
    return from;
  };

  const startMode = (m: Mode) => {
    let startIdx = idx;
    if (m === 'daily') {
      const remaining = store.dailyNewRemaining(bookKey);
      if (remaining <= 0) {
        if (state.settings.enforceDailyQuota) {
          toast(`今日新词目标 ${state.settings.dailyWordTarget} 已完成（设置可关闭严格模式）`, 'success');
        } else {
          toast(`今日目标 ${state.settings.dailyWordTarget} 已满，仍可继续自由学习`, 'info');
        }
        if (state.settings.enforceDailyQuota && m === 'daily') {
          // 严格模式仍进入，但不自动跳队列
        } else {
          startIdx = nextUnlearnedIdx(idx);
        }
      } else {
        startIdx = nextUnlearnedIdx(idx);
      }
    }
    setIdx(startIdx);
    setMode(m);
    setFlipped(false);
    setSpellInput('');
    setSpellChecked(false);
    setChoicePicked(null);
    setShowModes(false);
    persist({ mode: m, idx: startIdx });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded-lg bg-muted" />
        <div className="h-72 rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">词库加载失败</p>
        <button type="button" className="mt-3 rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white" onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    );
  }

  // 模式选择页
  if (showModes || !mode) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-emerald-500/10 dark:to-teal-500/10">
          <div className="text-lg font-black">背单词 · 多元模式</div>
          <p className="text-xs text-muted-foreground">
            {state.settings.examLevel} · 已学 {learnedCount} 词 · 库内 {words.length} · 每日目标{' '}
            {state.settings.dailyWordTarget}
          </p>
        </div>

        {session && (session.idx > 0 || session.todayNew > 0 || session.todayReview > 0) && (
          <button
            type="button"
            onClick={() => startMode((session.mode as Mode) || 'flashcard')}
            className="flex w-full items-center justify-between rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3"
          >
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Continue</div>
              <div className="text-sm font-black text-ink-teal">
                继续上次 · {MODES.find((m) => m.key === session.mode)?.label} · 第 {(session.idx || 0) + 1} 词
                {session.lastWord ? ` · ${session.lastWord}` : ''}
              </div>
              <div className="text-[11px] text-muted-foreground">
                今日新词 {session.todayNew || 0} · 复习 {session.todayReview || 0}
              </div>
            </div>
            <span className="text-xl">▶</span>
          </button>
        )}

        <div className="stagger grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => startMode(m.key)}
                className="rounded-2xl border border-border/60 bg-card p-3 text-left shadow-sm"
              >
                <Icon className="size-5 text-ink-teal" />
                <div className="mt-2 text-sm font-black">{m.label}</div>
                <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                {m.key === 'daily' && (
                  <div className="mt-1 text-[10px] font-bold text-ink-teal">
                    今日剩余 {dailyRemaining} 新词{dailyQueue.length ? ` · 队列 ${dailyQueue.length}` : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const modeLabel = MODES.find((m) => m.key === mode)?.label || '';

  return (
    <div className="space-y-3">
      {/* 顶栏：模式 / 进度 / 切换 — 会话记忆可见 */}
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted-foreground">
        <button type="button" className="rounded-full bg-primary-soft px-3 py-1 font-bold text-ink-teal" onClick={() => setShowModes(true)}>
          ← 模式
        </button>
        <span className="truncate">
          {modeLabel} · {state.settings.examLevel} ·{' '}
          <span className="text-foreground tabular-nums">{idx + 1}</span>/{words.length}
        </span>
        <div className="flex items-center gap-1">
          <input
            value={searchJump}
            onChange={(e) => setSearchJump(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && jumpToWord()}
            placeholder="#/词"
            className="w-20 rounded-xl border border-border/60 bg-card px-2 py-1 text-center text-[11px] font-bold outline-none focus:border-primary"
            aria-label="跳词搜索"
          />
          <input
            type="number"
            min={1}
            max={words.length}
            value={idx + 1}
            onChange={(e) => {
              const n = Number(e.target.value) || 1;
              const next = Math.max(0, Math.min(words.length - 1, n - 1));
              setIdx(next);
              persist({ idx: next });
            }}
            className="w-16 rounded-xl border border-border/60 bg-card px-2 py-1 text-center text-[11px] font-bold outline-none focus:border-primary"
            aria-label="跳到第几词"
          />
          <button
            type="button"
            className={cn(
              'shrink-0 rounded-full px-2 py-1 text-[10px] font-bold',
              onlyWeak ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
            onClick={() => setOnlyWeak((v) => !v)}
          >
            弱词
          </button>
          <button
            type="button"
            className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold"
            onClick={() => {
              const pool = onlyWeak && displayWords.length ? displayWords : words;
              const pick = pool[Math.floor(Math.random() * pool.length)];
              const pos = words.findIndex((x) => x.id === pick.id);
              if (pos >= 0) {
                setIdx(pos);
                persist({ idx: pos });
              }
            }}
          >
            随机
          </button>
          <button
            type="button"
            className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold"
            onClick={() => {
              if (!confirm('从头开始会清空本词书会话进度（词掌握记录保留）。确定？')) return;
              store.resetVocabSession(bookKey);
              setIdx(0);
              setRated(false);
              toast('已从头开始', 'info');
            }}
          >
            从头
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
        <span>
          今日新词 {sessionNew}
        </span>
        <span>·</span>
        <span>复习 {sessionRev}</span>
        {mode === 'daily' && (
          <>
            <span>·</span>
            <span className="text-ink-teal">剩余名额 {dailyRemaining}</span>
          </>
        )}
        {onlyWeak && (
          <>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-300">弱词 {displayWords.length}</span>
          </>
        )}
        <span>·</span>
        <span>掌握度 {Math.round(mastery * 100)}%</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-[#00B894] to-cyan-400" style={{ width: `${Math.round(mastery * 100)}%` }} />
      </div>

      {/* ═══ 卡片区 ═══ */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        {/* 听写：先出声音 */}
        {mode === 'listening' && (
          <div className="text-center">
            <button type="button" onClick={() => speak(w.word)} className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary text-white">
              <Volume2 className={cn('size-7', speaking && 'animate-pulse')} />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">点击播放，听音拼写</p>
            {!spellChecked && (
              <input
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkSpell()}
                placeholder="输入你听到的单词"
                className="mt-4 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-center text-lg font-black outline-none focus:border-primary"
              />
            )}
            {spellChecked && (
              <div className={cn('mt-3 rounded-2xl p-3 text-sm font-bold', spellInput.toLowerCase() === w.word.toLowerCase() ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300')}>
                {w.word} · {w.meaning}
              </div>
            )}
          </div>
        )}

        {/* 拼写 */}
        {mode === 'spelling' && (
          <div>
            <div className="text-xs font-bold text-ink-teal">{w.pos}</div>
            <div className="mt-1 text-lg font-bold">{w.meaning}</div>
            {w.exampleZh && <div className="mt-1 text-xs text-muted-foreground">{w.exampleZh}</div>}
            {!spellChecked ? (
              <input
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkSpell()}
                placeholder="拼写该单词"
                className="mt-4 w-full rounded-2xl border border-border/60 bg-background px-3 py-3 text-center text-xl font-black outline-none focus:border-primary"
              />
            ) : (
              <div className="mt-3 rounded-2xl bg-muted/50 p-3 text-center">
                <div className="text-xl font-black">{w.word}</div>
                <div className="text-xs text-muted-foreground">{w.phonetic}</div>
              </div>
            )}
          </div>
        )}

        {/* 选择题 */}
        {mode === 'choice' && (
          <div>
            <div className="text-2xl font-black">{w.word}</div>
            <div className="text-sm text-muted-foreground">{w.phonetic}</div>
            <div className="mt-4 space-y-2">
              {choiceOpts.map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => checkChoice(opt)}
                  disabled={!!choicePicked}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-3 text-left text-sm',
                    choicePicked && opt.ok && 'border-success bg-success/10',
                    choicePicked === opt.text && !opt.ok && 'border-danger bg-danger/10',
                    !choicePicked && 'border-border/60',
                    choicePicked && !opt.ok && choicePicked !== opt.text && 'opacity-50',
                  )}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 快刷 / 闪卡 / 每日 / 词库 */}
        {(mode === 'flashcard' || mode === 'quick' || mode === 'daily' || mode === 'browse') && (
          <div>
            <button type="button" onClick={() => mode !== 'browse' && setFlipped((f) => !f)} className="w-full text-left">
              <div className="text-3xl font-black tracking-tight">{w.word}</div>
              <div className="mt-1 text-sm text-muted-foreground">{w.phonetic}</div>
              <div className="mt-1 text-xs font-bold text-ink-teal">{w.pos}</div>
              {mode !== 'browse' && !flipped ? (
                <p className="mt-6 rounded-2xl bg-muted/60 px-3 py-4 text-center text-sm text-muted-foreground">
                  点卡片看释义
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-bold">{w.meaning}</p>
                  {w.example && (
                    <p className="text-sm text-foreground/80" dangerouslySetInnerHTML={{ __html: w.example }} />
                  )}
                  {w.exampleZh && <p className="text-xs text-muted-foreground">{w.exampleZh}</p>}
                  {!!w.collocations?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {w.collocations.slice(0, 6).map((c) => (
                        <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{c}</span>
                      ))}
                    </div>
                  )}
                  {w.tip && w.tip !== '—' && (
                    <div className="rounded-2xl bg-primary-soft/50 p-2 text-[11px] text-ink-teal">
                      <BookMarked className="mr-1 inline size-3" />
                      {w.tip}
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 操作条 */}
      <div className="flex items-center gap-2 rounded-3xl border border-border/60 bg-card p-3 shadow-sm">
        <ActionBtn onClick={() => go(-1)} label="上一个">
          <ChevronLeft className="size-5" />
        </ActionBtn>
        <ActionBtn onClick={() => speak(w.word)} label="朗读" active={speaking}>
          <Volume2 className={cn('size-5 text-ink-teal', speaking && 'animate-pulse')} />
        </ActionBtn>
        {(mode === 'listening' || mode === 'spelling') && (
          <ActionBtn
            onClick={() => {
              if (!spellChecked) checkSpell();
              else {
                setSpellChecked(false);
                setSpellInput('');
                go(1);
              }
            }}
            label={spellChecked ? '下一个' : '提交'}
          >
            {spellChecked ? <ChevronRight className="size-5" /> : <Check className="size-5 text-ink-teal" />}
          </ActionBtn>
        )}
        {mode === 'choice' && (
          <ActionBtn onClick={() => go(1)} label="下一题">
            <ChevronRight className="size-5" />
          </ActionBtn>
        )}
        <ActionBtn
          onClick={() => {
            if (!store.get().favorites.includes(key)) {
              store.addFavoriteWord(level, w.id, {
                word: w.word,
                meaning: w.meaning,
                example: w.exampleZh || stripHtml(w.example),
              });
              sfx.click();
              toast('已收藏', 'success');
            } else {
              store.removeFavoriteKey(key);
              toast('已取消收藏', 'info');
            }
          }}
          label="收藏"
          active={fav}
        >
          <Heart className={cn('size-5', fav && 'fill-current text-rose-500')} />
        </ActionBtn>
        {mode !== 'listening' && mode !== 'spelling' && mode !== 'choice' && (
          <ActionBtn onClick={() => go(1)} label="下一个">
            <ChevronRight className="size-5" />
          </ActionBtn>
        )}
      </div>

      {/* 评分 / 快刷 —— browse（词库浏览）不参与评分：翻词库不该静默改写 SM-2 进度 */}
      {(mode === 'flashcard' || mode === 'daily') && (
        <div className="grid grid-cols-4 gap-2">
          {([1, 3, 4, 5] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => gradeAndNext(q)}
              className={cn(
                'rounded-2xl border py-3 text-xs font-black active:scale-95',
                q >= 3 ? 'border-primary/40 bg-primary-soft text-ink-teal' : 'border-border/60 bg-card',
              )}
            >
              {q <= 1 ? '忘了' : q === 3 ? '模糊' : q === 4 ? '记得' : '秒了'}
            </button>
          ))}
        </div>
      )}

      {mode === 'quick' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => quickMark(false)}
            className="flex items-center justify-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-black text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <X className="size-4" /> 不认识
          </button>
          <button
            type="button"
            onClick={() => quickMark(true)}
            className="flex items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-black text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <Check className="size-4" /> 认识
          </button>
        </div>
      )}
    </div>
  );
}
