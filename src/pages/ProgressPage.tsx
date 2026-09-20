import { useMemo, useState } from 'react';
import { Download, Upload, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, loadUnlocked } from '../lib/achievements';
import { downloadBackup, importBackup } from '../lib/backup';
import { useLearningMemory } from '../lib/use-memory';
import { store } from '../lib/store';
import { toast } from '../lib/toast';
import { sfx } from '../lib/sfx';
import { cn, todayKey } from '../lib/cn';

export default function ProgressPage() {
  const { stats, calendar } = useLearningMemory();
  const [unlocked] = useState<string[]>(() => loadUnlocked());
  const [tab, setTab] = useState<'calendar' | 'ach' | 'data'>('calendar');

  const monthDays = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const first = new Date(y, m, 1).getDay();
    const cells: { date: string | null; min: number; active: boolean }[] = [];
    for (let i = 0; i < first; i++) cells.push({ date: null, min: 0, active: false });
    const map = new Map(calendar.map((c) => [c.date, c]));
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = map.get(key);
      cells.push({
        date: key,
        min: rec?.minutes || 0,
        active: !!rec && (rec.checkedIn || rec.minutes > 0 || rec.words > 0 || rec.reviews > 0),
      });
    }
    return { cells, label: `${y}年 ${m + 1}月`, today: todayKey() };
  }, [calendar]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card value={stats.streakDays} label="连续天数" />
        <Card value={stats.totalDays} label="学习天数" />
        <Card value={stats.totalMinutes} label="总分钟" />
      </div>

      <div className="flex gap-2">
        {(['calendar', 'ach', 'data'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-2xl py-2 text-xs font-bold',
              tab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            {t === 'calendar' ? '打卡日历' : t === 'ach' ? '成就' : '数据备份'}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black">近 7 天学习量</div>
              <div className="text-[10px] font-bold text-muted-foreground">分钟 / 词</div>
            </div>
            <div className="flex h-28 items-end gap-1.5">
              {store.recentMinutes(7).map((d) => {
                const week = store.recentMinutes(7);
                const max = Math.max(30, ...week.map((x) => x.minutes));
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-xl bg-primary/80"
                      style={{ height: `${Math.max(4, ((d.minutes || 0) / max) * 88)}px` }}
                      title={`${d.date} ${d.minutes}分/${d.words}词`}
                    />
                    <span className="text-[9px] font-bold text-muted-foreground">{d.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card p-4">
            <div className="mb-3 text-sm font-black">今日模块活跃</div>
            <div className="space-y-2">
              {store.moduleActivity().map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="w-12 text-[11px] font-bold text-muted-foreground">{m.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00B894] to-cyan-400"
                      style={{ width: `${Math.min(100, m.value)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] font-black tabular-nums">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card p-4">
            <div className="mb-3 text-sm font-black">{monthDays.label}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {monthDays.cells.map((c, i) => (
              <div
                key={i}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg text-[10px] font-bold',
                  !c.date && 'opacity-0',
                  c.date && c.active && c.min >= 20 && 'bg-[#00B894] text-white',
                  c.date && c.active && c.min > 0 && c.min < 20 && 'bg-[#00B894]/45 text-white',
                  c.date && c.active && c.min === 0 && 'bg-primary-soft text-ink-teal',
                  c.date && !c.active && c.date === monthDays.today && 'border border-primary text-ink-teal',
                  c.date && !c.active && c.date !== monthDays.today && 'bg-muted/50 text-muted-foreground',
                )}
                title={c.date ? `${c.date} · ${c.min} 分钟` : ''}
              >
                {c.date ? Number(c.date.slice(-2)) : ''}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="font-bold text-muted-foreground">今日（NativeThink 记忆同步）</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['目标分', stats.dailyGoalMinutes],
                ['今日分', stats.todayMinutes],
                ['今日词', stats.todayWords],
                ['复习', stats.todayReviews],
                ['总词量', stats.totalWords],
                ['词进度', stats.moduleProgress.vocab],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between rounded-2xl bg-muted/60 px-3 py-2">
                  <span className="font-bold text-muted-foreground">{k}</span>
                  <span className="font-black tabular-nums">{v as number}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {tab === 'ach' && (
        <div className="stagger space-y-2">
          <div className="text-xs font-bold text-muted-foreground">
            已解锁 {unlocked.length} / {ACHIEVEMENTS.length}
          </div>
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            return (
              <div
                key={a.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3',
                  got ? 'border-primary/40 bg-primary-soft/40' : 'border-border/60 bg-card opacity-70',
                )}
              >
                <div className="text-2xl">{a.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                </div>
                {got ? <Trophy className="size-4 text-ink-teal" /> : <span className="text-[10px] font-bold text-muted-foreground">未达成</span>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-3 rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-sm font-black">本地数据备份</div>
          <p className="text-xs text-muted-foreground">
            与 NativeThink 相同：备份为全量键值 JSON（词进度/收藏释义/错题/成就/统计），更新安装包前请导出。
          </p>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-white"
            onClick={() => {
              void downloadBackup();
              sfx.done();
              toast('备份已下载', 'success');
            }}
          >
            <Download className="size-4" />
            导出学习数据
          </button>
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border/60 py-3 text-sm font-bold">
            <Upload className="size-4" />
            从备份恢复
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                if (importBackup(text)) {
                  sfx.done();
                  toast('恢复成功，正在刷新', 'success');
                  setTimeout(() => window.location.reload(), 500);
                } else {
                  sfx.wrong();
                  toast('备份文件无效', 'error');
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Card({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-3 text-center">
      <div className="text-xl font-black tabular-nums text-ink-teal">{value}</div>
      <div className="text-[10px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}
