/**
 * persist.ts 回归测试 —— 只测纯函数（选副本 / 时间戳 / 完整度），node 可直接跑。
 *
 * 覆盖 P0：「清空全部数据」写出的是空状态（痕迹分低），而残留的旧 snapshot 分更高，
 * 旧实现按 scoreRaw 排序 → 刷新后旧数据复活。改为先比 updatedAt。
 */
import { pickBest, scoreRaw, updatedAtOf } from '../src/lib/persist.ts';

let pass = 0;
let fail = 0;
const ok = (n, c, d = '') => (c ? (pass++, console.log('PASS', n, d ? '— ' + d : '')) : (fail++, console.log('FAIL', n, d ? '— ' + d : '')));

const T = 1758000000000;
const empty = JSON.stringify({ schema: 2, updatedAt: T + 5000, vocab: {}, favorites: [], errors: [], daily: {}, profile: {} });
const rich = JSON.stringify({
  schema: 2,
  updatedAt: T,
  vocab: Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`6-${i}`, { reps: 3 }])),
  daily: { '2026-09-01': { minutes: 30 } },
  favorites: ['6-1', '6-2'],
  errors: [{ id: 'e1' }],
  profile: { totalMinutes: 600, streak: 12 },
});

// ── 核心：清空后不能被旧快照复活 ──
ok('旧的"大"副本 vs 新的空状态 → 选空状态（清空才生效）', pickBest([empty, rich]) === empty);
ok('参数顺序无关', pickBest([rich, empty]) === empty);
ok('完整度确实更大（证明这就是旧实现会翻车的原因）', scoreRaw(rich) > scoreRaw(empty), `rich=${scoreRaw(rich)} empty=${scoreRaw(empty)}`);

// ── 同刻平局时才比完整度 ──
const twin = JSON.stringify({ schema: 2, updatedAt: T, vocab: {}, profile: {} });
ok('同一 updatedAt → 选痕迹更多的', pickBest([twin, rich]) === rich);

// ── 时间戳解析 ──
ok('updatedAt 正常解析', updatedAtOf(rich) === T);
ok('无 updatedAt → 0', updatedAtOf(JSON.stringify({ vocab: {} })) === 0);
ok('非法 JSON → 0', updatedAtOf('{oops') === 0);
ok('null → 0', updatedAtOf(null) === 0);
ok('updatedAt 非数字 → 0', updatedAtOf(JSON.stringify({ updatedAt: 'now' })) === 0);

// ── 全是坏数据时返回 null ──
ok('全部非法 → null', pickBest([null, '{bad', '']) === null);
ok('坏 JSON 计 0 分', scoreRaw('{bad') === 0);

// ── 老数据（无 updatedAt）仍能被选中 ──
const legacy = JSON.stringify({ vocab: { '4-1': { reps: 1 } }, profile: {} });
ok('老数据无时间戳仍可用（有痕迹即入选）', pickBest([null, legacy]) === legacy);

console.log(`\n==== PERSIST ${pass} pass / ${fail} fail ====`);
process.exitCode = fail > 0 ? 1 : 0;
