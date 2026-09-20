import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Headphones,
  Target,
  RefreshCw,
  PenLine,
  Flame,
  Clock,
  Quote,
  Volume2,
  Play,
  Search,
  Trophy,
  CalendarDays,
  Puzzle,
  HardDriveDownload,
  ShieldCheck,
} from 'lucide-react';
import { store } from '../lib/store';
import { storageHealth } from '../lib/persist';
import { downloadBackup } from '../lib/backup';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';
import { tts } from '../lib/tts';
import { sfx } from '../lib/sfx';
import {
  ACHIEVEMENTS,
  checkAchievements,
  countMastered,
  loadUnlocked,
} from '../lib/achievements';
import { readLastVisit } from '../lib/page-memory';

const QUICK = [
  { to: '/vocab', label: '背单词', icon: BookOpen, desc: '多元模式 · 续学', color: 'from-[#00B894] to-emerald-400' },
  { to: '/review', label: '到期复习', icon: RefreshCw, desc: 'SM-2 只练到期词', color: 'from-sky-500 to-cyan-400', badgeKey: 'due' as const },
  { to: '/listening', label: '听力', icon: Headphones, desc: '精听 + 题解', color: 'from-indigo-500 to-violet-400' },
  { to: '/grammar', label: '语法', icon: Puzzle, desc: '高频语法专项', color: 'from-cyan-500 to-sky-500' },
  { to: '/exam', label: '模考', icon: Target, desc: '限时 · 可续考', color: 'from-rose-500 to-pink-400' },
  { to: '/writing', label: '写作', icon: PenLine, desc: '范文 + AI 批改', color: 'from-violet-500 to-purple-400' },
];

interface Quote {
  en: string;
  zh: string;
  author: string;
}

export default function DashboardPage() {
  const [state, setState] = useState(store.get());
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [qIdx, setQIdx] = useState(() => new Date().getDate());
  const [showZh, setShowZh] = useState(true);
  const [unlocked, setUnlocked] = useState<string[]>(() => loadUnlocked());
  const lastVisit = useMemo(() => readLastVisit(), []);

  useEffect(() => store.subscribe(() => setState(store.get())), []);

  useEffect(() => {
    fetch('/data/practice.json')
      .then((r) => r.json())
      .then((p) => setQuotes(p.dailyQuotes || []))
      .catch(() => setQuotes([]));
  }, []);

  const day = store.today();
  const target = state.settings.dailyWordTarget || 30;
  const pct = Math.min(1, target ? day.words / target : 0);
  const levelNum = state.settings.examLevel === 'CET-6' ? 6 : 4;
  const duePreview = useMemo(() => {
    // 轻量：用已学习的 vocab key 统计到期数，避免拉全词库
    const now = Date.now();
    let n = 0;
    for (const [k, p] of Object.entries(state.vocab)) {
      if (!k.startsWith(`${levelNum}-`)) continue;
      if (p && p.reps > 0 && p.due <= now && (p.mastery || 0) < 0.95) n++;
      if (n > 999) break;
    }
    return n;
  }, [state.vocab, levelNum]);

  // 成就检查（对齐 NativeThink：数据变化后解锁）
  useEffect(() => {
    const stats = {
      streak: state.profile.streak,
      todayWords: day.words,
      totalMinutes: state.profile.totalMinutes,
      errorCount: state.errors.length,
      vocabMastered: countMastered(state.vocab),
      examsDone: state.examHistory.length,
      favoriteCount: state.favorites.length,
      listeningDone: day.reviews + state.examHistory.length,
    };
    const newly = checkAchievements(stats);
    if (newly.length) {
      setUnlocked(loadUnlocked());
      sfx.done();
      newly.forEach((a) => toast(`${a.icon} 达成「${a.name}」`, 'success'));
    }
  }, [state, day.words, day.reviews]);

  const quote = quotes[qIdx % (quotes.length || 1)];
  const streakPct = Math.min(1, state.profile.streak / 30);
  const recentDays = useMemo(() => {
    const days: { key: string; active: boolean; min: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rec = state.daily[key];
      days.push({ key, active: !!rec && rec.minutes + rec.words + rec.reviews > 0, min: rec?.minutes || 0 });
    }
    return days;
  }, [state.daily]);

  return (
    <div className="space-y-5">
      {/* 数据安全 — 防丢失 / 更新可恢复 */}
      <section className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
        <ShieldCheck className="size-5 shrink-0 text-ink-teal" />
        <div className="min-w-0 flex-1 text-[11px] text-muted-foreground">
          <div className="font-black text-foreground">学习数据已本地多副本保存</div>
          <div>
            进度 {store.summary().wordsTracked} 词 · 收藏 {store.summary().favorites} ·{' '}
            {storageHealth().lastSave
              ? `上次写入 ${new Date(storageHealth().lastSave!).toLocaleTimeString('zh-CN')}`
              : '写入正常'}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-2xl border border-border/60 px-2.5 py-1.5 text-[11px] font-bold"
          onClick={() => {
            void downloadBackup();
            sfx.done();
            toast('已导出备份 JSON，请保存到手机', 'success');
          }}
        >
          <HardDriveDownload className="mr-1 inline size-3.5" />
          备份
        </button>
      </section>
      {/* 继续上次学习 — NativeThink 同款 */}
      {lastVisit && lastVisit.path !== '/' && (
        <Link
          to={lastVisit.path}
          className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary-soft/50 px-4 py-3"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Continue</div>
            <div className="text-sm font-black text-ink-teal">继续上次 · {lastVisit.label}</div>
          </div>
          <Play className="size-4 text-ink-teal" />
        </Link>
      )}

      {/* 今日概览 */}
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:from-emerald-500/10 dark:to-teal-500/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">你好，继续备考 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.settings.examLevel} · 今日单词 <strong className="text-foreground">{day.words}</strong> / {target}
            </p>
          </div>
          <Link to="/progress" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card/80">
            <CalendarDays className="size-5 text-ink-teal" />
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00B894] to-cyan-400 transition-all duration-500"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-ink-teal tabular-nums">{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Flame className="size-4 text-orange-500" />} value={state.profile.streak} label="连续天" />
          <Stat icon={<Clock className="size-4 text-sky-500" />} value={day.minutes} label="分钟" />
          <Stat icon={<RefreshCw className="size-4 text-violet-500" />} value={day.reviews} label="复习" />
        </div>
        {/* 14 日打卡条 */}
        <div className="mt-3 flex gap-1">
          {recentDays.map((d) => (
            <div
              key={d.key}
              title={`${d.key} · ${d.min} 分钟`}
              className={cn(
                'h-2 flex-1 rounded-full',
                d.active ? 'bg-[#00B894]' : 'bg-black/8 dark:bg-white/10',
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
          <span>近 14 天打卡</span>
          <span>
            连胜 {streakPct >= 1 ? 'MAX' : Math.round(streakPct * 100) + '%'} · 成就 {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </section>

      {/* 每日一句 — NativeThink DailySentence 同款 */}
      {quote && (
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground">
              <Quote className="size-4 text-ink-teal" />
              每日一句
            </div>
            <div className="flex gap-1">
              <IconBtn
                label="朗读"
                onClick={() => {
                  sfx.click();
                  tts.speak(quote.en);
                }}
              >
                <Volume2 className="size-4" />
              </IconBtn>
              <IconBtn
                label="换一句"
                onClick={() => {
                  sfx.click();
                  setQIdx((i) => i + 1);
                  setShowZh(true);
                }}
              >
                <RefreshCw className="size-4" />
              </IconBtn>
            </div>
          </div>
          <p className="mt-3 text-base font-bold leading-relaxed text-foreground">{quote.en}</p>
          <button type="button" className="mt-2 w-full text-left" onClick={() => setShowZh((s) => !s)}>
            <p className="text-sm text-muted-foreground">
              {showZh ? quote.zh : '点击查看中文'}
              {showZh && quote.author ? ` — ${quote.author}` : ''}
            </p>
          </button>
        </section>
      )}

      {/* 快捷入口 */}
      <section className="stagger grid grid-cols-2 gap-3">
        {QUICK.map(({ to, label, icon: Icon, desc, color, badgeKey }) => (
          <Link
            key={to}
            to={to}
            className="relative rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {badgeKey === 'due' && duePreview > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                {duePreview}
              </span>
            )}
            <div className={cn('mb-3 grid size-10 place-items-center rounded-2xl bg-gradient-to-br text-white', color)}>
              <Icon className="size-5" />
            </div>
            <div className="text-sm font-black">{label}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {badgeKey === 'due' && duePreview > 0 ? `${duePreview} 词待复习` : desc}
            </div>
          </Link>
        ))}
      </section>

      {/* 成就预览 */}
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-black">最近成就</div>
          <span className="text-[11px] font-bold text-muted-foreground">{unlocked.length} / {ACHIEVEMENTS.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(unlocked.length ? ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)) : ACHIEVEMENTS)
            .slice(0, 6)
            .map((a) => {
              const got = unlocked.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-[11px] font-bold',
                    got ? 'bg-primary-soft text-ink-teal' : 'bg-muted text-muted-foreground opacity-60',
                  )}
                >
                  <span>{a.icon}</span>
                  {a.name}
                </div>
              );
            })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          错题 {state.errors.length} · 收藏 {state.favorites.length} · 模考 {state.examHistory.length} 次
        </p>
      </section>

      <div className="flex gap-2">
        <Link
          to="/progress"
          className="flex-1 rounded-2xl border border-border/60 bg-card py-3 text-center text-xs font-bold"
        >
          <CalendarDays className="mr-1 inline size-4" />
          学习记录
        </Link>
        <Link
          to="/skills"
          className="flex-1 rounded-2xl border border-border/60 bg-card py-3 text-center text-xs font-bold"
        >
          <Trophy className="mr-1 inline size-4" />
          成就与拓展
        </Link>
        <Link
          to="/vocab"
          className="flex-1 rounded-2xl bg-primary py-3 text-center text-xs font-black text-white"
        >
          <Search className="mr-1 inline size-4" />
          去背词
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-card/80 px-2 py-3">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-lg font-black tabular-nums">{value}</span>
      </div>
      <div className="text-[10px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-2xl border border-border/60 bg-background active:scale-95"
    >
      {children}
    </button>
  );
}
