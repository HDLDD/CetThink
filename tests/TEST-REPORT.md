# CetThink 全功能测试报告

- 时间: 2026-09-23T17:14:26.743Z
- 方法: 每条逻辑路径重复 20 次；数据全量校验；源码/路由/资源静态扫描；tsc
- 结果: **PASS 67** · WARN 0 · **FAIL 0** · 共 67 项

## 通过项
- ✅ `记忆` recordStudy 连打 20 次 — 今日词=60 连胜=1
- ✅ `记忆` SM-2 写入 20 次（四级/六级隔离） — 5 keys
- ✅ `记忆` 四/六级同 id 不互相覆盖 — 4-1.m=0.2 6-1.m=0
- ✅ `收藏` addFavoriteWord 20 次幂等 — 去重 OK
- ✅ `收藏` 取消收藏 — []
- ✅ `会话` saveVocabSession 20 次 — idx=19 mode=flashcard
- ✅ `会话` resetVocabSession 从头开始
- ✅ `持久化` 主键+备份键同时写入 — main=10 bak=10
- ✅ `记忆` 跨实例 lastStudyDate 本地日期 20 次
- ✅ `记忆` 连胜：昨日学习今日继续 → streak+1 — streak=2
- ✅ `背词` 词库按词频排序
- ✅ `背词` 闪卡评分循环 20 次 — mastery/reps 变化正常
- ✅ `背词` 新词→复习 判定正确
- ✅ `背词` 每日模式跳过已掌握词 — idx=0
- ✅ `背词` 快刷认识/不认识 20 次
- ✅ `背词` 选择题选项判定 20 次 — ok=20/20
- ✅ `背词` 拼写判定 20 次
- ✅ `背词` 重启后会话位置保留 — {"mode":"flashcard","idx":25,"todayDate":"2026-09-24","todayNew":0,"todayReview":0,"lastWord":"resume","sessionId":"s1","updatedAt":1790183664484}
- ✅ `复习` 到期队列查询 20 次
- ✅ `复习` key 与背词一致（4-7 可查，7 不可）
- ✅ `复习` 复习评分 20 次
- ✅ `数据` practice.json 可解析 — listening=106
- ✅ `数据` 听力 answer 索引合法 — bad=0 sets=106
- ✅ `数据` 阅读 answer 索引合法 — bad=0
- ✅ `数据` 完形 answer 索引合法 — bad=0
- ✅ `数据` 词库规模 — cet4=4452 cet6=7408
- ✅ `数据` 四级词抽检 400 条字段完整 — bad=0
- ✅ `数据` 四级 id 唯一 — dup=0
- ✅ `数据` 模考 sourceId 基本可解析 — missing_listen/read/cloze refs≈0
- ✅ `数据` 语法库规模 — topics=130 qs=323
- ✅ `数据` 语法题 answer 合法 — bad=0
- ✅ `页面` DashboardPage.tsx 存在
- ✅ `页面` VocabPage.tsx 存在
- ✅ `页面` ReviewPage.tsx 存在
- ✅ `页面` ListeningPage.tsx 存在
- ✅ `页面` ReadingPage.tsx 存在
- ✅ `页面` DictationPage.tsx 存在
- ✅ `页面` GrammarPage.tsx 存在
- ✅ `页面` ExamPage.tsx 存在
- ✅ `页面` ErrorBookPage.tsx 存在
- ✅ `页面` WritingPage.tsx 存在
- ✅ `页面` SkillsPage.tsx 存在
- ✅ `页面` FavoritesPage.tsx 存在
- ✅ `页面` ProgressPage.tsx 存在
- ✅ `页面` SettingsPage.tsx 存在
- ✅ `按钮` 所有页面均有交互点
- ✅ `路由` 核心路由齐全
- ✅ `备份` 导出/导入往返 20 次
- ✅ `TTS` 源码级联顺序 sherpa→native→cloud→google→web — 5371,5850,6435,6831,7185
- ✅ `TTS` 含闪退护栏 checkBundledEngineHealth
- ✅ `TTS` 设置页有自检 diagnose
- ✅ `按钮` 下一词连点 20 次 — idx=20
- ✅ `按钮` 收藏切换 20 次 — len=0
- ✅ `按钮` 切级 20 次 — CET-4
- ✅ `按钮` 错题重复提交 20 次仅 1 条 — errors=1
- ✅ `构建` typecheck — 0 errors
- ✅ `资源` public/data/practice.json — 537KB
- ✅ `资源` public/data/vocab-cet4.json — 1663KB
- ✅ `资源` public/data/vocab-cet6.json — 2866KB
- ✅ `资源` public/data/grammar.json — 113KB
- ✅ `资源` public/data/vocab-dedupe.json — 0KB
- ✅ `资源` public/icon.svg — 0KB
- ✅ `资源` public/manifest.webmanifest — 0KB
- ✅ `资源` index.html — 1KB
- ✅ `资源` capacitor.config.json — 0KB
- ✅ `资源` android/version.properties — 0KB
- ✅ `资源` CET 导入源可解析 — B:/NativeThink/release/cet-legacy/js

## 页面 × 交互点统计

| 页面 | onClick | Link |
|------|---------|------|
| DashboardPage.tsx | 5 | 4 |
| VocabPage.tsx | 20 | 0 |
| ReviewPage.tsx | 4 | 2 |
| ListeningPage.tsx | 10 | 0 |
| ReadingPage.tsx | 6 | 0 |
| DictationPage.tsx | 8 | 0 |
| GrammarPage.tsx | 10 | 0 |
| ExamPage.tsx | 9 | 1 |
| ErrorBookPage.tsx | 8 | 3 |
| WritingPage.tsx | 8 | 0 |
| SkillsPage.tsx | 5 | 0 |
| FavoritesPage.tsx | 3 | 1 |
| ProgressPage.tsx | 2 | 0 |
| SettingsPage.tsx | 16 | 0 |

## 路由清单

`/` · `/vocab` · `/review` · `/listening` · `/reading` · `/dictation` · `/grammar` · `/exam` · `/errors` · `/writing` · `/skills` · `/favorites` · `/progress` · `/settings` · `*`

## 结论（供后续优化）

1. **记忆/持久化**：多副本写入、会话断点、收藏 key 与四/六级隔离逻辑在 20 次重复下稳定。
2. **SM-2 / 背词**：评分、新词/复习判定、快刷、拼写判定与会话恢复一致。
3. **复习**：必须使用 `level-id` 键，否则与背词脱节（已修逻辑，测试通过）。
4. **题库数据**：听力/阅读/完形/语法 answer 索引抽检通过；词库字段与 id 唯一性通过。
5. **按钮连点**：翻页/收藏/切级/错题去重无崩溃、状态收敛。
6. **TTS**：源码级联顺序完整，具备自检入口；真机离线模型需装包后设备验证。
7. **人工点击类**：本报告覆盖逻辑与数据；真机 UI 手感（触控目标、toast 时长）建议装包后按页面再走一轮，本阶段不改代码。
8. **优化建议队列（暂不实施）**：
   - 模考仍为「板块标记制」而非整卷计时，与真题节奏有差距
   - 每日学习的「新词队列」仅按未掌握跳转，未严格按 dailyWordTarget 截断
   - 选择/拼写自动前进时长可调；错题未展示「再练一次」
   - 底栏「更多」内入口较多，可再分组
   - 真机 TTS 需在设置→朗读自检确认引擎状态

## 下一步

按你要求：**先结论，后优化**。优化请指定优先级（例如：先每日队列与模考，或先 UI 手感）。

## 补充测试（判定逻辑 ×20）

- ✅ 听力交卷 20 次（错题收集） — 20/20
- ✅ 听力正确答案可判定 — 20/20
- ✅ 阅读正确答案可判定 — 20/20
- ✅ 语法题提交 20 次 — 20/20
- ✅ 听写 normalize 判定 — 20/20
- ✅ 写作词数统计 — 20/20
- ✅ 本地题解 localAnalyze 结构 — 20/20
- ✅ 词库查找 by id — 20/20
- ✅ 词库重复 id 影响检索 — 20/20
- ✅ 收藏元数据可合并词库 — 20/20
- ✅ 模考板块标记后估分单调 — 20/20
- ✅ 错题 type 过滤 — 20/20

- 词库 CET4 重复 id 统计: **0**（备份/恢复与进度 key 需关注，属数据质量项）
