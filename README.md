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

### APK 为什么不放进 NativeThink/public

`NativeThink/public/CetThink-mobile.apk` 这个「主站下载位」**故意不使用**（早期本 README 的说法已废弃）：

- APK 放进 `public/` 会让主 APK、桌面版、网页三份产物各背一份体积，主 APK 里还会嵌套一个 APK；
- NativeThink 的四六级页（`src/pages/CetExamPage/CetExamPage.tsx`）把 `APK_URL` 留空即隐藏下载按钮
  —— 原注释：「宁可不显示，也不给一个点了 404 的按钮」。发布到对象存储或 GitHub Release 后，
  把地址填进该页的 `APK_URL` 即可开按钮；
- 本仓库的 APK 归档在 `release/`，已被 `.gitignore` 的 `release/*.apk` 排除。

### 离线模型（约 250MB，不入库）

`android/app/src/main/assets/` 下的离线朗读模型与大体积二进制不进 git：

| 路径 | 体量 | 来源 |
|------|------|------|
| `assets/tts/kokoro-int8-multi-lang-v1_1/` | 166MB | sherpa-onnx 模型 [csukuangfj/kokoro-int8-multi-lang-v1_1](https://huggingface.co/csukuangfj/kokoro-int8-multi-lang-v1_1/tree/main) |
| `assets/piper/vits-piper-en_US-lessac-medium/` | 77MB | sherpa-onnx 模型 `vits-piper-en_US-lessac-medium` |
| `libs/sherpa-onnx-1.12.21.aar` | 27MB | sherpa-onnx 1.12.21 的 Android AAR |

原因：`model.int8.onnx` 单文件 109MB，已超 GitHub 100MB 单文件硬上限，本就不能直接入库。
新克隆的仓库要出 APK，需先把这三份放回原位（缺失时构建会失败，朗读会退到系统 TTS）。

## 设计约定

- 主色 `#00B894`，浅色默认，深色 class=`dark`
- 手机优先：底部 Tab 只放 4 个主入口（首页/背词/复习/听力）+「更多」上滑面板承载其余 10 项；
  `lg` 及以上改显示左侧栏（全部 14 项）；顶栏/底栏统一走 `safe-area-inset-*`
- 数据仅 localStorage（`cetthink_store_v1`）+ IndexedDB 深恢复 + 多副本备份，离线可用
- 朗读级联：离线 sherpa-onnx → 系统 Web Speech / 原生 TTS → 云端兜底
- AI 走 NativeThink 代理（`nativethink.pages.dev/api/ai/chat`），可在设置里改代理与自填 Key

## 版本控制

本目录是独立 git 仓库（分支 `main`）。下列内容**不入库**，原因见括号：

- `node_modules`（指向 `B:\NativeThink\node_modules` 的 junction）
- `dist` / `tmp` / `android/**/build` / `android/.gradle` / `android/local.properties`
- `android/app/src/main/assets/public`、`android/app/src/main/assets/capacitor.config.json`（`cap sync` 生成，可重建）
- `android/app/src/main/assets/tts`、`android/app/src/main/assets/piper`、`android/app/libs/sherpa-onnx-*.aar`（约 250MB，见上）
- `release/*.apk`、`scripts/.apikey`
