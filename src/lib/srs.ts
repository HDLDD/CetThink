/**
 * 间隔重复（SM-2 变体）唯一实现 —— 纯函数，可直接单测。
 *
 * 为什么必须独立成文件：此前背词页与复习页各写一份公式（间隔 `max(1, i*e)` vs `max(i, i*e)`、
 * mastery +0.2/-0.15 vs +0.15/-0.2、评分档 4 档 vs 3 档），同一个词在两页得到不同结果。
 *
 * 更严重的是 `reps === 0` 被**同时**用来表达「新词」和「刚答错」：
 *   ① 复习队列要求 `reps > 0` → 答错一次的词从此永远不再进复习队列；
 *   ② 新词队列条件 `!p || p.reps === 0` 又把同一个词当新词 → 一次遗忘白吃一个每日名额。
 * 现在拆成独立的 `status` 状态机，`reps` 只表示连续答对次数（答错归零是 SM-2 本意）。
 */

export type VocabStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface SrsProgress {
  ease: number;
  interval: number;
  reps: number;
  due: number;
  mastery: number;
  lapses: number;
  status: VocabStatus;
  /** 首次学习时间 —— 用于「今日新学」计数，取代会话里 todayNew 的双计数 */
  firstAt?: number;
  /** 最近一次评分时间 */
  lastAt?: number;
  lastWord?: string;
}

export const DAY = 86400000;
/** 答错后在当日重新进队的间隔 */
export const RELEARN_DELAY = 10 * 60 * 1000;
export const RELEARN_GAP = 4;
export const MAX_RELEARN = 2;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const finite = (v: unknown, dflt: number) => (typeof v === 'number' && Number.isFinite(v) ? v : dflt);

export function startOfToday(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function newProgress(word?: string): SrsProgress {
  return { ease: 2.5, interval: 0, reps: 0, due: 0, mastery: 0, lapses: 0, status: 'new', lastWord: word };
}

/** 老数据推断状态（迁移用）：reps>0 说明已进入复习；只有 lapses/interval/mastery 说明学过又答错 */
function legacyStatus(r: Partial<SrsProgress>): VocabStatus {
  const reps = finite(r.reps, 0);
  const lapses = finite(r.lapses, 0);
  const interval = finite(r.interval, 0);
  const mastery = finite(r.mastery, 0);
  if (reps > 0) return mastery >= 0.95 ? 'mastered' : 'reviewing';
  if (lapses > 0 || interval > 0 || mastery > 0) return 'learning';
  return 'new';
}

/**
 * 数值兜底。历史数据只做了 `?? 默认值`，一旦 interval=NaN 则 due=NaN，
 * `due <= now` 恒为 false —— 该词既不到期也不复习，静默消失。
 */
export function sanitizeProgress(raw: unknown, word?: string): SrsProgress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SrsProgress>;
  const known: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered'];
  const status = known.includes(r.status as VocabStatus) ? (r.status as VocabStatus) : legacyStatus(r);
  const p: SrsProgress = {
    ease: clamp(finite(r.ease, 2.5), 1.3, 3.0),
    interval: Math.max(0, Math.round(finite(r.interval, 0))),
    reps: Math.max(0, Math.round(finite(r.reps, 0))),
    due: Math.max(0, finite(r.due, 0)),
    mastery: clamp(finite(r.mastery, 0), 0, 1),
    lapses: Math.max(0, Math.round(finite(r.lapses, 0))),
    status,
    firstAt: r.firstAt == null ? undefined : Math.max(0, finite(r.firstAt, 0)),
    lastAt: r.lastAt == null ? undefined : Math.max(0, finite(r.lastAt, 0)),
    lastWord: typeof r.lastWord === 'string' ? r.lastWord : word,
  };
  // 老数据没有 due（=0）但已在学习/复习中 → 视为立即到期，而不是永不到期
  if (p.status !== 'new' && p.due === 0) p.due = 1;
  return p;
}

export const isNew = (p?: SrsProgress | null): boolean => !p || p.status === 'new';
export const isMastered = (p?: SrsProgress | null): boolean => !!p && p.status === 'mastered';

/** 到期判定唯一入口（此前 store / 复习页 / 首页各写一遍且条件不同） */
export function isDue(p?: SrsProgress | null, now = Date.now()): boolean {
  if (!p || p.status === 'new' || p.status === 'mastered') return false;
  return p.due > 0 && p.due <= now;
}

/**
 * 评分 → 新进度。quality: 0..5（<3 视为答错）。
 * 答错：reps 归零（SM-2 本意）但 status 落到 learning —— 绝不回到 new。
 */
export function sm2Update(
  prev: SrsProgress | null | undefined,
  quality: number,
  now = Date.now(),
  word?: string,
): SrsProgress {
  const p = sanitizeProgress(prev, word);
  const q = clamp(Math.round(finite(quality, 3)), 0, 5);
  const wasNew = p.status === 'new';
  const next: SrsProgress = { ...p, lastAt: now, lastWord: word ?? p.lastWord };
  if (wasNew) next.firstAt = now;

  if (q >= 3) {
    next.interval = p.interval <= 0 ? 1 : p.reps <= 1 ? 3 : Math.max(1, Math.round(p.interval * p.ease));
    next.reps = p.reps + 1;
    next.mastery = clamp(p.mastery + 0.2, 0, 1);
    next.status = next.reps >= 5 && next.interval >= 21 ? 'mastered' : next.reps >= 2 ? 'reviewing' : 'learning';
    next.due = now + next.interval * DAY;
  } else {
    next.interval = 0;
    next.reps = 0;
    next.lapses = p.lapses + 1;
    next.mastery = clamp(p.mastery - 0.15, 0, 1);
    next.status = 'learning';
    next.due = now + RELEARN_DELAY;
  }
  next.ease = clamp(p.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), 1.3, 3.0);
  return next;
}

/** 未来 N 天复习负担（按本地午夜分桶；负桶并入第 0 天） */
export function forecast(
  progress: Record<string, SrsProgress>,
  days = 7,
  now = Date.now(),
): { date: Date; count: number }[] {
  const start = startOfToday(now);
  const buckets = new Array(Math.max(1, days)).fill(0) as number[];
  for (const p of Object.values(progress)) {
    if (!p || p.status === 'new' || p.status === 'mastered' || !p.due) continue;
    const d = Math.floor((p.due - start) / DAY);
    if (d < 0) buckets[0] += 1;
    else if (d < buckets.length) buckets[d] += 1;
  }
  return buckets.map((count, i) => ({ date: new Date(start + i * DAY), count }));
}

/** 答错后把该词重排到当前位后第 gap 张（当日再练一次），最多重排 maxRelearn 次 */
export function scheduleRelearn<T>(order: T[], cursor: number, gap = RELEARN_GAP, maxRelearn = MAX_RELEARN): T[] {
  if (cursor < 0 || cursor >= order.length) return order;
  const word = order[cursor];
  if (order.filter((x) => x === word).length > maxRelearn) return order;
  const at = Math.min(order.length, cursor + 1 + gap);
  const next = order.slice();
  next.splice(at, 0, word);
  return next;
}
