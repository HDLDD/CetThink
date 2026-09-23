/**
 * srs.ts 回归测试 —— 直接 import 真实现（不再测 mock）
 *
 * 覆盖本轮修掉的 P0：
 *  ① 答错后 reps 归零，但 status 落到 learning —— 不能回到 new，
 *     否则该词既从复习队列消失、又被当作新词白吃一个每日名额；
 *  ② 数值兜底：interval=NaN 会让 due=NaN → 永不到期也永不复习；
 *  ③ 老数据 status 回填规则。
 * 用法: node tests/srs.test.mjs
 */
import {
  DAY,
  RELEARN_DELAY,
  forecast,
  isDue,
  isMastered,
  isNew,
  newProgress,
  sanitizeProgress,
  scheduleRelearn,
  sm2Update,
} from '../src/lib/srs.ts';

let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log('PASS', name, detail ? '— ' + detail : '');
  } else {
    fail++;
    console.log('FAIL', name, detail ? '— ' + detail : '');
  }
}
const NOW = 1758000000000; // 固定时间，避免测试自身不稳定

// ── P0①：答错的词必须留在复习队列，且不算新词 ──
{
  const first = sm2Update(null, 5, NOW, 'abandon');
  ok('首评答对 → 不再是新词', !isNew(first), `status=${first.status} reps=${first.reps}`);
  ok('首评答对 → interval=1 天', first.interval === 1, `interval=${first.interval}`);

  const lapsed = sm2Update(first, 1, NOW + DAY, 'abandon');
  ok('答错 → status=learning（不回 new）', lapsed.status === 'learning', `status=${lapsed.status}`);
  ok('答错 → reps 归零（SM-2 本意）', lapsed.reps === 0, `reps=${lapsed.reps}`);
  ok('答错 → 仍算已学词，不再吃新词名额', !isNew(lapsed));
  ok('答错 → lapses+1', lapsed.lapses === 1, `lapses=${lapsed.lapses}`);
  ok(
    '答错 → 当日重回到期池（10 分钟后到期）',
    isDue(lapsed, NOW + DAY + RELEARN_DELAY + 1000) === true,
    `due-now=${lapsed.due - (NOW + DAY)}ms`,
  );
  ok('答错 → 此刻尚未到期', isDue(lapsed, NOW + DAY + 1000) === false);

  // 连续答对回到 mastered
  let p = lapsed;
  for (let k = 0; k < 5; k++) p = sm2Update(p, 5, NOW + DAY * (k + 2));
  ok('连续答对 5 次 → mastered', isMastered(p), `status=${p.status} interval=${p.interval}`);
  ok('mastered 不再进复习队列', isDue(p, NOW + DAY * 400) === false);
}

// ── P0②：数值兜底 ──
{
  const bad = sanitizeProgress({ ease: NaN, interval: NaN, reps: -3, due: NaN, mastery: 5, lapses: NaN });
  ok('NaN ease 兜底到 2.5', bad.ease === 2.5, `ease=${bad.ease}`);
  ok('NaN interval 兜底到 0', bad.interval === 0, `interval=${bad.interval}`);
  ok('NaN due 不残留', Number.isFinite(bad.due), `due=${bad.due}`);
  ok('负数 reps 归零', bad.reps === 0);
  ok('mastery 夹到 [0,1]', bad.mastery === 1, `mastery=${bad.mastery}`);

  const legacy = sanitizeProgress({ ease: 2.5, interval: 6, reps: 3, due: 0, mastery: 0.4, lapses: 0 });
  ok('老数据缺 due 但已在复习 → 立即到期（不是永不到期）', legacy.due > 0 && isDue(legacy, NOW), `due=${legacy.due}`);
}

// ── P0②b：老数据 status 回填 ──
{
  ok('reps>0 → reviewing', sanitizeProgress({ reps: 3, mastery: 0.4 }).status === 'reviewing');
  ok('reps>0 且 mastery≥0.95 → mastered', sanitizeProgress({ reps: 5, mastery: 0.96 }).status === 'mastered');
  ok('reps=0 但 lapses>0 → learning', sanitizeProgress({ reps: 0, lapses: 2 }).status === 'learning');
  ok('空对象 → new', sanitizeProgress({}).status === 'new');
  ok('newProgress → new', isNew(newProgress('x')));
}

// ── 会话内重排 ──
{
  const order = ['a', 'b', 'c', 'd', 'e', 'f'];
  const r1 = scheduleRelearn(order, 0, 4, 2);
  ok('答错重排到当前位后第 4 张', r1[5] === 'a' && r1.length === 7, JSON.stringify(r1));
  const r2 = scheduleRelearn(['a', 'a', 'a', 'b'], 0, 4, 2);
  ok('同一词重排次数超限则不再插入', r2.length === 4, JSON.stringify(r2));
}

// ── 复习负担预测 ──
{
  const map = {
    a: sm2Update(null, 5, NOW), // reps=1 → 1 天后
    b: sm2Update(sm2Update(null, 5, NOW), 5, NOW), // reps=2 → 3 天后
    c: sm2Update(null, 1, NOW), // 10 分钟后 → 今天
  };
  ok('第二次答对 → interval=3 天', map.b.interval === 3, `interval=${map.b.interval}`);
  const f = forecast(map, 7, NOW);
  ok('forecast 返回 7 桶', f.length === 7);
  ok('今天含答错词', f[0].count === 1, `day0=${f[0].count}`);
  ok('明天含首评词', f[1].count === 1, `day1=${f[1].count}`);
  ok('第 3 天含第二次答对词', f[3].count === 1, `day3=${f[3].count}`);
}

console.log(`\n==== SRS ${pass} pass / ${fail} fail ====`);
process.exitCode = fail > 0 ? 1 : 0;
