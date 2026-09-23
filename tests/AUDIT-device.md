# CetThink 真机多维实测报告（自动生成）

- 时间：2026-09-23T16:54:23.518Z
- 设备：Redmi 25053RT47C · Android 16 (SDK 36) · 1280x2772 @520dpi
- 通路：adb 无线调试 + WebView CDP（Runtime/Network/Page 域）
- 覆盖：14 条路由；每页滚动归零后采集

## 逐页指标

| 路由 | 文本量 | 按钮 | 链接 | 横向溢出 | 越界元素 | 触控<44px | 被遮挡 | 主区可滚 | 控制台错 | 异常 | 网络失败 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 391 | 4 | 11 | 0 | 0 | 24 | 5 | 否 | 0 | 0 | 0 |
| `/vocab` | 134 | 12 | 0 | 0 | 1 | 5 | 0 | 否 | 0 | 0 | 0 |
| `/review` | 49 | 3 | 0 | 0 | 0 | 3 | 0 | 否 | 0 | 0 | 0 |
| `/listening` | 2950 | 110 | 0 | 0 | 0 | 6 | 1 | 否 | 0 | 0 | 0 |
| `/reading` | 3377 | 91 | 0 | 0 | 0 | 2 | 1 | 否 | 0 | 0 | 0 |
| `/dictation` | 1174 | 70 | 0 | 0 | 0 | 2 | 1 | 否 | 0 | 0 | 0 |
| `/grammar` | 8263 | 150 | 0 | 0 | 16 | 22 | 1 | 否 | 0 | 0 | 0 |
| `/exam` | 1286 | 32 | 0 | 0 | 0 | 2 | 1 | 否 | 0 | 0 | 0 |
| `/errors` | 257 | 6 | 1 | 0 | 0 | 8 | 0 | 否 | 0 | 0 | 0 |
| `/writing` | 93 | 5 | 0 | 0 | 0 | 6 | 0 | 否 | 0 | 0 | 0 |
| `/skills` | 973 | 83 | 0 | 0 | 1 | 5 | 1 | 否 | 0 | 0 | 0 |
| `/favorites` | 67 | 4 | 1 | 0 | 0 | 7 | 0 | 否 | 0 | 0 | 0 |
| `/progress` | 268 | 3 | 0 | 0 | 0 | 5 | 0 | 否 | 0 | 0 | 0 |
| `/settings` | 850 | 29 | 0 | 0 | 0 | 17 | 3 | 否 | 0 | 0 | 0 |

## 越界元素（横向被裁切）
- `/vocab`
  - BUTTON `shrink-0 rounded-full bg-muted px-2 py-1 text-[1` left=355 right=397
- `/grammar`
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=355 right=450
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=458 right=552
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=560 right=672
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=680 right=757
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=765 right=824
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=832 right=931
- `/skills`
  - BUTTON `shrink-0 rounded-full px-3 py-1.5 text-xs font-b` left=307 right=401

## 触控目标 < 44px
- `/`: 打开菜单(40x40) · 查词(40x40) · 备份(75x40) · (40x40) · 朗读(36x36) …共 24 个
- `/vocab`: 打开菜单(40x40) · 查词(40x40) · 弱词(42x26) · 随机(42x26) · 从头(42x26)
- `/review`: 打开菜单(40x40) · 查词(40x40) · 结束本轮(86x34)
- `/listening`: 打开菜单(40x40) · 查词(40x40) · 全部(59x38) · Section A(86x38) · Section B(88x38) …共 6 个
- `/reading`: 打开菜单(40x40) · 查词(40x40)
- `/dictation`: 打开菜单(40x40) · 查词(40x40)
- `/grammar`: 打开菜单(40x40) · 查词(40x40) · 全部(59x38) · 时态(59x38) · 被动语态(94x38) …共 22 个
- `/exam`: 打开菜单(40x40) · 查词(40x40)
- `/errors`: 打开菜单(40x40) · 查词(40x40) · 全部(59x38) · 阅读 1(73x38) · 再练(24x24) …共 8 个
- `/writing`: 打开菜单(40x40) · 查词(40x40) · 我的练笔(102x38) · 作文库 · 134(128x38) · 保存并计时(60x18) …共 6 个
- `/skills`: 打开菜单(40x40) · 查词(40x40) · 词根字典 · 379(138x38) · 近义辨析 · 652(138x38) · 搭配 · 23(94x38)
- `/favorites`: 打开菜单(40x40) · 查词(40x40) · 全部(59x38) · 四级(59x38) · 六级(59x38) …共 7 个
- `/progress`: 打开菜单(40x40) · 查词(40x40) · 打卡日历(115x42) · 成就(115x42) · 数据备份(115x42)
- `/settings`: 打开菜单(40x40) · 查词(40x40) · 10(28x26) · 20(28x26) · 30(28x26) …共 17 个

## 交互元素被遮挡
- `/`
  - 按钮「备份」中心点命中 BUTTON.absolute inset-0 bg-black/40
  - 按钮「Continue继续上次 · 背」中心点命中 NAV.flex flex-1 flex-col gap-1 overflow-y-au
  - 按钮「」中心点命中 BUTTON.absolute inset-0 bg-black/40
  - 按钮「朗读」中心点命中 BUTTON.absolute inset-0 bg-black/40
  - 按钮「换一句」中心点命中 BUTTON.absolute inset-0 bg-black/40
- `/listening`
  - 按钮「短文 · 学习方法Section」中心点命中 svg.[object SVGAnimatedString]
- `/reading`
  - 按钮「Passage · The Co」中心点命中 A.relative flex flex-1 flex-col items-cent
- `/dictation`
  - 按钮「教育 · 评价CET-6 · 2」中心点命中 A.relative flex flex-1 flex-col items-cent
- `/grammar`
  - 按钮「被动语态基本结构CET-4被动语」中心点命中 NAV.safe-bottom fixed inset-x-0 bottom-0 z-4
- `/exam`
  - 按钮「冲刺模考 · 第 7 套CET-」中心点命中 path.[object SVGAnimatedString]
- `/skills`
  - 按钮「bi-二、双」中心点命中 SPAN.
- `/settings`
  - 按钮「词频优先」中心点命中 A.relative flex flex-1 flex-col items-cent
  - 按钮「字母顺序」中心点命中 A.relative flex flex-1 flex-col items-cent
  - 按钮「随机打乱」中心点命中 A.relative flex flex-1 flex-col items-cent

## 控制台与网络异常
- [异常] `(init)` fi: "TextToSpeech.then()" is not implemented on android

## 截图
`tmp/audit-home.jpg` · `tmp/audit-vocab.jpg` · `tmp/audit-review.jpg` · `tmp/audit-listening.jpg` · `tmp/audit-errors.jpg` · `tmp/audit-writing.jpg` · `tmp/audit-skills.jpg`
