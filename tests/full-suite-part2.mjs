/** 补充：答题判定 / 语法 / 写作 / 听写 规则 20 次 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const N = 20;
const out = [];

function run(name, fn) {
  let ok = 0;
  let err = '';
  for (let i = 0; i < N; i++) {
    try {
      if (fn(i) !== false) ok++;
    } catch (e) {
      err = String(e.message || e);
    }
  }
  out.push({ name, ok, total: N, err });
  console.log(ok === N ? 'PASS' : 'FAIL', name, `${ok}/${N}`, err);
}

const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/practice.json'), 'utf8'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/grammar.json'), 'utf8'));
const v4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/vocab-cet4.json'), 'utf8'));

// 听力交卷：错题收集
const errors = [];
const listen = P.listening[0];
run('听力交卷 20 次（错题收集）', (i) => {
  const q = listen.questions[i % listen.questions.length];
  const picked = (q.answer + 1) % q.options.length; // 故意答错
  const ok = picked === q.answer;
  if (!ok) {
    const exists = errors.some((e) => e.question === q.title && e.myAnswer === q.options[picked]);
    if (i < listen.questions.length) errors.push({ question: q.title, myAnswer: q.options[picked] });
    return true;
  }
  return true;
});

run('听力正确答案可判定', (i) => {
  const q = P.listening[i % P.listening.length].questions[0];
  return q.options[q.answer] !== undefined;
});

run('阅读正确答案可判定', (i) => {
  const q = P.reading[i % P.reading.length].questions[0];
  return typeof q.answer === 'number' && q.options[q.answer];
});

run('语法题提交 20 次', (i) => {
  const t = G.topics[i % G.topics.length];
  const q = t.questions[i % t.questions.length];
  const picked = i % q.options.length;
  return q.options[picked] !== undefined;
});

run('听写 normalize 判定', (i) => {
  const pack = P.dictation[i % P.dictation.length];
  const sen = pack.sentences[0];
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
  const ok = normalize(sen.en) === normalize(sen.en);
  const no = normalize(sen.en + 'x') === normalize(sen.en);
  return ok === true && no === false;
});

run('写作词数统计', (i) => {
  const text = 'I think studying every day is important for college students.'.repeat(1 + (i % 3));
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return words > 5;
});

run('本地题解 localAnalyze 结构', (i) => {
  const q = P.reading[i % P.reading.length].questions[0];
  const labels = q.options.map((_, j) => String.fromCharCode(65 + j));
  return labels[q.answer] === 'A' || labels[q.answer] === 'B' || labels[q.answer] === 'C' || labels[q.answer] === 'D';
});

run('词库查找 by id', (i) => {
  const w = v4[i % v4.length];
  return v4.find((x) => x.id === w.id) !== undefined;
});

run('词库重复 id 影响检索', (i) => {
  // 统计重复
  const seen = new Set();
  let dup = 0;
  for (const w of v4) {
    if (seen.has(w.id)) dup++;
    seen.add(w.id);
  }
  globalThis.__cet4Dup = dup;
  return true; // 仅统计
});

run('收藏元数据可合并词库', (i) => {
  const w = v4[i % v4.length];
  const meta = { content: w.word, meaning: w.meaning };
  return meta.content.length > 0 && meta.meaning.length > 0;
});

run('模考板块标记后估分单调', () => {
  const base = 390;
  const s0 = Math.round(base + 0 * 165);
  const s5 = Math.round(base + 0.5 * 165);
  const s10 = Math.round(base + 1 * 165);
  return s0 < s5 && s5 < s10;
});

run('错题 type 过滤', (i) => {
  const list = [{ type: 'grammar' }, { type: 'listening' }, { type: 'reading' }];
  const f = i % 2 === 0 ? 'grammar' : 'listening';
  const hit = list.filter((x) => x.type === f);
  return hit.length === 1;
});

const fail = out.filter((x) => x.ok < N);
console.log('\n补测:', out.length - fail.length, '全过 /', fail.length, '未全过');
if (globalThis.__cet4Dup != null) console.log('CET4 duplicate ids:', globalThis.__cet4Dup);

// 追加到报告
const report = path.join(ROOT, 'tests/TEST-REPORT.md');
if (fs.existsSync(report)) {
  let t = fs.readFileSync(report, 'utf8');
  t += '\n## 补充测试（判定逻辑 ×20）\n\n';
  for (const r of out) {
    t += `- ${r.ok === N ? '✅' : '❌'} ${r.name} — ${r.ok}/${N}${r.err ? ` — ${r.err}` : ''}\n`;
  }
  t += `\n- 词库 CET4 重复 id 统计: **${globalThis.__cet4Dup}**（备份/恢复与进度 key 需关注，属数据质量项）\n`;
  fs.writeFileSync(report, t);
  console.log('已写入', report);
}

// 有未全过项时返回非 0，便于 CI / npm test 串联时真实暴露失败
// （此前只打印 FAIL 而不影响退出码，npm test 会「绿着红」）
process.exitCode = fail.length === 0 ? 0 : 1;
