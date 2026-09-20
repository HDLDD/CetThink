/**
 * 从 NativeThink 的 CET 源数据导入词库/练习 → CetThink/public/data/*.json
 *
 * 源数据位置（按优先级探测，取第一个存在的）：
 *   1. B:/NativeThink/release/cet-legacy/js   ← 现行归档位置（独立拆分后 public/cet 已移除）
 *   2. B:/NativeThink/public/cet/js           ← 早期位置，保留兼容
 *
 * ⚠️ 默认**不覆盖**已存在的 public/data/*.json。
 * 原因：后续脚本（expand-practice-bank*.mjs / build-grammar-bank.mjs /
 * fix-vocab-duplicates.mjs）已在导入结果上做过大幅扩充与去重，直接覆盖会回退题库
 * （实测：听力 106→24、阅读 91→13、同义词 652→15、词根 433→24，并重新引入已清理的重复词条）。
 *
 * 用法:
 *   node scripts/import-cet-data.mjs                  # 源探测 + 覆盖预览，不写盘
 *   node scripts/import-cet-data.mjs --out=tmp/data    # 输出到指定目录做比对
 *   node scripts/import-cet-data.mjs --force           # 明确要求覆盖 public/data
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SRC_CANDIDATES = [
  'B:/NativeThink/release/cet-legacy/js',
  'B:/NativeThink/public/cet/js',
];

const ROOT = path.resolve(import.meta.dirname, '..');
const REQUIRED_FILES = [
  'data.js',
  'vocab-cet4.js',
  'vocab-cet6.js',
  'vocab-highfreq.js',
  'practice-extra.js',
];

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const OUT_ARG = args.find((a) => a.startsWith('--out='));
const OUT = OUT_ARG
  ? path.resolve(ROOT, OUT_ARG.slice('--out='.length))
  : path.resolve(ROOT, 'public/data');

function resolveSource() {
  for (const dir of SRC_CANDIDATES) {
    if (!fs.existsSync(dir)) continue;
    const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(dir, f)));
    if (missing.length) {
      console.warn(`跳过 ${dir} — 缺少 ${missing.join(', ')}`);
      continue;
    }
    return dir;
  }
  throw new Error(
    '找不到可用的 CET 源数据目录。已尝试:\n' +
      SRC_CANDIDATES.map((d) => `  - ${d}`).join('\n') +
      `\n每个目录都需包含: ${REQUIRED_FILES.join(', ')}` +
      '\n提示：CET 源数据随 NativeThink 独立拆分归档在 NativeThink/release/cet-legacy/js；' +
      '\n若该目录已被清理，请从 NativeThink 的 release 归档中恢复后重试。',
  );
}

function loadWindow(src, files) {
  const sb = {
    window: {},
    console,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Date,
    Set,
    Map,
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of files) {
    const code = fs.readFileSync(path.join(src, f), 'utf8');
    vm.runInContext(code, sb, { filename: f });
  }
  return sb.DATA || sb.window.DATA;
}

/** 统计一个 practice 对象各板块规模，用于覆盖前对比 */
function practiceCounts(p) {
  return Object.fromEntries(
    Object.entries(p)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, v.length])
      .sort((a, b) => b[1] - a[1]),
  );
}

const SRC = resolveSource();
console.log('源数据目录:', SRC);

const DATA = loadWindow(SRC, REQUIRED_FILES);
if (!DATA) throw new Error('源数据加载后未得到 DATA 对象');

const vocab = DATA.vocabulary || [];
const cet4 = vocab.filter((w) => w.level === 4);
const cet6 = vocab.filter((w) => w.level === 6);

const practice = {
  listening: DATA.listening || [],
  reading: DATA.reading || [],
  cloze: DATA.cloze || [],
  dictation: DATA.dictation || [],
  writingPrompts: DATA.writingPrompts || [],
  writingTemplates: DATA.writingTemplates || [],
  translations: DATA.translations || [],
  speakingScripts: DATA.speakingScripts || [],
  mockExams: DATA.mockExams || [],
  roots: DATA.roots || [],
  collocations: DATA.collocations || [],
  synonyms: DATA.synonyms || [],
  wordGames: DATA.wordGames || [],
  dailyQuotes: DATA.dailyQuotes || [],
};

const incoming = {
  'practice.json': practice,
  'vocab-cet4.json': cet4,
  'vocab-cet6.json': cet6,
};

// ── 覆盖预览 + 安全闸门 ──
// 目标目录还不存在时没有任何东西可覆盖，直接进入写入流程
const existing = fs.existsSync(OUT)
  ? fs
      .readdirSync(OUT, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name in incoming)
      .map((e) => e.name)
  : [];

if (existing.length) {
  console.log('\n⚠️ 目标目录已有导入产物:', existing.join(', '));
  const cur = JSON.parse(fs.readFileSync(path.join(OUT, 'practice.json'), 'utf8'));
  const now = practiceCounts(cur);
  const next = practiceCounts(practice);
  console.log('\n板块规模  当前 → 本次导入（负数为回退）');
  for (const k of [...new Set([...Object.keys(now), ...Object.keys(next)])].sort()) {
    const a = now[k] ?? 0;
    const b = next[k] ?? 0;
    const d = b - a;
    console.log(`  ${k.padEnd(18)} ${String(a).padStart(5)} → ${String(b).padStart(5)}  ${d === 0 ? '' : d > 0 ? `+${d}` : `${d} ⚠️`}`);
  }
  const v4now = JSON.parse(fs.readFileSync(path.join(OUT, 'vocab-cet4.json'), 'utf8')).length;
  console.log(`  ${'vocab-cet4'.padEnd(18)} ${String(v4now).padStart(5)} → ${String(cet4.length).padStart(5)}  ${cet4.length - v4now === 0 ? '' : cet4.length - v4now > 0 ? `+${cet4.length - v4now}` : `${cet4.length - v4now} ⚠️`}`);

  if (!FORCE) {
    console.log(
      '\n已阻止覆盖（默认安全模式）。这些产物已被 expand-practice-bank*.mjs / build-grammar-bank.mjs /\n' +
        'fix-vocab-duplicates.mjs 扩充与去重，直接覆盖会回退题库。\n' +
        '  · 想先比对：node scripts/import-cet-data.mjs --out=tmp/data\n' +
        '  · 确认要覆盖：node scripts/import-cet-data.mjs --force',
    );
    process.exit(2);
  }
  console.log('\n--force 已指定，执行覆盖。');
}

fs.mkdirSync(OUT, { recursive: true });

function write(name, obj) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(obj));
  console.log(name, (fs.statSync(file).size / 1024).toFixed(1) + 'KB');
}

console.log('\n写入 →', OUT);
write('practice.json', practice);
write('vocab-cet4.json', cet4);
write('vocab-cet6.json', cet6);
console.log('vocab', vocab.length, 'cet4', cet4.length, 'cet6', cet6.length);
console.log('Done →', OUT);
