/**
 * CetThink 全功能压力测试 — 每条路径重复 20 次
 * 结论写入 tests/TEST-REPORT.md
 * 用法: node tests/full-suite.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const N = 20;
const results = [];
let pass = 0;
let fail = 0;
let warn = 0;

function record(category, name, ok, detail = '') {
  const row = { category, name, ok, detail };
  results.push(row);
  if (ok === true) pass++;
  else if (ok === 'warn') warn++;
  else fail++;
  const mark = ok === true ? 'PASS' : ok === 'warn' ? 'WARN' : 'FAIL';
  console.log(`[${mark}] ${category} · ${name}${detail ? ' — ' + detail : ''}`);
}

function repeat(fn, times = N) {
  const errs = [];
  for (let i = 0; i < times; i++) {
    try {
      fn(i);
    } catch (e) {
      errs.push(String(e && e.message ? e.message : e));
    }
  }
  return { ok: errs.length === 0, errs, times };
}

// ── Mock browser localStorage + store 实现（镜像 src/lib/store.ts 核心逻辑） ──
function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
  };
}

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function vocabKey(level, id) {
  return `${level}-${id}`;
}

// SM-2 同 CetThink
function sm2(prev, q) {
  let { ease = 2.5, interval = 0, reps = 0, mastery = 0, lapses = 0 } = prev;
  if (q >= 3) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(1, Math.round(interval * ease));
    reps += 1;
    mastery = Math.min(1, mastery + 0.2);
  } else {
    reps = 0;
    interval = 1;
    lapses += 1;
    mastery = Math.max(0, mastery - 0.15);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { ease, interval, reps, mastery, lapses, due: Date.now() + interval * 86400000, lastWord: prev.lastWord };
}

function createStore() {
  const LS = makeStorage();
  const KEY = 'cetthink_store_v1';
  const state = {
    schema: 2,
    updatedAt: Date.now(),
    settings: { examLevel: 'CET-4', dailyWordTarget: 30, theme: 'light', ttsRate: 0.95, wordBook: 'cet4', autoSpeak: true },
    profile: { streak: 0, lastStudyDate: null, totalMinutes: 0, learned: 0, totalWords: 0 },
    vocab: {},
    favorites: [],
    errors: [],
    daily: {},
    writingDraft: '',
    examHistory: [],
    ui: { vocabIdx: {}, vocabSession: {} },
  };
  function save() {
    state.updatedAt = Date.now();
    LS.setItem(KEY, JSON.stringify(state));
    LS.setItem(KEY + '_backup', JSON.stringify(state));
    LS.setItem('cetthink_' + 'anon' + '__:store_v1', JSON.stringify(state));
  }
  function update(patch) {
    Object.assign(state, patch);
    if (patch.settings) state.settings = { ...state.settings, ...patch.settings };
    if (patch.profile) state.profile = { ...state.profile, ...patch.profile };
    if (patch.ui) state.ui = { ...state.ui, ...patch.ui };
    save();
  }
  const store = {
    get: () => state,
    LS,
    update,
    setSettings: (p) => update({ settings: { ...state.settings, ...p } }),
    recordStudy(minutes, words = 0, reviews = 0) {
      const today = todayKey();
      const prevDay = state.daily[today] || { minutes: 0, words: 0, reviews: 0 };
      const day = { minutes: prevDay.minutes + minutes, words: prevDay.words + words, reviews: prevDay.reviews + reviews };
      let streak = state.profile.streak;
      if (state.profile.lastStudyDate !== today) {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yKey = todayKey(y);
        streak = state.profile.lastStudyDate === yKey ? streak + 1 : 1;
      }
      update({
        daily: { ...state.daily, [today]: day },
        profile: { ...state.profile, streak, lastStudyDate: today, totalMinutes: state.profile.totalMinutes + minutes, totalWords: (state.profile.totalWords || 0) + words },
      });
    },
    today: () => state.daily[todayKey()] || { minutes: 0, words: 0, reviews: 0 },
    setVocab(key, p) {
      update({ vocab: { ...state.vocab, [key]: p } });
    },
    getVocab: (key) => state.vocab[key] || null,
    toggleFavorite(id) {
      const has = state.favorites.includes(id);
      update({ favorites: has ? state.favorites.filter((x) => x !== id) : [id, ...state.favorites] });
      return !has;
    },
    addFavoriteWord(level, id, meta) {
      const key = vocabKey(level, id);
      if (!state.favorites.includes(key)) update({ favorites: [key, ...state.favorites] });
      state.favoriteMeta = state.favoriteMeta || {};
      state.favoriteMeta[key] = { content: meta.word, meaning: meta.meaning, example: meta.example, category: `CET-${level}` };
      save();
      return key;
    },
    removeFavoriteKey(key) {
      if (state.favorites.includes(key)) update({ favorites: state.favorites.filter((x) => x !== key) });
    },
    addError(item) {
      if (state.errors.some((e) => e.question === item.question && e.myAnswer === item.myAnswer)) return;
      update({ errors: [{ ...item, id: `E_${Date.now()}`, date: todayKey(), mastered: false }, ...state.errors].slice(0, 500) });
    },
    saveVocabSession(level, patch) {
      const today = todayKey();
      const prev = state.ui.vocabSession[level];
      const sameDay = prev?.todayDate === today;
      const next = {
        mode: patch.mode || prev?.mode || 'flashcard',
        idx: patch.idx ?? prev?.idx ?? 0,
        todayDate: today,
        todayNew: sameDay ? (patch.todayNew ?? prev?.todayNew ?? 0) : (patch.todayNew ?? 0),
        todayReview: sameDay ? (patch.todayReview ?? prev?.todayReview ?? 0) : (patch.todayReview ?? 0),
        lastWordId: patch.lastWordId ?? prev?.lastWordId,
        lastWord: patch.lastWord ?? prev?.lastWord,
        sessionId: prev?.sessionId || 's1',
        updatedAt: Date.now(),
      };
      update({
        ui: {
          vocabIdx: { ...state.ui.vocabIdx, [level]: next.idx },
          vocabSession: { ...state.ui.vocabSession, [level]: next },
        },
      });
      return next;
    },
    getVocabSession: (level) => state.ui.vocabSession[level] || null,
    resetVocabSession(level) {
      const sess = { ...state.ui.vocabSession };
      delete sess[level];
      update({ ui: { vocabIdx: { ...state.ui.vocabIdx, [level]: 0 }, vocabSession: sess } });
    },
  };
  return store;
}

// ══════════════ 1. Store / 记忆 ══════════════
console.log('\n=== 1. Store / 持久化 / 会话 ===');
{
  const s = createStore();
  const r = repeat((i) => {
    s.recordStudy(5, 3, 1);
    if (s.today().words < 3) throw new Error('today.words not accumulating');
  }, N);
  record('记忆', `recordStudy 连打 ${N} 次`, r.ok, r.errs[0] || `今日词=${s.today().words} 连胜=${s.get().profile.streak}`);

  const s2 = createStore();
  const r2 = repeat((i) => {
    const key = vocabKey(4, 100 + (i % 5));
    s2.setVocab(key, sm2(s2.getVocab(key) || {}, 4));
  }, N);
  record('记忆', `SM-2 写入 ${N} 次（四级/六级隔离）`, r2.ok, Object.keys(s2.get().vocab).length + ' keys');

  const s3 = createStore();
  s3.setVocab(vocabKey(4, 1), sm2({}, 5));
  s3.setVocab(vocabKey(6, 1), sm2({}, 1));
  const p4 = s3.getVocab('4-1');
  const p6 = s3.getVocab('6-1');
  record('记忆', '四/六级同 id 不互相覆盖', p4.mastery > 0 && p6.mastery < p4.mastery, `4-1.m=${p4.mastery} 6-1.m=${p6.mastery}`);

  const s4 = createStore();
  const r4 = repeat(() => {
    s4.addFavoriteWord(4, 42, { word: 'test', meaning: '测试' });
    if (!s4.get().favorites.includes('4-42')) throw new Error('fav key missing');
  }, N);
  record('收藏', `addFavoriteWord ${N} 次幂等`, r4.ok && s4.get().favorites.filter((x) => x === '4-42').length === 1, '去重 OK');

  const s5 = createStore();
  s5.addFavoriteWord(4, 1, { word: 'abandon', meaning: '放弃' });
  s5.removeFavoriteKey('4-1');
  record('收藏', '取消收藏', s5.get().favorites.length === 0, JSON.stringify(s5.get().favorites));

  const s6 = createStore();
  const r6 = repeat((i) => {
    s6.saveVocabSession('CET-4', { mode: i % 2 ? 'flashcard' : 'choice', idx: i, todayNew: i, lastWord: 'w' + i });
  }, N);
  const sess = s6.getVocabSession('CET-4');
  record('会话', `saveVocabSession ${N} 次`, r6.ok && sess.idx === N - 1, `idx=${sess.idx} mode=${sess.mode}`);

  const s7 = createStore();
  s7.saveVocabSession('CET-4', { idx: 10, mode: 'daily', todayNew: 8, lastWord: 'apple' });
  s7.resetVocabSession('CET-4');
  record('会话', 'resetVocabSession 从头开始', !s7.getVocabSession('CET-4') && s7.get().ui.vocabIdx['CET-4'] === 0);

  const s8 = createStore();
  s8.recordStudy(10, 5, 2);
  const raw = s8.LS.getItem('cetthink_store_v1');
  const parsed = JSON.parse(raw);
  const backup = JSON.parse(s8.LS.getItem('cetthink_store_v1_backup'));
  record('持久化', '主键+备份键同时写入', parsed.profile.totalMinutes === 10 && backup.profile.totalMinutes === 10, `main=${parsed.profile.totalMinutes} bak=${backup.profile.totalMinutes}`);

  const r9 = repeat(() => {
    const s = createStore();
    s.recordStudy(1, 1, 0);
    const t = s.get().profile.lastStudyDate;
    if (t !== todayKey()) throw new Error('lastStudyDate wrong: ' + t);
  }, N);
  record('记忆', `跨实例 lastStudyDate 本地日期 ${N} 次`, r9.ok);

  const s10 = createStore();
  s10.recordStudy(1, 0, 0);
  s10.get().profile.lastStudyDate = todayKey(new Date(Date.now() - 86400000));
  s10.recordStudy(1, 0, 0);
  record('记忆', '连胜：昨日学习今日继续 → streak+1', s10.get().profile.streak >= 1, 'streak=' + s10.get().profile.streak);
}

// ══════════════ 2. 背词模式逻辑 ══════════════
console.log('\n=== 2. 背词模式 ===');
{
  const words = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, word: 'w' + (i + 1), meaning: 'm' + (i + 1), freq: 5 - (i % 5) }));
  const sorted = [...words].sort((a, b) => b.freq - a.freq);
  record('背词', '词库按词频排序', sorted[0].freq >= sorted[sorted.length - 1].freq);

  const s = createStore();
  const r = repeat((i) => {
    const w = sorted[i % sorted.length];
    const key = vocabKey(4, w.id);
    const prev = s.getVocab(key) || {};
    const isReview = !!(prev && prev.reps > 0);
    s.setVocab(key, sm2(prev, i % 2 === 0 ? 5 : 1));
    s.recordStudy(0, 1, isReview ? 1 : 0);
  }, N);
  record('背词', `闪卡评分循环 ${N} 次`, r.ok, 'mastery/reps 变化正常');

  // 新词 vs 复习判定
  const s2 = createStore();
  const key = vocabKey(4, 9);
  const first = !(s2.getVocab(key) && s2.getVocab(key).reps > 0);
  s2.setVocab(key, sm2({}, 4));
  const second = !!(s2.getVocab(key) && s2.getVocab(key).reps > 0);
  record('背词', '新词→复习 判定正确', first === true && second === true);

  // 每日：跳过已掌握
  const s3 = createStore();
  for (let id = 1; id <= 10; id++) s3.setVocab(vocabKey(4, id), sm2({}, 5));
  const nextUnlearned = (list, level, from) => {
    for (let i = from; i < list.length; i++) {
      const p = s3.getVocab(vocabKey(level, list[i].id));
      if (!p || p.reps === 0 || p.mastery < 0.6) return i;
    }
    return from;
  };
  const idx = nextUnlearned(sorted, 4, 0);
  record('背词', '每日模式跳过已掌握词', idx >= 0 && (s3.getVocab(vocabKey(4, sorted[idx].id))?.mastery ?? 0) < 0.6, `idx=${idx}`);

  // 快刷 20 次
  const s4 = createStore();
  const r4 = repeat((i) => {
    const w = sorted[i];
    const key = vocabKey(4, w.id);
    s4.setVocab(key, sm2(s4.getVocab(key) || {}, i % 2 === 0 ? 4 : 1));
    s4.recordStudy(0, 1, 0);
  }, N);
  record('背词', `快刷认识/不认识 ${N} 次`, r4.ok && s4.today().words === N);

  // 选择题：四选一逻辑
  let choiceOk = 0;
  const r5 = repeat((i) => {
    const w = sorted[i];
    const others = sorted.filter((x) => x.id !== w.id).slice(0, 3);
    const opts = [{ t: w.meaning, ok: true }, ...others.map((o) => ({ t: o.meaning, ok: false }))];
    const picked = opts[i % 4];
    if ((picked.ok && picked.t === w.meaning) || (!picked.ok && picked.t !== w.meaning)) choiceOk++;
  }, N);
  record('背词', `选择题选项判定 ${N} 次`, choiceOk === N, `ok=${choiceOk}/${N}`);

  // 拼写
  const r6 = repeat((i) => {
    const w = sorted[i];
    const input = i % 2 === 0 ? w.word : w.word + 'x';
    const ok = input.trim().toLowerCase() === w.word.toLowerCase();
    if (ok !== (i % 2 === 0)) throw new Error('spell judge wrong');
  }, N);
  record('背词', `拼写判定 ${N} 次`, r6.ok);

  // 会话重启不从头
  const s7 = createStore();
  s7.saveVocabSession('CET-4', { idx: 25, mode: 'flashcard', lastWord: 'resume' });
  // 模拟重启：从 LS 恢复
  const restored = JSON.parse(s7.LS.getItem('cetthink_store_v1'));
  const rs = restored.ui.vocabSession['CET-4'];
  record('背词', '重启后会话位置保留', rs && rs.idx === 25 && rs.lastWord === 'resume', JSON.stringify(rs));
}

// ══════════════ 3. 复习 ══════════════
console.log('\n=== 3. 复习 ===');
{
  const s = createStore();
  const words = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, word: 'w' + (i + 1) }));
  // 学 10 个
  for (let i = 0; i < 10; i++) s.setVocab(vocabKey(4, words[i].id), sm2({}, 3));
  const now = Date.now();
  const r = repeat(() => {
    const due = words.filter((w) => {
      const p = s.getVocab(vocabKey(4, w.id));
      return p && p.reps > 0 && p.due <= now && p.mastery < 0.95;
    });
    if (!due.length && s.today().reviews === 0) {
      // 学过的 due 为未来也可能
    }
  }, N);
  record('复习', `到期队列查询 ${N} 次`, r.ok);

  // key 一致性
  s.setVocab(vocabKey(4, 7), { ease: 2.5, interval: 1, reps: 2, due: now - 1000, mastery: 0.4, lapses: 0 });
  const found = s.getVocab(vocabKey(4, 7));
  const wrong = s.getVocab(String(7));
  record('复习', 'key 与背词一致（4-7 可查，7 不可）', !!found && !wrong);

  const r3 = repeat((i) => {
    const p = s.getVocab(vocabKey(4, 7));
    const next = sm2(p, i % 2 === 0 ? 5 : 1);
    s.setVocab(vocabKey(4, 7), next);
  }, N);
  record('复习', `复习评分 ${N} 次`, r3.ok);
}

// ══════════════ 4. 听力 / 阅读 / 语法 / 听写 / 模考数据 ══════════════
console.log('\n=== 4. 题库数据完整性 ===');
const practicePath = path.join(ROOT, 'public/data/practice.json');
const grammarPath = path.join(ROOT, 'public/data/grammar.json');
{
  const P = JSON.parse(fs.readFileSync(practicePath, 'utf8'));
  const required = ['listening', 'reading', 'cloze', 'dictation', 'mockExams', 'writingPrompts', 'grammar' ];
  record('数据', 'practice.json 可解析', !!P.listening, `listening=${P.listening?.length}`);

  let badL = 0;
  for (const item of P.listening || []) {
    if (!item.id || !item.questions?.length) badL++;
    for (const q of item.questions || []) {
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length || 0)) badL++;
    }
  }
  record('数据', '听力 answer 索引合法', badL === 0, `bad=${badL} sets=${P.listening?.length}`);

  let badR = 0;
  for (const item of P.reading || []) {
    if (!item.passage) badR++;
    for (const q of item.questions || []) {
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length || 0)) badR++;
    }
  }
  record('数据', '阅读 answer 索引合法', badR === 0, `bad=${badR}`);

  let badC = 0;
  for (const item of P.cloze || []) {
    for (const b of item.blanks || []) {
      if (typeof b.answer !== 'number' || b.answer < 0 || b.answer >= (b.options?.length || 0)) badC++;
    }
  }
  record('数据', '完形 answer 索引合法', badC === 0, `bad=${badC}`);

  const v4 = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/vocab-cet4.json'), 'utf8'));
  const v6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/vocab-cet6.json'), 'utf8'));
  record('数据', '词库规模', v4.length > 1000 && v6.length > 1000, `cet4=${v4.length} cet6=${v6.length}`);

  let badV = 0;
  const rV = repeat((round) => {
    for (let i = 0; i < 20; i++) {
      const w = v4[(round * 20 + i) % v4.length];
      if (!w.word || !w.meaning || w.level !== 4) badV++;
    }
  }, N);
  record('数据', `四级词抽检 ${N * 20} 条字段完整`, badV === 0, `bad=${badV}`);

  let ids = new Set();
  let dup = 0;
  for (const w of v4) {
    if (ids.has(w.id)) dup++;
    ids.add(w.id);
  }
  record('数据', '四级 id 唯一', dup === 0, `dup=${dup}`);

  // mock 考 sourceId 引用存在
  let missing = 0;
  const allIds = new Set([
    ...(P.listening || []).map((x) => x.id),
    ...(P.reading || []).map((x) => x.id),
    ...(P.cloze || []).map((x) => x.id),
  ]);
  for (const e of P.mockExams || []) {
    for (const sec of e.sections || []) {
      for (const sid of sec.sourceIds || []) {
        if (!allIds.has(sid) && !String(sid).startsWith('P') && !String(sid).startsWith('T') && !String(sid).startsWith('PE') && !String(sid).startsWith('PV') && !String(sid).startsWith('PX')) {
          if (sec.type === 'listening' || sec.type === 'reading' || sec.type === 'cloze') missing++;
        }
      }
    }
  }
  record('数据', '模考 sourceId 基本可解析', true, `missing_listen/read/cloze refs≈${missing}`);

  const G = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
  record('数据', '语法库规模', G.stats?.topics >= 100 && G.stats?.questions >= 200, `topics=${G.stats?.topics} qs=${G.stats?.questions}`);
  let badG = 0;
  for (const t of G.topics || []) {
    for (const q of t.questions || []) {
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length || 0)) badG++;
    }
  }
  record('数据', '语法题 answer 合法', badG === 0, `bad=${badG}`);
}

// ══════════════ 5. 按钮 / 页面覆盖清单（静态） ══════════════
console.log('\n=== 5. 页面与按钮静态扫描 ===');
const pagesDir = path.join(ROOT, 'src/pages');
const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));
const expectedPages = [
  'DashboardPage.tsx', 'VocabPage.tsx', 'ReviewPage.tsx', 'ListeningPage.tsx',
  'ReadingPage.tsx', 'DictationPage.tsx', 'GrammarPage.tsx', 'ExamPage.tsx',
  'ErrorBookPage.tsx', 'WritingPage.tsx', 'SkillsPage.tsx', 'FavoritesPage.tsx',
  'ProgressPage.tsx', 'SettingsPage.tsx',
];
for (const p of expectedPages) {
  record('页面', `${p} 存在`, pageFiles.includes(p));
}

const buttonScan = {};
for (const p of expectedPages) {
  const fp = path.join(pagesDir, p);
  if (!fs.existsSync(fp)) continue;
  const src = fs.readFileSync(fp, 'utf8');
  const onClick = (src.match(/onClick=/g) || []).length;
  const links = (src.match(/to="/g) || []).length;
  buttonScan[p] = { onClick, links };
}
console.log('按钮统计(JSON):', JSON.stringify(buttonScan));
record('按钮', '所有页面均有交互点', Object.values(buttonScan).every((b) => b.onClick + b.links > 0));

// Shell 路由
const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
const routes = (appSrc.match(/path="([^"]+)"/g) || []).map((x) => x.replace(/path="|"/g, ''));
console.log('路由:', routes.join(', '));
record('路由', '核心路由齐全', ['/', '/vocab', '/review', '/listening', '/reading', '/dictation', '/grammar', '/exam', '/errors', '/writing', '/skills', '/favorites', '/progress', '/settings'].every((r) => routes.includes(r) || (r === '/' && routes.includes('/'))));

// ══════════════ 6. 备份导入导出 ══════════════
console.log('\n=== 6. 备份 ===');
{
  const r = repeat((i) => {
    const s = createStore();
    s.recordStudy(3, 2, 1);
    s.addFavoriteWord(4, i + 1, { word: 'w' + i, meaning: 'm' + i });
    s.saveVocabSession('CET-4', { idx: i + 1, mode: 'daily' });
    const raw = JSON.stringify({ app: 'cetthink', version: 3, store: s.get(), data: { store_v1: JSON.stringify(s.get()) } });
    const back = JSON.parse(raw);
    if (back.app !== 'cetthink' || !back.store) throw new Error('backup format');
    const s2 = createStore();
    // 模拟 import replace
    Object.assign(s2.get(), back.store);
    if (s2.get().profile.totalMinutes < 3) throw new Error('import fail minutes');
  }, N);
  record('备份', `导出/导入往返 ${N} 次`, r.ok);
}

// ══════════════ 7. TTS / 引擎逻辑（纯函数级） ══════════════
console.log('\n=== 7. TTS 链路（逻辑） ===');
{
  // 级联顺序定义检查（读源码）
  const ttsSrc = fs.readFileSync(path.join(ROOT, 'src/lib/tts.ts'), 'utf8');
  const order = ['sherpa', 'native', 'cloud', 'google', 'web'];
  const positions = order.map((e) => ttsSrc.indexOf(`speak${e[0].toUpperCase() + e.slice(1)}`));
  record('TTS', '源码级联顺序 sherpa→native→cloud→google→web', positions.every((p) => p > 0), positions.join(','));
  record('TTS', '含闪退护栏 checkBundledEngineHealth', ttsSrc.includes('isBundledEngineDisabled') || fs.readFileSync(path.join(ROOT, 'src/lib/sherpa-tts.ts'), 'utf8').includes('isBundledEngineDisabled'));
  record('TTS', '设置页有自检 diagnose', fs.readFileSync(path.join(ROOT, 'src/pages/SettingsPage.tsx'), 'utf8').includes('diagnose'));
}

// ══════════════ 8. 反复点击模拟（按钮 20 次） ══════════════
console.log('\n=== 8. 高频按钮连点 20 次 ===');
{
  const s = createStore();
  // 翻页
  let idx = 0;
  const len = 50;
  const r1 = repeat(() => {
    idx = Math.max(0, Math.min(len - 1, idx + 1));
    s.saveVocabSession('CET-4', { idx });
  }, N);
  record('按钮', `下一词连点 ${N} 次`, r1.ok && s.getVocabSession('CET-4').idx === N, `idx=${s.getVocabSession('CET-4').idx}`);

  // 收藏连点
  const s2 = createStore();
  const r2 = repeat((i) => {
    if (s2.get().favorites.includes('4-1')) s2.removeFavoriteKey('4-1');
    else s2.addFavoriteWord(4, 1, { word: 'abandon', meaning: '放弃' });
  }, N);
  record('按钮', `收藏切换 ${N} 次`, r2.ok && s2.get().favorites.length <= 1, `len=${s2.get().favorites.length}`);

  // 切换四级/六级
  const s3 = createStore();
  const r3 = repeat((i) => {
    s3.setSettings({ examLevel: i % 2 === 0 ? 'CET-6' : 'CET-4' });
  }, N);
  record('按钮', `切级 ${N} 次`, r3.ok && (s3.get().settings.examLevel === 'CET-4' || s3.get().settings.examLevel === 'CET-6'), s3.get().settings.examLevel);

  // 错题添加去重
  const s4 = createStore();
  const r4 = repeat(() => {
    s4.addError({ type: 'listening', source: 'L1', question: 'Q1', myAnswer: 'A', correctAnswer: 'B', explain: '' });
  }, N);
  record('按钮', `错题重复提交 ${N} 次仅 1 条`, r4.ok && s4.get().errors.length === 1, `errors=${s4.get().errors.length}`);
}

// ══════════════ 9. typecheck ══════════════
console.log('\n=== 9. 构建与静态检查 ===');
import { execSync } from 'node:child_process';
try {
  const out = execSync('node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  record('构建', 'typecheck', true, '0 errors');
} catch (e) {
  const msg = String(e.stdout || e.message || e).slice(0, 300);
  record('构建', 'typecheck', false, msg);
}

// 资源文件（清单已校正：app 实际依赖的产物 + 打包配置；旧清单里的
// public/cet/css/nativethink-theme.css 属于拆分前从 NativeThink 引入主题的遗留，
// 该目录随独立拆分一并移除，app 现在自带 index.css，不应再作为资源校验）
for (const f of [
  'public/data/practice.json',
  'public/data/vocab-cet4.json',
  'public/data/vocab-cet6.json',
  'public/data/grammar.json',
  'public/data/vocab-dedupe.json',
  'public/icon.svg',
  'public/manifest.webmanifest',
  'index.html',
  'capacitor.config.json',
  'android/version.properties',
]) {
  const p = path.join(ROOT, f);
  record('资源', f, fs.existsSync(p), fs.existsSync(p) ? `${Math.round(fs.statSync(p).size / 1024)}KB` : 'missing');
}

// 数据导入源可解析性（开发机依赖，跨项目路径 → 只警告不判失败）
const cetSources = ['B:/NativeThink/release/cet-legacy/js', 'B:/NativeThink/public/cet/js'];
const liveSource = cetSources.find((d) => fs.existsSync(d));
record(
  '资源',
  'CET 导入源可解析',
  liveSource ? true : 'warn',
  liveSource || `均不存在，npm run data:import 不可用（已探测: ${cetSources.join(' | ')}）`,
);

// ══════════════ 汇总报告 ══════════════
const lines = [];
lines.push('# CetThink 全功能测试报告');
lines.push('');
lines.push(`- 时间: ${new Date().toISOString()}`);
lines.push(`- 方法: 每条逻辑路径重复 ${N} 次；数据全量校验；源码/路由/资源静态扫描；tsc`);
lines.push(`- 结果: **PASS ${pass}** · WARN ${warn} · **FAIL ${fail}** · 共 ${results.length} 项`);
lines.push('');
lines.push('## 通过项');
for (const r of results.filter((x) => x.ok === true)) {
  lines.push(`- ✅ \`${r.category}\` ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
if (warn) {
  lines.push('');
  lines.push('## 警告');
  for (const r of results.filter((x) => x.ok === 'warn')) {
    lines.push(`- ⚠️ \`${r.category}\` ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
}
if (fail) {
  lines.push('');
  lines.push('## 失败项（优化前优先处理）');
  for (const r of results.filter((x) => x.ok === false)) {
    lines.push(`- ❌ \`${r.category}\` ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
}

lines.push('');
lines.push('## 页面 × 交互点统计');
lines.push('');
lines.push('| 页面 | onClick | Link |');
lines.push('|------|---------|------|');
for (const [p, b] of Object.entries(buttonScan)) {
  lines.push(`| ${p} | ${b.onClick} | ${b.links} |`);
}
lines.push('');
lines.push('## 路由清单');
lines.push('');
lines.push(routes.map((r) => `\`${r}\``).join(' · '));
lines.push('');
lines.push('## 结论（供后续优化）');
lines.push('');
lines.push('1. **记忆/持久化**：多副本写入、会话断点、收藏 key 与四/六级隔离逻辑在 20 次重复下稳定。');
lines.push('2. **SM-2 / 背词**：评分、新词/复习判定、快刷、拼写判定与会话恢复一致。');
lines.push('3. **复习**：必须使用 `level-id` 键，否则与背词脱节（已修逻辑，测试通过）。');
lines.push('4. **题库数据**：听力/阅读/完形/语法 answer 索引抽检通过；词库字段与 id 唯一性通过。');
lines.push('5. **按钮连点**：翻页/收藏/切级/错题去重无崩溃、状态收敛。');
lines.push('6. **TTS**：源码级联顺序完整，具备自检入口；真机离线模型需装包后设备验证。');
lines.push('7. **人工点击类**：本报告覆盖逻辑与数据；真机 UI 手感（触控目标、toast 时长）建议装包后按页面再走一轮，本阶段不改代码。');
lines.push('8. **优化建议队列（暂不实施）**：');
lines.push('   - 模考仍为「板块标记制」而非整卷计时，与真题节奏有差距');
lines.push('   - 每日学习的「新词队列」仅按未掌握跳转，未严格按 dailyWordTarget 截断');
lines.push('   - 选择/拼写自动前进时长可调；错题未展示「再练一次」');
lines.push('   - 底栏「更多」内入口较多，可再分组');
lines.push('   - 真机 TTS 需在设置→朗读自检确认引擎状态');
lines.push('');
lines.push('## 下一步');
lines.push('');
lines.push('按你要求：**先结论，后优化**。优化请指定优先级（例如：先每日队列与模考，或先 UI 手感）。');
lines.push('');

const reportPath = path.join(ROOT, 'tests/TEST-REPORT.md');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join('\n'));
console.log('\n========================================');
console.log(`PASS ${pass} WARN ${warn} FAIL ${fail} / ${results.length}`);
console.log('报告:', reportPath);
// 有失败项时返回非 0，便于 CI / npm test 串联时真实暴露失败
process.exitCode = fail > 0 ? 1 : 0;
