import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { store } from '../lib/store';
import { sfx } from '../lib/sfx';
import { toast } from '../lib/toast';
import { tts } from '../lib/tts';
import { cn } from '../lib/cn';
import { usePageMemory } from '../lib/page-memory';
import AnswerDetail from '../components/AnswerDetail';

interface GQuestion {
  id: string;
  stem: string;
  options: string[];
  answer: number;
  explain?: string;
}

interface GTopic {
  id: string;
  title: string;
  category: string;
  level: string;
  rules: string[];
  examples: string[];
  questions: GQuestion[];
}

interface GrammarBank {
  topics: GTopic[];
  categories: string[];
  stats: { topics: number; questions: number };
}

type Mode = 'list' | 'learn' | 'practice';

export default function GrammarPage() {
  const [bank, setBank] = useState<GrammarBank | null>(null);
  const [mode, setMode] = useState<Mode>('list');
  const [catFilter, setCatFilter] = usePageMemory('grammar-cat', '全部');
  const [lastTopicId, setLastTopicId] = usePageMemory<string | null>('grammar-last', null);
  const [kw, setKw] = useState('');
  const [active, setActive] = useState<GTopic | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    fetch('/data/grammar.json')
      .then((r) => r.json())
      .then((p) => setBank(p))
      .catch(() => setBank({ topics: [], categories: [], stats: { topics: 0, questions: 0 } }));
  }, []);

  const categories = useMemo(() => {
    if (!bank) return ['全部'];
    return ['全部', ...(bank.categories || [])];
  }, [bank]);

  const list = useMemo(() => {
    if (!bank) return [];
    const k = kw.trim();
    return bank.topics.filter((t) => {
      const okCat = catFilter === '全部' || t.category === catFilter;
      const okKw =
        !k ||
        t.title.includes(k) ||
        t.category.includes(k) ||
        t.rules.some((r) => r.includes(k)) ||
        (t.level || '').includes(k);
      return okCat && okKw;
    });
  }, [bank, catFilter, kw]);

  const openTopic = (t: GTopic) => {
    setActive(t);
    setQIdx(0);
    setPicked(null);
    setChecked(false);
    setScore({ ok: 0, total: 0 });
    setShowRules(true);
    setMode('learn');
    setLastTopicId(t.id);
  };

  const checkAnswer = () => {
    if (!active || picked == null) return;
    const q = active.questions[qIdx];
    const ok = picked === q.answer;
    setChecked(true);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) {
      sfx.correct();
      store.recordStudy(0, 0, 1);
    } else {
      sfx.wrong();
      store.addError({
        type: 'grammar',
        source: active.title,
        question: q.stem,
        myAnswer: q.options[picked] || '未作答',
        correctAnswer: q.options[q.answer],
        explain: q.explain || active.rules[0] || '',
      });
    }
  };

  const nextQ = () => {
    if (!active) return;
    setPicked(null);
    setChecked(false);
    if (qIdx + 1 < active.questions.length) setQIdx((i) => i + 1);
    else {
      sfx.done();
      toast(`本专题 ${score.ok}/${score.total} 正确`, 'success');
      store.recordStudy(3, 0, 0);
      setMode('list');
      setActive(null);
    }
  };

  if (!bank) {
    return <p className="py-16 text-center text-sm text-muted-foreground">语法库加载中…</p>;
  }

  if (mode === 'list' || !active) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-emerald-500/10 dark:to-teal-500/10">
          <div className="text-lg font-black">语法专项</div>
          <p className="mt-1 text-xs text-muted-foreground">
            四六级高频语法 · <strong className="text-foreground">{bank.stats?.topics || list.length}</strong> 专题 ·{' '}
            <strong className="text-foreground">{bank.stats?.questions || 0}</strong> 道练习 · 错题自动进错题本
          </p>
          {!!lastTopicId && !!bank.topics.find((t) => t.id === lastTopicId) && (
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-primary/40 bg-primary-soft/50 px-3 py-2 text-left text-xs font-bold text-ink-teal"
              onClick={() => {
                const t = bank.topics.find((x) => x.id === lastTopicId);
                if (t) openTopic(t);
              }}
            >
              继续上次专题 · {bank.topics.find((t) => t.id === lastTopicId)?.title}
            </button>
          )}
        </div>

        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索专题 / 规则关键词…"
          className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                catFilter === c ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="stagger space-y-2">
          {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">无匹配专题</p>}
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTopic(t)}
              className="w-full rounded-2xl border border-border/60 bg-card p-3.5 text-left shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-black">{t.title}</div>
                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-ink-teal">
                  {t.level}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{t.category}</span>
                <span>·</span>
                <span>{t.questions?.length || 0} 题</span>
                {!!t.rules?.length && (
                  <>
                    <span>·</span>
                    <span className="truncate">{t.rules[0]}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 学习 + 练习
  const q = active.questions[qIdx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-bold text-ink-teal"
          onClick={() => {
            setMode('list');
            setActive(null);
          }}
        >
          ← 返回语法库
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {active.category} · {score.ok}/{score.total || qIdx}/{active.questions.length}
        </span>
      </div>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">{active.title}</h2>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{active.level}</div>
          </div>
          <button
            type="button"
            className="rounded-2xl bg-primary-soft px-3 py-1.5 text-[11px] font-bold text-ink-teal"
            onClick={() => setShowRules((s) => !s)}
          >
            {showRules ? '收起规则' : '看规则'}
          </button>
        </div>
        {showRules && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-black text-muted-foreground">规则要点</div>
            <ul className="space-y-1.5">
              {active.rules.map((r, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <span className="mr-1 font-black text-ink-teal">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
            {!!active.examples?.length && (
              <div className="mt-2 rounded-2xl bg-muted/50 p-2.5">
                <div className="text-[11px] font-black text-muted-foreground">例句</div>
                {active.examples.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => tts.speak(ex)}
                    className="mt-1 block w-full text-left text-sm text-foreground/90"
                  >
                    {ex} <span className="text-[10px] text-muted-foreground">🔊</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>
            即时练习 {qIdx + 1}/{active.questions.length}
          </span>
          <button
            type="button"
            className="text-ink-teal"
            onClick={() => {
              setShowRules(false);
            }}
          >
            专注答题
          </button>
        </div>
        {q ? (
          <>
            <p className="text-sm font-bold leading-relaxed">{q.stem}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => {
                const stateCls =
                  checked && i === q.answer
                    ? 'border-success bg-success/10'
                    : checked && picked === i
                      ? 'border-danger bg-danger/10'
                      : picked === i
                        ? 'border-primary bg-primary-soft'
                        : 'border-border/60';
                return (
                  <button
                    key={i}
                    type="button"
                    className={cn('w-full rounded-2xl border px-3 py-3 text-left text-sm', stateCls)}
                    onClick={() => {
                      if (checked) return;
                      setPicked(i);
                    }}
                  >
                    <span className="mr-2 font-black text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                    {opt}
                    {checked && i === q.answer && <CheckCircle2 className="ml-1 inline size-4 text-success" />}
                    {checked && picked === i && i !== q.answer && (
                      <XCircle className="ml-1 inline size-4 text-danger" />
                    )}
                  </button>
                );
              })}
            </div>
            {!checked ? (
              <button
                type="button"
                disabled={picked == null}
                className={cn(
                  'mt-4 w-full rounded-2xl py-3 text-sm font-black',
                  picked == null ? 'bg-muted text-muted-foreground' : 'bg-primary text-white',
                )}
                onClick={checkAnswer}
              >
                提交
              </button>
            ) : (
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-black text-white"
                onClick={nextQ}
              >
                {qIdx + 1 < active.questions.length ? '下一题' : '完成本专题'}
              </button>
            )}

            {checked && (
              <AnswerDetail
                question={q.stem}
                options={q.options}
                answer={q.answer}
                picked={picked ?? undefined}
                explain={q.explain || active.rules.join(' ')}
                context={active.examples?.join(' | ')}
                contextLabel="专题例句"
              />
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">本专题暂无练习题</p>
        )}
      </section>
    </div>
  );
}
