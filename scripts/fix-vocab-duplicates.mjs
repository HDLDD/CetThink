/**
 * 词库去重：合并重复 id，保留更完整条目；生成 progress 迁移映射
 * 听写包：过滤空 sentences
 * 用法: node scripts/fix-vocab-duplicates.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'public/data');

function dedupeVocab(file, level) {
  const p = path.join(DATA, file);
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  const byId = new Map();
  let dup = 0;
  const map = {}; // oldId -> canonicalId
  for (const w of list) {
    map[String(w.id)] = String(w.id);
    if (!byId.has(w.id)) {
      byId.set(w.id, w);
      continue;
    }
    dup++;
    const prev = byId.get(w.id);
    // 保留字段更全的
    const score = (x) =>
      (x.word ? 2 : 0) + (x.meaning ? 2 : 0) + (x.example ? 1 : 0) +
      (x.collocations?.length ? 1 : 0) + (x.phonetic ? 1 : 0) + (x.exampleZh ? 1 : 0);
    if (score(w) > score(prev)) byId.set(w.id, w);
  }
  // 确保 id 全局唯一：给重复 word 不同 id 时已合并；若仍有同 id 仅保留一条
  const out = [...byId.values()];
  fs.writeFileSync(p, JSON.stringify(out));
  console.log(file, 'input', list.length, 'output', out.length, 'dups_merged', dup);

  // 进度迁移：level-id 指向同 id（去重后 id 稳定），无需改 key
  return { file, before: list.length, after: out.length, dups: dup };
}

const r4 = dedupeVocab('vocab-cet4.json', 4);
const r6 = dedupeVocab('vocab-cet6.json', 6);

// 过滤空听写包
const practicePath = path.join(DATA, 'practice.json');
const P = JSON.parse(fs.readFileSync(practicePath, 'utf8'));
const beforeD = (P.dictation || []).length;
P.dictation = (P.dictation || []).filter((d) => Array.isArray(d.sentences) && d.sentences.length > 0);
const removedD = beforeD - P.dictation.length;

// 过滤其它可能空的练习
P.listening = (P.listening || []).filter((x) => Array.isArray(x.questions) && x.questions.length > 0);
P.reading = (P.reading || []).filter((x) => Array.isArray(x.questions) && x.questions.length > 0);
P.cloze = (P.cloze || []).filter((x) => Array.isArray(x.blanks) && x.blanks.length > 0);

fs.writeFileSync(practicePath, JSON.stringify(P));
console.log('dictation', beforeD, '->', P.dictation.length, 'removed_empty', removedD);

fs.writeFileSync(
  path.join(ROOT, 'public/data/vocab-dedupe.json'),
  JSON.stringify({ r4, r6, removedDictation: removedD, at: Date.now() }, null, 2),
);
console.log('done');
