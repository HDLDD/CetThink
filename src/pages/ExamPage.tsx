import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Headphones, FileText, Puzzle, PenLine, Languages } from 'lucide-react';
import { store } from '../lib/store';
import { sfx } from '../lib/sfx';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';

interface Exam {
  id: string;
  title: string;
  level: string;
  duration: number;
  sections: { type: string; title: string; count: number; sourceIds: string[] }[];
}

interface ExamProgress {
  examId: string;
  step: number;
  done: Record<string, boolean>;
  startedAt: number;
  durationMin: number;
}

const SECTION_ICON: Record<string, typeof Headphones> = {
  listening: Headphones,
  reading: FileText,
  cloze: Puzzle,
  writing: PenLine,
  translation: Languages,
};

const SECTION_PATH: Record<string, string> = {
  listening: '/listening',
  reading: '/reading',
  cloze: '/reading',
  writing: '/writing',
  translation: '/writing',
};

const PROGRESS_KEY = 'cetthink_exam_progress';

function loadProgress(): ExamProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ExamProgress) : null;
  } catch {
    return null;
  }
}

function saveProgress(p: ExamProgress | null) {
  try {
    if (p) localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [state, setState] = useState(store.get());
  const [active, setActive] = useState<Exam | null>(null);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [doneSections, setDoneSections] = useState<Record<string, boolean>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hasResume, setHasResume] = useState(() => !!loadProgress());
  const resumeRef = useRef<ExamProgress | null>(null);

  useEffect(() => store.subscribe(() => setState(store.get())), []);
  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => setExams((p.mockExams || []).filter((e: Exam) => e?.id && e.sections?.length)));
  }, []);

  // 计时器
  useEffect(() => {
    if (!active || score != null || !startedAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active, score, startedAt]);

  // 持久化模考进度（退出/刷新可续）
  useEffect(() => {
    if (!active || score != null) return;
    saveProgress({
      examId: active.id,
      step,
      done: doneSections,
      startedAt: startedAt || Date.now(),
      durationMin: active.duration,
    });
  }, [active, step, doneSections, startedAt, score]);

  const secKey = (s: { type: string; sourceIds?: string[] }) => s.type + (s.sourceIds || []).join(',');
  const allDone = active
    ? active.sections.every((s) => doneSections[secKey(s)])
    : false;

  const remainSec = useMemo(() => {
    if (!active) return 0;
    const start = startedAt || Date.now();
    return Math.max(0, Math.round(active.duration * 60 - (now - start) / 1000));
  }, [active, startedAt, now]);

  const remainPct = active && startedAt ? remainSec / (active.duration * 60) : 1;

  const finishExam = (exam: Exam, done: Record<string, boolean>) => {
    const doneCount = exam.sections.filter((s) => done[secKey(s)]).length;
    const ratio = doneCount / Math.max(1, exam.sections.length);
    // 时间因子：按时完成不扣分；超时后每超 10% 扣 8 分
    const used = startedAt ? (Date.now() - startedAt) / 1000 / 60 : 0;
    const overtimePenalty = Math.max(0, Math.floor((used - exam.duration) / (exam.duration * 0.1))) * 8;
    const base = exam.level === 'CET-6' ? 425 : 390;
    const s = Math.max(200, Math.round(base + ratio * 165 - overtimePenalty));
    setScore(s);
    store.update({
      examHistory: [
        { id: exam.id, score: s, date: new Date().toISOString().slice(0, 10), title: exam.title },
        ...store.get().examHistory,
      ].slice(0, 20),
    });
    store.recordStudy(Math.round(used) || 15, 0, 0);
    saveProgress(null);
    sfx.done();
    toast(`模考记录：${s} 分（完成度估分${overtimePenalty ? `，超时扣 ${overtimePenalty}` : ''}）`, 'success');
  };

  const startExam = (e: Exam) => {
    setActive(e);
    setStep(0);
    setScore(null);
    setDoneSections({});
    setStartedAt(Date.now());
    setNow(Date.now());
  };

  const resumeExam = () => {
    const p = loadProgress() || resumeRef.current;
    if (!p) return;
    const e = exams.find((x) => x.id === p.examId);
    if (!e) {
      saveProgress(null);
      setHasResume(false);
      toast('上次模考套题不存在，已清除进度', 'info');
      return;
    }
    setActive(e);
    setStep(Math.min(p.step, e.sections.length - 1));
    setDoneSections(p.done || {});
    setStartedAt(p.startedAt);
    setScore(null);
    setHasResume(false);
    toast('已恢复上次模考进度', 'info');
  };

  if (score != null && active) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 text-center">
        <div className="text-4xl">🎯</div>
        <p className="mt-2 text-3xl font-black text-ink-teal">{score}</p>
        <p className="text-sm text-muted-foreground">{active.title} · 完成度估分（非官方标准分）</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link to="/errors" className="rounded-2xl border border-border/60 py-3 text-sm font-bold">
            错题本
          </Link>
          <button
            type="button"
            className="rounded-2xl bg-primary py-3 text-sm font-black text-white"
            onClick={() => {
              setActive(null);
              setScore(null);
              setStep(0);
              setDoneSections({});
              setStartedAt(null);
            }}
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-4">
        {hasResume && (
          <button
            type="button"
            onClick={resumeExam}
            className="flex w-full items-center justify-between rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3"
          >
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Continue</div>
              <div className="text-sm font-black text-ink-teal">继续上次模考</div>
            </div>
            <span className="text-xl">▶</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          模考流程：去作答 → 标记板块 → 全部完成后交卷。估分按完成度，超时会扣分。进度会自动保存。
        </p>
        <div className="stagger space-y-3">
          {exams.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => startExam(e)}
              className="flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm"
            >
              <div>
                <div className="text-sm font-black">{e.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {e.level} · 限时 {e.duration} 分钟 · {e.sections?.length || 0} 板块
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-sm font-black">历史成绩</div>
          {!state.examHistory.length && <p className="mt-2 text-xs text-muted-foreground">还没有模考记录</p>}
          {!!state.examHistory.length && (
            <ul className="mt-2 space-y-1.5">
              {state.examHistory.slice(0, 8).map((h, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {h.date} · {h.title}
                  </span>
                  <span className="font-black text-ink-teal">{h.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const sec = active.sections[step];
  const Icon = SECTION_ICON[sec?.type] || FileText;
  const path = SECTION_PATH[sec?.type] || '/reading';
  const doneFlag = sec ? doneSections[secKey(sec)] : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-bold text-ink-teal"
          onClick={() => {
            // 退出但保留进度
            setActive(null);
            setHasResume(true);
            toast('已保存模考进度，可稍后继续', 'info');
          }}
        >
          ← 暂存退出
        </button>
        <div
          className={cn(
            'rounded-full px-3 py-1 text-xs font-black tabular-nums',
            remainSec < 120 ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-muted text-foreground',
          )}
        >
          ⏱ {fmtClock(remainSec)}
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex justify-between text-xs font-bold text-muted-foreground">
          <span>{active.title}</span>
          <span>
            {step + 1}/{active.sections.length}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / active.sections.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full transition-all', remainSec < 120 ? 'bg-rose-500' : 'bg-amber-400')}
            style={{ width: `${Math.max(0, Math.min(1, remainPct)) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-ink-teal">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black">{sec.title}</h2>
            <p className="text-xs text-muted-foreground">
              约 {sec.count} 题 · 建议 {Math.round(active.duration / active.sections.length)} 分钟
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(sec.sourceIds || []).map((id) => (
            <span key={id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {id}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
          ①「去作答」进入听力/阅读/写作 ② 完成后回来「标记完成」 ③ 全部标记后可交卷。超时扣分。
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to={path} className="rounded-2xl border border-border/60 py-3 text-center text-sm font-bold">
            去作答
          </Link>
          <button
            type="button"
            className={cn(
              'rounded-2xl py-3 text-sm font-black',
              doneFlag ? 'bg-primary-soft text-ink-teal' : 'bg-primary text-white',
            )}
            onClick={() => {
              const key = secKey(sec);
              setDoneSections((d) => ({ ...d, [key]: true }));
              sfx.correct();
              store.recordStudy(5, 0, 0);
              if (step < active.sections.length - 1) setStep((s) => s + 1);
            }}
          >
            {doneFlag ? '已标记 ✓' : '标记完成'}
          </button>
        </div>
        <div className="mt-3 flex justify-between">
          <button
            type="button"
            className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            上一板块
          </button>
          {step < active.sections.length - 1 ? (
            <button
              type="button"
              className="rounded-2xl border border-border/60 px-3 py-2 text-xs font-bold"
              onClick={() => setStep((s) => s + 1)}
            >
              下一板块
            </button>
          ) : (
            <button
              type="button"
              disabled={store.get().settings.examRequireAllDone && !allDone && remainSec > 0}
              title={
                !store.get().settings.examRequireAllDone || allDone || remainSec === 0
                  ? '交卷估分'
                  : '设置要求做完全部板块（可在设置关闭）'
              }
              className={cn(
                'rounded-2xl px-4 py-2 text-xs font-black',
                !store.get().settings.examRequireAllDone || allDone || remainSec === 0
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground',
              )}
              onClick={() => {
                const requireAll = store.get().settings.examRequireAllDone;
                if (requireAll && !allDone && remainSec > 0) {
                  toast('还有板块未标记，或等待时间耗尽（设置里可关闭严格交卷）', 'error');
                  return;
                }
                if (!requireAll && !allDone) {
                  toast('按当前已完成板块估分', 'info');
                }
                finishExam(active, doneSections);
              }}
            >
              交卷估分
            </button>
          )}
        </div>
        {!allDone && remainSec === 0 && (
          <p className="mt-2 text-center text-[11px] font-bold text-rose-600 dark:text-rose-300">
            时间到，可交卷（未完成板块会降低估分）
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {active.sections.map((s, i) => {
          const key = secKey(s);
          return (
            <button
              key={key + i}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'rounded-2xl border px-3 py-2 text-left text-[11px] font-bold',
                i === step
                  ? 'border-primary bg-primary-soft text-ink-teal'
                  : doneSections[key]
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-border/60 text-muted-foreground',
              )}
            >
              {s.title}
              {doneSections[key] ? ' ✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
