import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import { store } from '../lib/store';
import { cn } from '../lib/cn';
import { aiGradeEssay, aiPolishSentence } from '../lib/ai';
import { toast } from '../lib/toast';
import { sfx } from '../lib/sfx';
import { tts } from '../lib/tts';

interface Essay {
  id: string;
  level: string;
  title: string;
  prompt: string;
  essay?: string;
  points?: string[];
}

export default function WritingPage() {
  const [state, setState] = useState(store.get());
  const [text, setText] = useState(store.get().writingDraft);
  const [lib, setLib] = useState<Essay[]>([]);
  const [sel, setSel] = useState<Essay | null>(null);
  const [tab, setTab] = useState<'compose' | 'bank'>('compose');
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [polishSentence, setPolishSentence] = useState('');
  const [polishResult, setPolishResult] = useState('');
  const [polishLoading, setPolishLoading] = useState(false);

  const runPolish = async () => {
    const s = polishSentence.trim();
    if (!s) {
      toast('先输入要润色的英文句子', 'error');
      return;
    }
    setPolishLoading(true);
    try {
      const r = await aiPolishSentence(s);
      setPolishResult(r);
      sfx.correct();
    } catch (e) {
      setPolishResult('AI 暂不可用：' + (e instanceof Error ? e.message : ''));
      sfx.wrong();
    } finally {
      setPolishLoading(false);
    }
  };

  useEffect(() => store.subscribe(() => setState(store.get())), []);
  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => {
        const all: Essay[] = [...(p.writingLibrary || []), ...(p.writingPrompts || [])];
        const m = new Map<string, Essay>();
        for (const e of all) if (!e.id || !m.has(e.id)) m.set(e.id, e);
        setLib([...m.values()]);
      });
  }, []);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const target = state.settings.examLevel === 'CET-6' ? 150 : 120;
  const filtered = lib.filter((e) => e.level === state.settings.examLevel || e.level === 'CET-4' || e.level === 'CET-6' || !e.level);

  const runAiGrade = async () => {
    if (words < 30) {
      toast('先写满 30 词再批改', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const result = await aiGradeEssay(sel?.prompt || `${state.settings.examLevel} 作文`, text);
      setAiFeedback(result);
      sfx.done();
      store.recordStudy(5, 0, 0);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI 批改失败', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['compose', 'bank'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-bold',
              tab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {t === 'compose' ? '我的练笔' : `作文库 · ${lib.length}`}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-sm font-black">写作 / 翻译练笔</div>
          <p className="mt-1 text-xs text-muted-foreground">
            建议 {state.settings.examLevel} 作文不少于 {target} 词 · 本地自动保存
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // 防抖自动保存，杀进程也不丢草稿
              const t = window.setTimeout(() => {
                store.update({ writingDraft: e.target.value });
              }, 400);
              window.clearTimeout(Number(window.sessionStorage.getItem('cetthink_draft_timer') || 0));
              window.sessionStorage.setItem('cetthink_draft_timer', String(t));
            }}
            onBlur={() => store.update({ writingDraft: text })}
            placeholder="Start writing in English..."
            className="mt-3 min-h-[180px] w-full resize-y rounded-2xl border border-border/60 bg-background p-3 text-sm leading-6 outline-none focus:border-primary"
          />
          <div className="mt-2 flex justify-between text-[11px] font-bold text-muted-foreground">
            <span>
              {words} 词 {words >= target ? '· 已达标' : '· 还差 ' + Math.max(0, target - words)}
            </span>
            <button
              type="button"
              className="text-ink-teal"
              onClick={() => {
                store.update({ writingDraft: text });
                store.recordStudy(8, 0, 0);
              }}
            >
              保存并计时
            </button>
          </div>
          {sel && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-soft/40 p-3">
              <div className="text-xs font-black text-ink-teal">当前题目 · {sel.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{sel.prompt}</p>
            </div>
          )}
          <button
            type="button"
            onClick={runAiGrade}
            disabled={aiLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {aiLoading ? 'AI 阅卷中…' : 'AI 批改作文'}
          </button>
          {aiFeedback && (
            <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
              <div className="mb-1 flex items-center gap-1 font-black text-ink-teal">
                <Sparkles className="size-3.5" />
                AI 阅卷报告
              </div>
              {aiFeedback}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3">
            <div className="text-xs font-black">句子润色</div>
            <input
              value={polishSentence}
              onChange={(e) => setPolishSentence(e.target.value)}
              placeholder="粘贴一句英文，AI 帮你改得更地道"
              className="mt-2 w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={polishLoading}
                onClick={runPolish}
                className="flex-1 rounded-2xl bg-primary py-2 text-xs font-black text-white disabled:opacity-60"
              >
                {polishLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : '润色这句'}
              </button>
              {!!polishResult && (
                <button
                  type="button"
                  className="rounded-2xl border border-border/60 px-3 text-xs font-bold"
                  onClick={() => void tts.speak(polishResult.split('\n')[0] || polishSentence)}
                >
                  <Volume2 className="inline size-3.5" />
                  读
                </button>
              )}
            </div>
            {polishResult && (
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-card p-2 text-xs leading-relaxed">{polishResult}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'bank' && (
        <div className="space-y-3">
          {!sel &&
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSel(e)}
                className="w-full rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black">{e.title}</div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {e.level}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{e.prompt}</p>
              </button>
            ))}

          {sel && (
            <div className="rounded-3xl border border-border/60 bg-card p-4">
              <button type="button" className="text-xs font-bold text-ink-teal" onClick={() => setSel(null)}>
                ← 返回作文库
              </button>
              <h2 className="mt-2 text-lg font-black">{sel.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sel.prompt}</p>
              {!!sel.points?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sel.points.map((p) => (
                    <span key={p} className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-ink-teal">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {sel.essay ? (
                <>
                  <div className="mt-4 text-xs font-black text-muted-foreground">参考范文</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{sel.essay}</p>
                </>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">该题暂无范文，可在「我的练笔」中作答</p>
              )}
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-black text-white"
                onClick={() => {
                  setTab('compose');
                  setAiFeedback('');
                }}
              >
                用这道题开始写
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
