# CetThink × NativeThink 对齐重构计划

> **给执行者：** 本计划按阶段推进，每阶段结束都必须「可运行 + 可真机验收 + 可回滚」。阶段 0–1 已细化到可执行任务；阶段 2–7 给出任务清单与验收标准，进入该阶段时再展开为同等粒度的步骤（避免凭空写不可验证的代码）。
> 配套审计：`tests/AUDIT-backlog.md`（60 条，带双侧行号）、`tests/AUDIT-device.md`（14 路由真机实测）。

**Goal:** 把 CetThink 从「单 store + 手写 UI + 自研 TTS 级联」的独立实现，重构为与 NativeThink 同构的架构（分域 hooks + shadcn/Radix 基元 + `use-tts` 朗读架构 + 分级词库数据层），并补齐 NativeThink 已有的功能与使用习惯。

**Architecture:** 分域状态（一域一键、自带版本与时间戳）取代单体 store；`safe-storage` 作为唯一持久化入口、IndexedDB 带时间戳作为深副本；词库走 `src/data/wordbank`（按级 dynamic import + 版本化 IDB 缓存 + core/detail 拆分）；UI 走 shadcn 基元 + `src/components/ui`；朗读走 `use-tts`（分片/暂停/进度上报/看门狗）；手势与键盘走决策表 hooks。

**Tech Stack:** React 19 · Vite 8 · TypeScript 5.9 · Tailwind 4 · Capacitor 8（Android）· Radix UI + shadcn（new-york）· framer-motion · recharts · sonner · vaul · cmdk · zod + react-hook-form · sherpa-onnx（离线 TTS）。

## Global Constraints

- **禁止在 `B:\CetThink` 执行 `npm install`**：`node_modules` 是指向 `B:\NativeThink\node_modules` 的 junction；安装会把 junction 实体化并复制数 GB。新增依赖只在 `package.json` 声明，且**版本号必须与 NativeThink 完全一致**（同一份物理依赖）。
- **数据零丢失**：任何阶段都不得让用户已有学习数据（`cetthink_store_v1` 及其副本/IDB）失效；迁移失败必须保留旧数据并给出提示，禁止静默丢弃。
- **每阶段可发布**：阶段末必须 `npm test` 全绿 + 真机 CDP 验收通过 + git tag（回滚点）。
- **平台范围**：只保证 Android（Capacitor APK）与桌面浏览器；不引入 iOS 专属代码路径。
- **路径别名**：阶段 2 起统一 `@/* → ./src/*`，新代码一律用别名，旧相对路径可渐进替换。
- **主色保持 `#00B894`**：映射到 shadcn 主题变量 `--primary`，其余灰阶/圆角对齐 NativeThink（new-york、neutral、cssVariables）。
- **包名/签名不变**：`com.cetthink.app`，继续用 `android/nativethink-release.keystore`（仓库外，已 gitignore）。
- **离线可用**：新架构不得引入必须联网才能用的核心路径（朗读、背词、复习、进度）。

---

## 一、现状 → 目标 差异对照

| 维度 | CetThink 现状 | NativeThink 目标 | 影响 |
|---|---|---|---|
| 状态层 | 单体 `src/lib/store.ts`（530 行，一个 localStorage 键装全部） | 分域 hooks：`use-word-learning` / `use-learning-stats` / `use-achievements` / `use-favorites` / `use-spelling-learning` …一域一键 | 背词任何改动都触碰全局；无法按域迁移/降频 |
| 持久化 | 4 份 LS 副本 + IDB，按"痕迹分"选副本 | `safe-storage` 作用域键 + `idb.ts`（带时间戳）+ 按更新时间选副本 | 已修 2 个 P0，但仍有多余副本与全量序列化 |
| 词库数据 | `public/data/vocab-cet*.json` 1.6/2.8MB 整包 fetch + parse | `src/data/wordbank`：按级 dynamic import + 版本化 IDB 缓存 + core/detail 拆分 + `schema.ts` 富字段 | 首屏拉 4.6MB；`similar/forms/freq` 数据到 UI 之间断裂 |
| UI 基元 | 3 个自研组件，样式靠 className 手写 | 55 个 shadcn/Radix 基元 + `cn` + `components.json` | 交互/无障碍/一致性全面落后 |
| 外壳布局 | 自研 Shell（顶栏 + 底部 4 tab + 抽屉） | `components/ui/sidebar` + `sheet` + `drawer` + 安全区工具类 + `react-error-boundary` | 抽屉/浮层已多次踩坑（safe-top、backdrop-filter 包含块） |
| 反馈 | 自研 30 行 toast | `sonner` | 队列/位置/无障碍 |
| 动画 | 无 | `framer-motion` + `@formkit/auto-animate` | 翻卡/切页无过渡 |
| 图表 | div 拼柱状图 | `recharts` | 进度页无趋势/占比 |
| 背词 | 6 模式手写、无手势/键盘/撤销/屏蔽/笔记 | `use-word-learning` + `vocab-session`（冻结 order、relearn、forecast）+ `vocab-swipe` + `word-notes` + suspended | 见 backlog 第 1–15 条 |
| 朗读 | `tts.ts` 单文件级联（已修超时/看门狗/安卓禁用） | `use-tts`（45.6KB）：分片、`onChunk` 进度、暂停/续读、代际号、预取、在途去重、音色目录 + 设置面板 | 长文首音 36s、无暂停、无位置可见 |
| 统计/成就 | `use-memory.ts` 多处死代码、双真相源 | `use-learning-stats`（单一 storage 真相 + `displayStats` + 30s 跨天刷新）+ `use-achievements`（unlockedAt、批量解锁） | 进度页数字失真 |
| 表单/校验 | 手写受控组件 | `react-hook-form` + `zod`（设置页、写作） | 校验分散 |
| 本地 AI | 依赖 `nativethink.pages.dev` 代理 | `local-mt.ts` / `local-llm.ts`（transformers.js 本地推理） | 无网时解析/翻译不可用 |

## 二、目标文件结构

```
B:\CetThink\
├─ components.json               # 阶段 2：shadcn 配置（对齐 NativeThink）
├─ tsconfig.app.json             # 阶段 2：加 "@/*": ["./src/*"]
├─ src/
│  ├─ app.tsx                    # 路由表（由 App.tsx 更名对齐）
│  ├─ components/
│  │  ├─ ui/                     # 阶段 2：从 NativeThink 移植的 55 个基元
│  │  ├─ shell/                  # 侧栏 + 底部导航 + 抽屉（对齐 NativeThink 用法）
│  │  └─ <页面私有组件>
│  ├─ lib/
│  │  ├─ utils.ts                # cn()
│  │  ├─ safe-storage.ts         # 唯一持久化入口（已有，扩展 removeScoped）
│  │  ├─ idb.ts                  # 阶段 1：带时间戳的深副本
│  │  ├─ use-word-learning.ts    # 阶段 3：背词域（一域一键）
│  │  ├─ vocab-session.ts        # 阶段 3：冻结 order / relearn / forecast（srs.ts 演进而成）
│  │  ├─ vocab-swipe.ts          # 阶段 3：手势决策表
│  │  ├─ word-notes.ts           # 阶段 3：按词笔记
│  │  ├─ use-learning-stats.ts   # 阶段 6：统计单一真相
│  │  ├─ use-achievements.ts     # 阶段 6：成就（unlockedAt）
│  │  ├─ use-tts.ts              # 阶段 4：朗读架构（sherpa/native/cloud/edge + 分片 + 暂停）
│  │  ├─ tts-settings.ts         # 阶段 4
│  │  └─ migrate/                # 阶段 1：v1 → 分域键 的一次性迁移器
│  ├─ data/wordbank/             # 阶段 1：词库层
│  │  ├─ schema.ts               # 富词模型
│  │  ├─ wordbank.ts             # 分级加载 + IDB 缓存
│  │  └─ data/<level>.core.json / <level>.detail.json
│  ├─ pages/<PageName>/          # 阶段 3–6：页面目录化（index.tsx + components/）
│  └─ types/
├─ public/data/                  # 过渡期保留（阶段 1 生成的 core/detail 由脚本产出）
└─ tests/
   ├─ srs.test.mjs / persist.test.mjs   # 已有
   └─ device/                    # 阶段 0：把 tmp/ 下的 CDP 验收脚本转正
```

---

## 三、阶段 0：基线与护栏（0.5 天）

**目标：** 把已经写好的真机验收脚本转成常驻资产，建立每阶段都能跑的验收回路。

**Files:**
- Create: `tests/device/lib/cdp.mjs`、`tests/device/audit-routes.mjs`、`tests/device/verify-vocab.mjs`、`tests/device/verify-tts.mjs`、`tests/device/verify-persist.mjs`、`tests/device/README.md`
- Modify: `package.json`（新增 `verify:device` 脚本）、`tests/AUDIT-backlog.md`（加指针）

**Interfaces:**
- Produces: `connect(wsUrl) → { js(expr), shot(name), on(event, cb) }`；每个 `verify-*.mjs` 退出码 0/1，输出 `PASS/FAIL` 行。

- [ ] **Step 1** 建 `tests/device/lib/cdp.mjs`：抽出 `tmp/audit-device.mjs` 里的 WebSocket + `Runtime.evaluate` + 截图逻辑，导出 `connect()`。Run: `node -e "import('./tests/device/lib/cdp.mjs').then(m=>console.log(typeof m.connect))"` → 期望 `function`。
- [ ] **Step 2** 把 `tmp/audit-device.mjs` 挪成 `tests/device/audit-routes.mjs`，输出改写为 `tests/AUDIT-device.md`（路径不变）。Run: `node tests/device/audit-routes.mjs <ws>` → 期望 14 行路由指标 + 生成报告。
- [ ] **Step 3** 把 `tmp/verify-srs-device.mjs`、`tmp/verify-clear.mjs`、`tmp/verify-tts-switch.mjs`、`tmp/probe-tts-engine.mjs` 分别归入 `verify-vocab.mjs` / `verify-persist.mjs` / `verify-tts.mjs`，并修掉已知的测试自身缺陷（非幂等状态、跨 reload 的过期变量、`card` 变量复用）。Run: 三个脚本各自 exit 0。
- [ ] **Step 4** `package.json` 加 `"device:ws": "node tests/device/print-ws.mjs"`（打印当前 WebView CDP ws 地址，内含 `adb forward` 步骤）与 `"verify:device": "node tests/device/audit-routes.mjs && node tests/device/verify-vocab.mjs && node tests/device/verify-tts.mjs && node tests/device/verify-persist.mjs"`。
- [ ] **Step 5** 提交：`git commit -m "test(device): 真机 CDP 验收脚本转正（审计/背词/朗读/持久化）"`。

**验收：** `npm test` 绿 + `npm run verify:device` 在有设备时绿、无设备时给出可读错误（不是堆栈）。

---

## 四、阶段 1：数据与持久化地基（1.5 天）

**目标：** 词库与进度数据层先对齐 NativeThink —— 这是"从底层重构"的地基，后续所有页面都受益。

**Files:**
- Create: `src/data/wordbank/schema.ts`、`src/data/wordbank/wordbank.ts`、`scripts/build-wordbank.mjs`、`src/lib/idb.ts`、`src/lib/migrate/v1-to-v2.ts`
- Modify: `src/lib/safe-storage.ts`（加 `removeScoped()`、`listScopedKeys()`）、`src/lib/persist.ts`（副本降为 main + IDB）、`src/lib/store.ts`（改为薄兼容层，读旧键、写新键）
- Test: `tests/wordbank.test.mjs`、`tests/migrate.test.mjs`

**Interfaces:**
- `schema.ts`: `export interface Word { id: number; word: string; phonetic: string; pos: string; meaning: string; level: 4|6; freq: number; collocations?: string[]; synonyms?: string[]; antonyms?: string[]; wordFamily?: Record<string,string>; examples?: {en:string; zh:string}[]; register?: string; topics?: string[]; deepExplanation?: string; tip?: string }`
- `wordbank.ts`: `export async function loadWordbank(level: 4|6): Promise<Word[]>`（in-flight 去重 + IDB 版本化缓存）、`export async function loadWordDetail(level: 4|6): Promise<Record<number, Partial<Word>>>`
- `idb.ts`: `export async function idbGet<T>(key: string): Promise<{value:T; ts:number}|null>`、`idbSet(key, value)`、`idbDelete(key)`
- `migrate/v1-to-v2.ts`: `export function migrateV1(raw: unknown): { wordLearning: unknown; stats: unknown; favorites: unknown; ui: unknown; migratedFrom: 1 }`

- [ ] **Step 1** 写 `tests/wordbank.test.mjs`：断言 `loadWordbank(4)` 返回 4452 条、id 唯一、必填字段齐全、`loadWordDetail` 只返回增量字段。Run: `node tests/wordbank.test.mjs` → FAIL（模块不存在）。
- [ ] **Step 2** 写 `scripts/build-wordbank.mjs`：把 `public/data/vocab-cet{4,6}.json` 拆成 `src/data/wordbank/data/cet{4,6}.core.json`（id/word/phonetic/pos/meaning/level/freq）与 `.detail.json`（example/exampleZh/collocations/similar→synonyms/tip/forms→wordFamily），并打印体积对比。Run: `node scripts/build-wordbank.mjs` → 期望 core 显著小于原包（目标 core ≤ 60% 原体积）。
- [ ] **Step 3** 实现 `schema.ts` + `wordbank.ts`（dynamic import + IDB 缓存 `wb:<level>:core:v1`），跑 Step 1 测试至 PASS。
- [ ] **Step 4** 写 `tests/migrate.test.mjs`：用真实旧数据样本（含 4/6 混合 key、`reps`/`lapses` 历史值、无 `status` 的旧记录）断言 → 新结构里 `status` 正确回填、无字段丢失、`dailyCounters` 口径与旧 `daily` 一致。Run → FAIL。
- [ ] **Step 5** 实现 `migrate/v1-to-v2.ts`（复用 `src/lib/srs.ts` 的 `sanitizeProgress`），测试至 PASS。
- [ ] **Step 6** 把 `store.ts` 改为兼容层：启动时若发现 `cetthink_store_v1` → 调 `migrateV1` → 写分域键（`clw:<level>` = 词学习、`cls:stats`、`clf:favorites`、`clu:ui`）→ 保留旧键只读 1 个版本；`store.get()` 仍可用（从分域键合成）。Run: `npm test` → 全绿（现有 67 项测试不应回归）。
- [ ] **Step 7** 真机验收：`npm run verify:device` → 背词评分后刷新数据仍在；词库加载体积在 Network 面板显著下降（记录 before/after KB）。提交：`git commit -m "refactor(data): 词库与进度数据层对齐 NativeThink（分级加载 + 分域键 + v1→v2 迁移）"`。

**验收：** 首屏词库请求体积下降 ≥30%；旧数据迁移后 `vocab` 条数与迁移前一致；`npm test` + 真机验收双绿。

---

## 五、阶段 2：UI 基元与外壳（1.5 天）

**目标：** 引入 shadcn/Radix 基元与 NativeThink 的布局/反馈习惯，替换自研 Shell 与 toast。

**Files:**
- Create: `components.json`、`src/lib/utils.ts`（`cn`）、`src/components/ui/**`（按需移植：button/card/dialog/sheet/drawer/tabs/progress/slider/switch/select/input/label/badge/skeleton/tooltip/sonner/scroll-area/command/empty/spinner）
- Modify: `tsconfig.app.json`（`@/*`）、`src/index.css`（主题变量对齐：`--primary: #00B894`、`:root/.dark` 变量组）、`src/components/Shell.tsx` → `src/components/shell/*`、`src/lib/toast.ts` → `sonner`
- Test: `tests/verify-features.mjs`（更新断言：Shell 结构、safe-area、页面文件数）

- [ ] **Step 1** 移植 `components.json` + `utils.ts` + `button/card/dialog/sheet/drawer/tabs/progress/sonner` 9 个基元；`tsconfig` 加别名。Run: `npx tsc -p tsconfig.app.json --noEmit` → 0 错。
- [ ] **Step 2** `index.css` 主题对齐：保留 `--color-primary: #00b894`，补 shadcn 变量（`--background/--foreground/--card/--muted/--border/--ring/--radius`），`dark` 分支对齐 NativeThink。Run: 真机首页目视无回退（截图对比）。
- [ ] **Step 3** Shell 重构：侧栏用 `sidebar`、手机端用 `sheet`/`drawer`（含 `safe-top`/`safe-bottom`），删掉自研抽屉的 backdrop 逻辑；`GlobalWordSearch` 改用 `dialog` + `command`（顺带根治"被囚在顶栏"的类问题）。Run: 真机 `audit-routes.mjs` → 首页/全页遮挡数为 0，触控目标 <44px 降到 0。
- [ ] **Step 4** toast → `sonner`（`toast()` 调用点批量替换，保持 API 语义）。Run: `npm test`（full-suite 对 toast 的断言需同步更新）。
- [ ] **Step 5** 每页包 `react-error-boundary`（对齐 NativeThink `app.tsx` 的 `ErrorBoundary + PageErrorFallback`），并加 `NotFoundPage`。Run: 人为在某个页面抛错 → 显示兜底页而不是白屏（真机 CDP 注入验证）。
- [ ] **Step 6** 提交：`git commit -m "refactor(ui): 引入 shadcn/Radix 基元与 NativeThink 外壳习惯"`。

**验收：** 真机报告里「被遮挡」与「触控目标 <44px」两项归零；页面切换无白屏；错误边界生效。

---

## 六、阶段 3：背词域重构（2 天）

**目标：** 背词从"页面内手写逻辑"变为 NativeThink 同构的分域 hooks + 页面目录化，补齐手势/键盘/撤销/屏蔽/笔记/预测。

**Files:**
- Create: `src/lib/use-word-learning.ts`、`src/lib/vocab-session.ts`（由 `srs.ts` 演进：`order` 冻结 + `scheduleRelearn` + `forecastByDay` + `isDue`）、`src/lib/vocab-swipe.ts`、`src/lib/word-notes.ts`、`src/pages/VocabPage/index.tsx` + `components/{FlashcardMode,ChoiceMode,SpellingMode,ListeningMode,QuickCardMode,DailyLearningMode,BrowseMode}.tsx` + `components/ModeSheet.tsx`、`src/pages/ReviewPage/index.tsx`
- Modify: `src/lib/srs.ts`（保留纯函数，成为 `vocab-session` 的内核）、`src/pages/FavoritesPage.tsx`
- Test: `tests/vocab-session.test.mjs`（新增：顺序冻结、relearn 上限、forecast 分桶）、`tests/device/verify-vocab.mjs`（扩展：手势与键盘）

**Interfaces:**
- `use-word-learning.ts`: `useWordLearning(level)` → `{ progressOf(wordKey), rate(wordKey, quality), dueForReview, newQueue(limit), suspend(wordKey), resume(wordKey), forecast(days), todayLearned, todayReviewed, savedSession, saveSession(order, cursor) }`
- `vocab-session.ts`: `createSessionOrder(words, {due, quota}) → string[]`、`scheduleRelearn(order, cursor, gap=4, max=2) → string[]`、`forecastByDay(progress, days) → {date, count}[]`
- `vocab-swipe.ts`: `decideSwipe({dx, dy, flipped, rated}) → 'flip'|'know'|'unknown'|'prev'|'next'|null`

- [ ] **Step 1** 写 `tests/vocab-session.test.mjs`（顺序冻结：评分不改变 order；relearn 插到 cursor+4、同词最多 2 次；forecast 负桶并入今天）。Run → FAIL。
- [ ] **Step 2** 实现 `vocab-session.ts`（内核复用 `srs.ts`），测试至 PASS。
- [ ] **Step 3** 实现 `use-word-learning.ts`（一域一键 `clw:<level>`，读旧键自动迁移，写盘微批 150ms）。
- [ ] **Step 4** 页面目录化：把 `VocabPage.tsx`（30KB/781 行）拆成 7 个模式组件 + `ModeSheet`，`index.tsx` 只留编排；每个模式组件只接受 `{word, onRate, onNext, onPrev}`。
- [ ] **Step 5** 手势（`vocab-swipe` + 触摸事件，避开 input/textarea）+ 键盘（空格翻面、1-5 评分、←/→ 切词、S 朗读）；对齐 NativeThink `FlashcardMode.tsx:466-510`。
- [ ] **Step 6** 卡背信息层次：`synonyms`/`wordFamily`/`examples`/`register`/`deepExplanation` + 下次复习时间 + 本轮进度条 + 「不再出现/恢复」。
- [ ] **Step 7** 按词笔记（`word-notes.ts`，独立键 + 变更事件 + `useWordNote`）。
- [ ] **Step 8** 真机验收：`verify-vocab.mjs` 扩展项（滑动评分、键盘评分、撤销、屏蔽与恢复、笔记持久化、复习页显示剩余真实数量）。提交：`git commit -m "refactor(vocab): 背词域对齐 NativeThink（分域 hooks + 目录化 + 手势/键盘/笔记/屏蔽）"`。

**验收：** backlog 第 1–15 条全部关闭；`npm test` + 真机验收绿；单次评分写盘次数从 5 次降到 1 次（用 CDP 计数 `localStorage.setItem` 验证）。

---

## 七、阶段 4：朗读与阅读器（2 天）

**目标：** 移植 `use-tts` 架构与阅读器能力：分片朗读、进度上报、暂停/续读、音色设置、切页停止、预取与在途去重。

**Files:**
- Create: `src/lib/use-tts.ts`、`src/lib/tts-settings.ts`、`src/components/TtsControlBar.tsx`、`src/pages/ReadingPage/components/ReaderParagraph.tsx`
- Modify: `src/lib/tts.ts`（保留为底层引擎适配器：sherpa/native/cloud/edge）、`src/lib/sherpa-tts.ts`（加在途去重）、`src/lib/tts-voice-catalog.ts`（默认音色改 `piper:lessac`）、`android/.../SherpaTtsPlugin.java`（有界单线程池 + 上限 8）
- Test: `tests/chunk.test.mjs`（`chunkText` 句边界/长度上限/中英混排）、`tests/device/verify-tts.mjs`（扩展：长文分片请求数、暂停/续读、切页停止）

**Interfaces:**
- `chunkText(text: string, maxLen = 180): string[]`
- `useTts()` → `{ speak(text, opts?: {onChunk?: (i, wordsBefore) => void}), pause(), resume(), stop(), state, engine, progress }`
- `ttsSettings`：音色/语速/音量读写（作用域键）。

- [ ] **Step 1** 写 `tests/chunk.test.mjs`（句边界优先、超长句硬切、`maxLen` 上限、空/纯中文/中英混排）。Run → FAIL。
- [ ] **Step 2** 实现 `chunkText`（≤180 字符、优先 `.?!;。！？；` 与换行），测试至 PASS。
- [ ] **Step 3** `tts.speak` 改为分片串行 + `onChunk` 上报 + 单片 `once(onEnd)` + 看门狗；云端/Google 只收单片（消掉 >200 字符必失败与静默截断）。Run: 真机 `verify-tts.mjs` → 长文产生多次请求、首音时间显著下降（记录 before/after ms）。
- [ ] **Step 4** 暂停/续读/停止 + `TtsControlBar`（进度百分比 + 回到朗读处）；切页/卸载调 `stop()`。
- [ ] **Step 5** 阅读页接 `onChunk`：段落高亮 + 自动滚动让位（对齐 NativeThink `PageReader.tsx:533-547`、`:1641-1691`）。
- [ ] **Step 6** 原生插件改有界线程池（上限 8，超限 `reject("busy")`）+ 默认音色改 lessac + 预取与在途去重。Run: 真机连点朗读 10 次不崩、`dumpsys` 无线程暴涨。
- [ ] **Step 7** 真机验收 + 提交：`git commit -m "refactor(tts): 移植 use-tts 架构（分片/暂停/进度/有界线程池）"`。

**验收：** backlog 第 40–54 条关闭；长文首音 <3s（Kokoro 换 lessac 后）；连点 10 次无闪退。

---

## 八、阶段 5：听力 / 听写 / 模考（2 天）

- **模考**：`ExamPage` 加 `resolveSection(sec)`，把 288 个 `sourceIds` 解析回各题库并渲染真实题目 + 逐题判定（backlog 16）；字段两代 schema 归一（title/count 与 name/minutes）。
- **听力**：接入真音频（`/audio/` 优先、TTS 兜底）+ `speedSteps` 倍速 + 进度条（backlog 17）；逐句播放改 `onEnd` 链式（backlog 19）。
- **听写**：逐词 `wordResults` + 只重做错句 + 跨会话正确率（backlog 23）。
- **完形**：新增 `ClozePage` 渲染占位符与逐空判定，`ExamPage` 图标路由改指它（backlog 24）。
- **解析**：补 `explain/locateSentence`，`localAnalyze` 按题干实义词定位、取不到返回 `undefined`（backlog 18）。
- **落盘**：阅读/听写/模考位置与答案走 `safe-storage`（backlog 21/22）。
- **验收**：真机逐页走查 + `verify:device` 扩展项；模考首套卷子可完整作答并估分。

## 九、阶段 6：统计 / 成就 / 进度 / 写作（1.5 天）

- `use-learning-stats.ts`：单一 storage 真相 + `displayStats` + 30s/visibilitychange 跨天刷新；删 `App.tsx` 的硬编码写入（backlog 25/30）。
- `use-achievements.ts`：`{id, unlockedAt}[]` + 作用域键 + 在学习动作里批量解锁（backlog 33）。
- `ProgressPage`：recharts 7 日柱 + 模块饼 + 30 天趋势 + 月份切换（backlog 39）。
- `WritingPage`：一行修四/六级筛选恒真；接入 6 个模板与 hint；写作历史 ≤50 + 计时 + 词数进度条（backlog 34）。
- 备份真实性：导出真读 IDB、导入还原 + 版本校验 + 明细 toast（backlog 32）。
- **验收**：进度页数字与背词页一致；成就解锁带时间；写作筛选生效。

## 十、阶段 7：收尾对齐与全量验收（1 天）

- 全库扫裸键（位置/主题/AI 配置/成就）→ 全走 `safe-storage`（backlog 36）；收藏两套键名统一（38）；六页共用 `data-cache`（37）。
- 触控目标全部 ≥44px（工具条 chip、分类 chip）；横向溢出清零。
- 跟读/口语（可选，backlog 26）：`MediaRecorder` + 识别对比，对齐 `ShadowingPage`。
- 全量真机验收：14 路由 × （布局/触控/无遮挡/无异常）+ 关键路径脚本（背词/复习/朗读/清空/模考）。
- 发布：`android/version.properties` bump → 打 APK → 更新 GitHub Release → 同步 `NativeThink/release`。
- 目标收束：逐条核对 `AUDIT-backlog.md` 状态，未做的写清原因（对齐目标里的"或明确记录差异原因"）。

---

## 十一、风险与回滚

| 风险 | 缓解 |
|---|---|
| 迁移丢数据 | 迁移器只读旧键、双写过渡、失败保留旧数据 + 提示；阶段 1 单测覆盖真实样本；真机验收必查"迁移后条数一致" |
| 共享 node_modules 被污染 | 禁止 `npm install`；新依赖版本必须与 NativeThink 完全一致；只在 package.json 声明 |
| 重构期 App 不可用 | 每阶段独立可发布 + git tag；阶段 3 起页面目录化采用"新文件 + 旧文件并存 → 切换路由 → 删旧文件"的绞杀者模式 |
| APK 227MB / 构建慢 | 保持离线模型走 LFS；CI 不构建 APK，只在阶段末构建并同步归档 |
| 交互回归（手势/键盘误触） | `vocab-swipe` 决策表纯函数单测 + input/textarea 白名单；真机验收含"助记框内滑动不评分" |
| 范围膨胀（NativeThink 有本地 LLM/云同步） | 明确非目标：`local-llm`/`local-mt`/`use-cloud-sync` 不在本计划内，除非用户单独要求 |

## 十二、与 `AUDIT-backlog.md` 的映射

| 阶段 | 关闭的 backlog 条目 |
|---|---|
| 1 | 2、12、31、37（数据层与写盘） |
| 2 | 第五节的布局/触控/遮挡项、59 |
| 3 | 1、3–11、13–15 |
| 4 | 40–54 |
| 5 | 16–24、27 |
| 6 | 25、28–30、32–35、39 |
| 7 | 26、36、38、56–58、60 |

## 十三、总工期与检查点

约 **12 个工作日**（8 个阶段）。每阶段结束：`npm test` 全绿 → `npm run verify:device` 通过 → 提交 + tag → 在 `AUDIT-backlog.md` 勾掉对应条目。若某阶段真机验收不通过，不得进入下一阶段（先修再走）。
