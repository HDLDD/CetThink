import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const checks = [];
function rec(name, ok, reason) {
  checks.push({ name, ok, reason });
  console.log(ok ? 'OK  ' : 'FAIL', name, '—', reason);
}

const shell = fs.readFileSync(path.join(root, 'src/components/Shell.tsx'), 'utf8');
rec('手机顶栏 safe-area-top', shell.includes('safe-top'), 'header 使用 safe-top');
rec('侧边栏 desktop/lg', shell.includes('lg:flex') && shell.includes('aside'), '≥lg 显示侧栏');
rec('手机底部 Tab + lg 隐藏', shell.includes('fixed') && shell.includes('lg:hidden'), 'bottom nav');
rec('抽屉完整菜单', shell.includes('drawerOpen'), 'drawer/sheet');
const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
rec('CSS safe-area-inset-top', css.includes('safe-area-inset-top'), 'inset top');
rec('viewport-fit=cover', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('viewport-fit=cover'), 'meta');
rec('capacitor StatusBar 配置', fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8').includes('StatusBar'), 'plugins.StatusBar');
rec('Android styles 透明状态栏', fs.readFileSync(path.join(root, 'android/app/src/main/res/values/styles.xml'), 'utf8').includes('statusBarColor'), 'styles.xml');

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const routes = ['/', '/vocab', '/review', '/listening', '/reading', '/dictation', '/grammar', '/exam', '/errors', '/writing', '/skills', '/favorites', '/progress', '/settings'];
const routeOk = routes.every((r) => (r === '/' ? app.includes('path="/"') : app.includes(`path="${r}"`)));
rec('全部路由注册', routeOk, routes.length + ' routes');

const v4 = JSON.parse(fs.readFileSync(path.join(root, 'public/data/vocab-cet4.json'), 'utf8'));
const ids = new Set();
let d = 0;
for (const w of v4) {
  if (ids.has(w.id)) d++;
  ids.add(w.id);
}
rec('CET4 id 唯一', d === 0, `dup=${d} size=${v4.length}`);

const P = JSON.parse(fs.readFileSync(path.join(root, 'public/data/practice.json'), 'utf8'));
rec('听写无空包', (P.dictation || []).every((x) => x.sentences && x.sentences.length > 0), `n=${P.dictation?.length}`);
rec('听力>=40', (P.listening || []).length >= 40, String(P.listening?.length));
rec('阅读>=20', (P.reading || []).length >= 20, String(P.reading?.length));
rec('模考>=10', (P.mockExams || []).length >= 10, String(P.mockExams?.length));
rec('作文范文>=20', (P.writingLibrary || []).length >= 20, String(P.writingLibrary?.length));
const G = JSON.parse(fs.readFileSync(path.join(root, 'public/data/grammar.json'), 'utf8'));
rec('语法专题>=100', (G.stats?.topics || 0) >= 100, String(G.stats?.topics));

const libs = ['store.ts', 'persist.ts', 'safe-storage.ts', 'use-memory.ts', 'tts.ts', 'sherpa-tts.ts', 'native-tts.ts', 'ai.ts', 'achievements.ts', 'backup.ts', 'sfx.ts', 'page-memory.ts'];
rec('核心 lib 齐全', libs.every((f) => fs.existsSync(path.join(root, 'src/lib', f))), libs.length + ' files');

const vocab = fs.readFileSync(path.join(root, 'src/pages/VocabPage.tsx'), 'utf8');
rec('背词多元模式', ['flashcard', 'choice', 'spelling', 'listening', 'quick', 'daily'].every((m) => vocab.includes(m)), '6 modes');
rec('背词断点续学', vocab.includes('VocabSession') || vocab.includes('saveVocabSession'), 'session');
rec('每日队列 quota', vocab.includes('dailyQueue') || vocab.includes('dailyRemaining'), 'queue');
rec('收藏带释义', vocab.includes('addFavoriteWord'), 'rich fav');

const exam = fs.readFileSync(path.join(root, 'src/pages/ExamPage.tsx'), 'utf8');
rec('模考计时', exam.includes('fmtClock') || exam.includes('remainSec'), 'timer');
rec('模考续考/保存', exam.includes('exam_progress') || exam.includes('resumeExam'), 'resume');

const review = fs.readFileSync(path.join(root, 'src/pages/ReviewPage.tsx'), 'utf8');
rec('复习使用 vocabKey', review.includes('vocabKey'), 'level-id');

const err = fs.readFileSync(path.join(root, 'src/pages/ErrorBookPage.tsx'), 'utf8');
rec('错题再练', err.includes('reviewId') || err.includes('再练'), 'retry');

const ttsSrc = fs.readFileSync(path.join(root, 'src/lib/tts.ts'), 'utf8');
rec('TTS 离线 sherpa', ttsSrc.includes('sherpa'), 'offline');
rec('TTS 云端兜底', ttsSrc.includes('cloud') || ttsSrc.includes('api/tts'), 'cloud');

const dict = fs.readFileSync(path.join(root, 'src/pages/DictationPage.tsx'), 'utf8');
rec('听写续学', dict.includes('cetthink_dict_pack') || dict.includes('resumePackId'), 'resume');

const listen = fs.readFileSync(path.join(root, 'src/pages/ListeningPage.tsx'), 'utf8');
rec('听力原文可隐藏', listen.includes('showTranscript'), 'transcript toggle');
rec('听力进度保存', listen.includes('listen_pos'), 'progress');

const pages = fs.readdirSync(path.join(root, 'src/pages')).filter((f) => f.endsWith('.tsx'));
rec('页面文件>=14', pages.length >= 14, String(pages.length));

// typecheck
import { execSync } from 'node:child_process';
try {
  execSync('node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit', { cwd: root, stdio: 'pipe' });
  rec('typecheck', true, '0 errors');
} catch (e) {
  rec('typecheck', false, String(e.stdout || e.message).slice(0, 200));
}

const pass = checks.filter((c) => c.ok).length;
const fail = checks.filter((c) => !c.ok).length;
console.log('\n==== VERIFY', pass, 'pass /', fail, 'fail ====');
fs.writeFileSync(path.join(root, 'tests/VERIFY-LIST.json'), JSON.stringify({ pass, fail, checks }, null, 2));
// 失败时返回非 0，便于 CI / npm test 串联时真实暴露失败
process.exitCode = fail > 0 ? 1 : 0;
