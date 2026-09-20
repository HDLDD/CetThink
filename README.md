# CetThink · 四六级备考

与 NativeThink 同款「清澈学习感」的独立手机应用（React + Capacitor）。

## 功能

- 首页目标 / 连续打卡
- 背词（四六级全量词库，点卡翻面 + 朗读 + 收藏；闪卡/选择/拼写/听音/快刷/每日六模式）
- SM-2 智能复习
- 听力精听（TTS 播放原文 + 选择题 + 错题收集）
- 阅读理解
- 听写训练 / 语法专项 / 词根拓展
- 模拟考试（板块流 + 估分）
- 错题本
- 写作草稿（本地保存）
- 设置：CET-4/6、每日目标、浅/深色、朗读语速

## 开发

```powershell
# 依赖与 NativeThink 共用：node_modules 是指向 B:\NativeThink\node_modules 的 junction
npm run dev          # http://localhost:5174
npm run typecheck
npm run build
npm test             # 逻辑压力测试 + 页面静态校验（full-suite / part2 / verify-features）
```

`npm test` 有失败项时返回非 0（三个脚本都会），可直接串联进 CI。

### 数据导入（默认不覆盖）

CET 源数据在 NativeThink 侧，脚本按优先级探测：
`NativeThink/release/cet-legacy/js` → `NativeThink/public/cet/js`（后者已随独立拆分移除，仅作兼容）。

```powershell
npm run data:import                               # 只探测源 + 打印覆盖预览，不写盘
node scripts/import-cet-data.mjs --out=tmp/data   # 输出到临时目录做比对
node scripts/import-cet-data.mjs --force          # 明确要求覆盖 public/data
```

> ⚠️ `public/data/*.json` 已被 `expand-practice-bank*.mjs` / `build-grammar-bank.mjs` /
> `fix-vocab-duplicates.mjs` 大幅扩充并去重。直接覆盖会**回退题库**——实测导入原始源会：
> 听力 106→24、阅读 91→13、完形 51→7、听写 70→13、模考 32→8、同义词 652→15、词根 433→24、
> 作文库 74→0，并重新引入已清理的 94 条重复四级词条。
> 因此导入脚本默认拒绝覆盖，必须显式 `--force`（预览表里回退项标 ⚠️）。

## Android

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

- 产物：`android/app/build/outputs/apk/debug/app-debug.apk`
- 本地归档：`release/CetThink-mobile-debug.apk`（约 227.8MB，含离线朗读模型）
- 包名：`com.cetthink.app` · 版本见 `android/version.properties`
- `npm run android:sync` / `npm run android:apk` 是上面两步的封装

### APK 放在哪

- 正式下载位：**GitHub Release** —— https://github.com/HDLDD/CetThink/releases
- 本地归档：`release/CetThink-mobile-debug.apk`（被 `.gitignore` 的 `release/*.apk` 排除）
- `NativeThink/public/CetThink-mobile.apk` 这个「主站下载位」**故意不使用**：APK 放进 `public/`
  会让主 APK、桌面版、网页三份产物各背一份体积，主 APK 里还会嵌套一个 APK；
- NativeThink 的四六级页（`src/pages/CetExamPage/CetExamPage.tsx`）的 `APK_URL`
  已指向上面 Release 的 tag；留空则隐藏按钮 —— 原注释：「宁可不显示，也不给一个点了 404 的按钮」。
  发新版时同步改那个 tag。

### 离线模型（约 270MB，走 Git LFS 入库）

`android/app/src/main/assets/` 下的离线朗读模型与大体积二进制**已通过 Git LFS 入库**，克隆即得：

| 路径 | 体量 | 来源（实测核对） |
|------|------|------|
| `assets/tts/kokoro-int8-multi-lang-v1_1/` | 166MB | HF `csukuangfj/kokoro-int8-multi-lang-v1_1` |
| `assets/piper/vits-piper-en_US-lessac-medium/` | 77MB | HF `csukuangfj/vits-piper-en_US-lessac-medium`，自带 `espeak-ng-data`（Kokoro 复用这一份，不重复打包） |
| `libs/sherpa-onnx-1.12.21.aar` | 27MB | HF `csukuangfj/sherpa-onnx-libs` 的 **static-link** 变体（`sherpa-onnx-static-link-onnxruntime-1.12.21.aar`，静态链接避免符号冲突，别拿普通 AAR 顶） |

三份源都走 `hf-mirror.com` 镜像 —— GitHub / HuggingFace 直连在国内不可达。

> ⚠️ **版本陷阱（本项目真踩过）**：NativeThink 的 `scripts/fetch-android-tts.cjs` 拉的是
> `kokoro-int8-multi-lang-v1_0`（`voices.bin` 26.9MB），且写进 NativeThink 自己的 assets；
> 而本仓库 `SherpaTtsPlugin.java` 把路径**硬编码**为 `tts/kokoro-int8-multi-lang-v1_1`
> （`voices.bin` 51.3MB）。两者不是同一份模型 —— 拿 v1_0 顶替会让内置引擎加载失败，
> 朗读**静默**退回系统 TTS（不报错，只表现为音色变了 / 又要联网）。要重建必须用 v1_1。

**克隆前先装 Git LFS**（`git lfs install`），否则检出的是指针文件、打出的 APK 缺模型。
之所以非得走 LFS：`model.int8.onnx` 单文件 109MB，超 GitHub 100MB 单文件硬上限，普通提交必被拒。

## 设计约定

- 主色 `#00B894`，浅色默认，深色 class=`dark`
- 手机优先：底部 Tab 只放 4 个主入口（首页/背词/复习/听力）+「更多」上滑面板承载其余 10 项；
  `lg` 及以上改显示左侧栏（全部 14 项）；顶栏/底栏统一走 `safe-area-inset-*`
- 数据仅 localStorage（`cetthink_store_v1`）+ IndexedDB 深恢复 + 多副本备份，离线可用
- 朗读级联：离线 sherpa-onnx → 系统 Web Speech / 原生 TTS → 云端兜底
- AI 走 NativeThink 代理（`nativethink.pages.dev/api/ai/chat`），可在设置里改代理与自填 Key

## 版本控制

独立 git 仓库：**https://github.com/HDLDD/CetThink**（public，分支 `main`）。

- 离线模型与 AAR 走 **Git LFS**（368 个对象 / 约 284MB）。免费额度为 LFS 存储 1GiB / 月流量 1GiB：
  本仓库占约 270MB 存储，每次全新克隆消耗约 270MB 流量（月内约 3~4 次克隆）。
- 下列内容**不入库**，原因见括号：
  - `node_modules`（指向 `B:\NativeThink\node_modules` 的 junction）
  - `dist` / `tmp` / `android/**/build` / `android/.gradle` / `android/local.properties`
  - `android/app/src/main/assets/public`、`android/app/src/main/assets/capacitor.config.json`（`cap sync` 生成，可重建）
  - `release/*.apk`（APK 走 Release 分发）、`scripts/.apikey`
  - `android/keystore.properties`、`android/*.keystore`（签名凭据含明文口令，绝不入库）
- 本机推送依赖仓库级 `core.sshCommand`：这台机器 `HOME=A:\SPB_Data` 与 `USERPROFILE=C:\Users\31037`
  不一致，git 拉起的 ssh 会读错 known_hosts 并报 `Host key verification failed`。
  该配置在 `.git/config` 里，**不要删**。
