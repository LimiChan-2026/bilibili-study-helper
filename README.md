# B站学习进度助手 (Bilibili Study Helper)

B站（bilibili）学习辅助油猴脚本——去广告、自动记录学习时长、锁定 2-4 倍速、统计看板与集数时长计算，一站搞定。

![版本](https://img.shields.io/badge/version-6.2-blue)
![协议](https://img.shields.io/badge/license-MIT-green)
![兼容](https://img.shields.io/badge/Tampermonkey-支持-brightgreen)

## 功能特性

| 功能 | 说明 |
|------|------|
| 🎨 **强力去广告** | 隐藏播放列表上方的活动卡片、广告位，并限制列表高度 |
| 📊 **学习统计看板** | 访问 `bilibili.com/?study_dashboard` 查看「学习中心」：今日专注、累计学习、近 30 天趋势柱状图、CSV 数据导出 |
| 📺 **极简悬浮球** | 视频页右上角显示可拖拽、可最小化的助手面板 |
| ⏱️ **自动记录时长** | 静默后台每秒检测播放状态，自动累加当日学习秒数（基于 `GM_setValue` 本地存储） |
| ⚙️ **2-4 倍速锁定** | 自定义倍速并强力锁定，修复 B站原生倍速菜单点击失效 Bug；点击原生倍速选项即自动解除锁定 |
| 🧮 **计算时长** | 输入起始/目标集数，按多P列表顺序统计区间内各集时长，兼容“第2章-01-…”等非纯数字标题 |
| 🚀 **1.75x 快捷项** | 自动在倍速菜单注入 1.75x 选项 |

## 安装方法

### 安装前：允许用户脚本（Chrome / Edge）

使用 Chrome、Edge 等 Chromium 浏览器以及 Tampermonkey 5.3+ 时，请先授予用户脚本执行权限：

1. 右键点击浏览器工具栏中的 **Tampermonkey** 图标
2. 选择 **管理扩展程序**
3. 打开 **允许用户脚本（Allow User Scripts）**

如果扩展设置中没有该开关，请打开 `chrome://extensions` 或 `edge://extensions`，启用页面右上角的 **开发者模式**。否则即使脚本显示安装成功，也可能完全不执行。详见 [Tampermonkey 官方说明](https://www.tampermonkey.net/faq.php?q=Q209)。

### 方式一：一键安装（推荐）

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击以下链接，Tampermonkey 会自动弹出安装确认：

[🔗 一键安装 v6.2](https://raw.githubusercontent.com/LimiChan-2026/bilibili-study-helper/main/bilibili-study-helper.user.js)

### 方式二：手动安装

1. 安装 Tampermonkey 扩展
2. 点击 Tampermonkey 图标 → **管理面板 → + 新建脚本**
3. 删除编辑器中的默认内容
4. 复制 [`bilibili-study-helper.user.js`](./bilibili-study-helper.user.js) 全部内容粘贴进去
5. 按 `Ctrl+S` 保存

## 使用说明

### 视频页悬浮球
- 打开任意 B站**视频页**（`/video/`），右上角出现「📚 学习助手」面板
- 输入**起始集数**与**目标集数**，点击「计算时长」统计区间总时长
- 「加速」框输入 2~4 之间的倍速，点击「应用」锁定播放速度
- 📊 按钮打开学习统计看板；－ 按钮最小化面板

### 学习统计看板
- 访问 `https://www.bilibili.com/?study_dashboard`
- 查看今日专注、累计学习时长、近 30 天趋势图
- 点击「📥 导出数据」可将学习记录导出为 CSV

### 自动记录
- 脚本在后台静默运行，只要视频处于播放状态即每秒累加学习时长
- 数据保存在浏览器本地（Tampermonkey 的 `GM_setValue`），不上传任何服务器

## 支持的网站

- `https://www.bilibili.com/*`

## 技术说明

- 依赖 Tampermonkey API：`GM_addStyle`、`GM_setValue`、`GM_getValue`、`GM_openInTab`
- 所有状态均存储在本地，无远程请求、无数据收集
- 自动更新通过 GitHub Raw / jsDelivr 实现

## 更新日志

### v6.2 (2026-08-16)
- 修复标题不以数字开头时，视频合集无法统计时长的问题
- 集数范围统一按多P列表顺序计算，与 URL 的 `p` 参数保持一致
- 优先从专用时长节点读取 `mm:ss` / `hh:mm:ss`
- 增加 `document-idle` 注入时机并避免 iframe 重复运行

### v6.1 (2026-07-08)
- 首次开源发布
- 规范化 UserScript 元数据头（`@namespace` / `@updateURL` / `@downloadURL`）
- 添加 MIT 开源许可证

## 许可证

[MIT License](./LICENSE) © LimiChan

---

**作者**: LimiChan · **仓库**: [LimiChan-2026/bilibili-study-helper](https://github.com/LimiChan-2026/bilibili-study-helper)
