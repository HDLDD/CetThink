# CetThink 对标 NativeThink 改造清单（审计汇总 · 执行用）

来源：4 份只读代码审计（背词/复习、阅读听力、TTS、写作进度数据层）+ 真机多维实测（见 `AUDIT-device.md`）。
设备：Redmi 25053RT47C · Android 16 (SDK 36) · 通过 adb 无线调试 + WebView CDP 验证。

判定口径：**P0** 正确性/数据丢失/真机不可用；**P1** 与 NativeThink 的能力缺口（体验/性能）；**P2** 打磨。

---

## 一、背词 / 复习（问题最集中）

### P0
1. ~~SM-2 `reps` 一字段双关~~ **已修**：答错时 reps 归零，导致该词 ① 被复习队列（要求 `reps>0`）永久过滤 ② 又被当新词吃掉每日名额。现为独立 `status` 状态机 → `src/lib/srs.ts`（唯一实现）+ `store.ts` + `VocabPage`/`ReviewPage`。真机回归验证通过。
2. **一次评分 5 次全量序列化**：`VocabPage` 一条评分路径触发 5 次 `store.update` → 10 次 `JSON.stringify` + 5 次 IDB put；学 2000 词时单份约 240KB。
   → 加 `store.patchVocab(key,p)` / `patchSession()` 定点写；`save()` 做 100–200ms 微批；`backup`/`snapshot`/IDB 降频。
   参考 NativeThink `src/lib/use-word-learning.ts:276-279`（一次 setState 一次落盘）、`:98-134`（800ms 结果缓存）。
3. **每日队列不驱动导航**：`nextIdx = idx+1` 与模式无关；名额只在进模式时判一次。
   → 进模式时冻结会话 `order`（存**词 key** 而非下标）+ 到期优先 + 新词补足名额。参考 `DailyLearningMode.tsx:289-303`、`FlashcardMode.tsx:402-413`。

### P1
4. **56% 的词四/六级重复学习**：进度按 `${level}-${id}` 存（cet6 7408 词中 4137 词同时出现在 cet4）。→ 迁移为按小写词形为 key，level 降级为归属标签。参考 `use-word-learning.ts:284`、`:222-248`。
5. **选择题/拼写模式计数分类错误** → **已部分修**（`dailyCounters` 单一来源，isNew 判定）。仍需把 `recordStudy` 的冗余口径收敛。
6. ~~两套 SM-2 分歧~~ **已修**（共用 `srs.ts`）。
7. ~~跨天名额不重置~~ **已修**（`dailyCounters` 按 `firstAt/lastAt` 派生，跨天自动归零）。
8. **断点续学存下标而非队列**：换排序（freq/alpha/random）后恢复即错位。→ `vocabSession.order: string[]` + `cursor`。参考 `use-word-learning.ts:137-160`、`FlashcardMode.tsx:416-444`。
9. **零手势/零快捷键/零撤销**（回看会重复计数）→ **已部分修**（`rated` 幂等守卫）。仍需滑动决策表 + 键盘（空格/1-5/←→）。参考 `vocab-swipe.ts:20-31`、`FlashcardMode.tsx:466-510`。
10. **无「下次复习时间」/复习负担预测/屏蔽出口**。参考 `FlashcardMode.tsx:1004-1009`、`vocab-session.ts:61-77`（`forecastByDay`）、`use-word-learning.ts:317-336`（suspended）。
    → `srs.forecast()` 已就绪，待接 UI。
11. **无按词助记笔记**。参考 `word-notes.ts:34-63`（独立键 + 变更事件，别塞进大 store）。
12. **词库加载**：1.6MB/2.8MB 全量 JSON、还预加载对面词书、三个页面各写一份 fetch。
    → 抽 `src/lib/vocab-data.ts`（IDB 缓存 + in-flight 去重），删 `VocabPage` 的对面书预加载，拆 core/detail。参考 `wordbank.ts:113-143`。

### P2
13. **数据有、UI 零引用**：`w.similar` / `w.forms` / `freq` 全项目未使用 → 卡背加近义与词族。参考 `FlashcardMode.tsx:986-999`。
14. **进度条语义错**（把当前词 mastery 当会话进度）；~~browse 可误评分~~ **已修**。→ 进度条改 `已评/队列长度`。
15. **健壮性**：~~NaN 无兜底~~ **已修**（`sanitizeProgress`）；~~due 判定三处重复~~ **已修**（`isDue` 唯一入口）；`example` 仍用 `dangerouslySetInnerHTML`（同文件已有 `stripHtml`）。

---

## 二、听力 / 阅读 / 听写 / 模考

### P0
16. **模考 26/32 套无题可做**：157 段中仅 6 段带真 `questions`，其余靠 `sourceIds`（288 个引用 100% 可解析）却从不解析，估分按完成度造假。→ `ExamPage.tsx:307-314` 加 `resolveSection()`。
17. **听力 106 条 `audioPack.src` 全空、0 个真题音频**；`durationSec`/`speedSteps` 零引用（无倍速/无进度条）；三个"慢速/逐句"按钮实际同速且互相打断（`ListeningPage.tsx:187-193`、`DictationPage.tsx:184-198`）。
    → `tts.speak` 支持 per-call `rate`；逐句改 `onEnd` 链式。参考 NativeThink `use-tts.ts:46`、`:101-171`。
18. **227/240 题无解析**；`ai.ts:134-161` 的"原文定位"是 passage 前 180 字截断的假定位。
19. ~~逐句播放 setTimeout 预排~~ 同上第 17 条的落地方式。

### P1
20. **阅读无译文/无逐段/无生词高亮/无点词查询**；朗读只读 `passage.slice(0,500)`。参考 `PageReader.tsx:1363`（en/bilingual/zh 三模式）、`ReaderParagraph.tsx:179-181`、`PageReader.tsx:58-109`。
21. **断点只在手动点"返回"时写**，切底部 tab 即丢；交卷只遍历已答题 → 未答题不入错题本。
22. **进度键用裸 localStorage**（`cetthink_read_pos`/`listen_pos`/`dict_pack`/`exam_progress`）→ 不进备份、不按用户隔离。真机 AUDIT 同结论。
23. **听写 70 包仅 93 句**（1.3 句/包）；整句精确匹配；恢复时清零、完成时抹记录 → 无逐词定位/只重做错句。参考 `SpellingPage.tsx:553-594`、`:650-669`。
24. **完形 51 篇/112 空无任何页面渲染**；`ExamPage` 还把 cloze 图标映射到 `/reading`（误导跳转）。
25. **学习记录页 four 类恒 0**：`App.tsx:42-51` 硬编码 0，`use-memory.recordModule` 零调用。
26. **跟读/口语零实现**（`MediaRecorder`/`getUserMedia`/`SpeechRecognition` 全 0 命中）。参考 `ShadowingPage.tsx:485-542`。
27. **阅读/听力 fetch 无 catch** → 失败纯空白/永久"加载中"（同项目 Grammar/Skills 反而有）。

---

## 三、写作 / 进度 / 设置 / 数据层

### P0
28. **「清空全部数据」清不干净**：`persist.ts:134-135` 只写 main/backup，旧 snapshot 评分更高（`:95-103`）→ 刷新后数据复活；作用域键（`pm_*`/`last_visit`/`learning_stats`）未清。参考 `ProgressPage.tsx:258-278`。
29. **深恢复按体量取胜**：`store.ts:213-214` 忽略已有 `updatedAt`；写盘失败静默（`persist.ts:123-129`）。

### P1
30. **统计失真**：学习天数恒 0（`App.tsx:52`）、目标分=词数、词进度无分母；`use-memory.ts:100-124` 让 saved 覆盖派生值。
31. **每次操作 2 次 stringify + 最多 4 份 LS 副本 + 1 次 IDB**（与第 2 条同源）。
32. **备份里 `idb` 字段是假的**（读的是 LS 主键冒充）、导入不还原、无版本校验（`backup.ts:39-45`、`:71-93`）。
33. **成就系统**：无解锁时间、听力口径错（用 `day.reviews+examHistory` 冒充）、仅首页触发、裸键（`achievements.ts:22-50`、`DashboardPage.tsx:85-102`）。
34. **写作**：四/六级筛选**恒真**（`WritingPage.tsx:64`，一行可修）；6 个 `writingTemplates` 与 hint 数据闲置；无历史/计时/评分兜底。
35. **记忆层零调用**（`recordModule`/`useFavoritesMemory`/`useWordMemory` 全 0 调用点）。

### P2
36. 裸键（位置/主题/AI 配置/成就）→ 改走 `safeStorage` 即自动进备份。
37. **6 个页面各自 fetch 550KB `practice.json`**（首页只需要 771 字符）→ 抽 `data-cache.ts`。
38. 收藏两套键名并存（`favorite_meta` vs `favorites_meta`）。
39. 进度页无趋势图/月份切换；首页 Stat 不可点。

---

## 四、TTS 朗读层

### P0
40. **云端对 >200 字符必失败**：91/91 篇 passage 都 >200 字符，`tts.ts:141` 又静默截断到 200 字符。→ `chunkText(text,180)` 切片串行播。参考 `use-tts.ts:288-303`。
41. ~~全链路 0 超时~~ **已修**：原生 2.5s 超时 + `speak()` 看门狗。
42. ~~安卓 WebView speechSynthesis 假成功卡死~~ **已修**：安卓禁用该档 + `onEnd` once。真机验证：改走离线 sherpa、按钮正常回落。
43. **原生插件每请求一条 OS 线程、无上限**（`SherpaTtsPlugin.java:401`）→ 有界单线程池 + 上限 8。参考 NativeThink `java:106-140`（真机复现过 pthread_create OOM 闪退）。
44. ~~onEnd 无身份校验/会多次回调~~ **已修**（`once` + 看门狗）。
40b. ~~离线引擎被永久禁用~~ **已修**：健康检查改为连续 2 次才停用 + 加载成功自愈（旧数据一次性解除）。

### P1
45. **无切片 → 首音=整段合成时长**（Kokoro RTF≈1.0，500 字符约 36s）。同 40。
46. **默认音色 Kokoro（RTF 1.008）比 lessac（0.076）慢 13 倍** → 改默认 `piper:lessac` 并调整排序（`tts-voice-catalog.ts:36-40`）。
47. **零预取**（`sherpaPrewarm` 死代码）。
48. **sherpa 无在途去重**（并发同文本各提交一次原生）。参考 `sherpa-tts.ts:195-230`。
49. **无暂停/续读/悬浮控制条**。参考 `use-tts.ts:897-930`、`PageReader.tsx:1641-1691`。
50. **切页不停止朗读**（无卸载清理/visibilitychange）。
51. **朗读位置不可见**（无 `onChunk`/段落高亮/进度条/自动滚动）。参考 `use-tts.ts:445-449`、`PageReader.tsx:533-547`。

### P2
52. Cache API 缓存层是死代码（`tts.ts:168` 判断反了，三档 URL 全是 http → 命中率恒 0）。
53. 原生 onEnd 用固定 360ms/词且忽略 rate。
54. 无音量设置；换音色不试听。

---

## 五、布局 / 真机实测（`AUDIT-device.md`）

- ~~☰ 抽屉缺 `safe-top`；查词浮层被 `backdrop-filter` 囚在顶栏（遮罩只盖顶栏一条、面板戳出）~~ **已修**（portal 到 body + 面板按顶栏下沿定位）。
- ~~旧包顶部与状态栏重叠~~ **已修**（源码已带 `viewport-fit=cover` + `safe-top`，装机验证不重叠）。
- **背词工具条按钮 42×26 < 44px**；`从头` 溢出 4px（left=355 right=397）；grammar/skills 分类 chip 横向越界 16/1 处。
- **首页 5 个按钮被 `bg-black/40` 遮罩盖住** —— 审计时抽屉未关暴露的真实缺陷：**在抽屉里点"当前页"的导航项不会关闭抽屉**（`Shell.tsx` 只在 pathname 变化时关闭）。
- **未捕获异常** `TextToSpeech.then() is not implemented on android`（原生插件路径未处理 rejection）。
- 触控目标 <44px：首页 24 处 / 语法 22 / 设置 17。

---

## 执行顺序建议（每轮做一件并可真机验证）

1. 提交当前修复（SRS 核心 + TTS 链路 + 布局）作为回滚点。
2. 数据安全：清空数据（28）+ 深恢复判定（29）。
3. TTS 切片（40/45）+ 默认音色（46）—— 一条改动同时解掉"阅读长文 100% 截断"和"首音 36 秒"。
4. 背词性能（2）+ 词库加载（12）。
5. 模考 sourceIds（16）—— 单页改动让 26/32 套卷子可做。
6. 听力倍速与真音频（17/19）。
7. 背词交互对齐（8/9/10/11/13）。
8. 统计口径（30/33/35）+ 备份真实性（32）。
9. 阅读能力对齐（20/21/22）。
10. 写作（34）+ 布局与触控目标（第五节的剩余项）。
