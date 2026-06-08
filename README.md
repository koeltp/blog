# 太皮 - 技术教程博客

基于 **VuePress 2** 构建的技术教程博客，涵盖 .NET、Flutter、LangChain、Docker、Aspire、财报分析、周易等多个领域。

---

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 安装与运行

```bash
# 安装依赖
npm install

# 本地开发（自动生成数据 + 启动热更新服务器）
npm run dev

# 生产构建
npm run build
```

开发服务器启动后访问 `http://localhost:8080`。

---

## 项目结构

```
blog/
├── scripts/
│   └── generate-data.js        # 数据生成脚本（自动从 md 生成 JSON）
├── src/
│   ├── .vuepress/
│   │   ├── components/         # Vue 组件
│   │   │   ├── Layout.vue       # 默认布局（首页/文章列表/搜索页）
│   │   │   ├── TutorialLayout.vue  # 教程详情页布局（三栏）
│   │   │   ├── NavBar.vue       # 顶部导航栏
│   │   │   ├── Home.vue         # 首页
│   │   │   ├── Articles.vue     # 文章列表页
│   │   │   ├── Search.vue       # 搜索页
│   │   │   ├── Tutorials.vue    # 教程总览页
│   │   │   └── SvgIcon.vue      # SVG 图标工具组件
│   │   ├── public/
│   │   │   ├── data/            # 自动生成的 JSON 数据（勿手动编辑）
│   │   │   │   ├── articles.json
│   │   │   │   ├── search-index.json
│   │   │   │   └── nav.json
│   │   │   └── img/             # 图片资源
│   │   ├── styles/
│   │   │   └── index.css        # 全局样式
│   │   ├── client.js            # 客户端入口（Mermaid、代码块增强等）
│   │   └── config.js            # VuePress 配置
│   └── docs/                    # Markdown 文档源码
│       ├── article/             # 独立文章
│       ├── aspire/              # Aspire 教程
│       ├── dart/                # Dart 教程
│       ├── dotnet/              # .NET 教程
│       │   └── auth/            # 认证与授权（子分类）
│       ├── flutter/             # Flutter 教程
│       ├── freport/             # 财报分析
│       ├── langchain/           # LangChain 教程
│       ├── md/                  # Markdown 语法指南
│       ├── openiddict/          # OpenIddict 教程
│       └── zhouyi/              # 周易预测
├── package.json
└── CNAME                        # 自定义域名
```

---

## 如何添加内容

### 添加一篇文章

1. 在 `src/docs/article/` 下创建 `.md` 文件
2. 填写 frontmatter：

```yaml
---
layout: TutorialLayout
title: 文章标题
date: 2026-06-08
category: tech
tags: 标签1, 标签2, 标签3
summary: 一句话简介
authors: 作者名（可选）
---

正文内容...
```

3. 运行 `npm run dev` 或 `npm run build`，数据自动生成

### 添加一个教程

1. 在 `src/docs/` 下创建新目录（如 `src/docs/my-tutorial/`）
2. 在目录下创建 `.md` 文件，编号前缀会自动排序：

```
src/docs/my-tutorial/
├── 01入门.md
├── 02进阶.md
└── index.md          # 教程首页（可选，title 会作为分类显示名）
```

3. 每个文件的 frontmatter 同上
4. 如果需要自定义分类显示名，在 `scripts/generate-data.js` 的 `DISPLAY_NAMES` 中添加映射：

```js
const DISPLAY_NAMES = {
  // ...
  'my-tutorial': '我的教程',
}
```

5. 运行 `npm run dev`，导航和搜索数据自动更新

### 添加子分类

目录嵌套即子分类。例如 `src/docs/dotnet/auth/` 会自动成为 `dotnet` 的子分类，左侧导航会显示分组折叠。

---

## Frontmatter 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `layout` | 是 | 固定 `TutorialLayout` |
| `title` | 是 | 文章/教程标题 |
| `date` | 是 | 发布日期，格式 `YYYY-MM-DD` |
| `category` | 是 | 分类：`tech`（技术）、`life`（生活）、`tutorial`（教程）、`finance`（财经） |
| `tags` | 是 | 标签，逗号分隔：`tags: .NET, Docker, 微服务` |
| `summary` | 是 | 一句话简介，显示在文章卡片和搜索结果中 |
| `authors` | 否 | 作者，字符串或 YAML 列表 |

---

## 自定义 Markdown 语法

### 图片尺寸控制

在 alt 文本中用 `|` 分隔尺寸参数：

| 语法 | 效果 |
|------|------|
| `![描述](url)` | 普通图片，无尺寸限制 |
| `![描述\|600](url)` | 最大宽度 600px |
| `![描述\|600x400](url)` | 最大宽度 600px，最大高度 400px |
| `![描述\|x400](url)` | 只限制最大高度 400px |
| `![描述\|80%](url)` | 最大宽度 80% |

示例：

```markdown
![架构图|600](/img/arch.png)        <!-- 宽度不超过 600px -->
![截图|x300](/img/screenshot.png)   <!-- 高度不超过 300px -->
![流程图|50%](/img/flow.png)        <!-- 宽度不超过容器 50% -->
```

---

## 数据生成机制

**核心原则：只管写 md，数据全自动。**

`npm run dev` 和 `npm run build` 都会先执行 `node scripts/generate-data.js`，该脚本：

1. 扫描 `src/docs/` 下所有 `.md` 文件
2. 解析 frontmatter
3. 自动生成三个 JSON 文件到 `src/.vuepress/public/data/`：

| 文件 | 用途 | 数据来源 |
|------|------|---------|
| `articles.json` | 文章列表页 | `article/` 下的 md |
| `search-index.json` | 全站搜索索引 | 所有 md |
| `nav.json` | 教程左侧导航 + 分类名 | 目录结构 + index.md 的 title |

也可以单独运行：`npm run generate`

---

## 组件架构

### 组件依赖关系

```
client.js（入口，注册所有组件和布局）
  │
  ├── Layout.vue ────────── 默认布局（首页/文章列表/搜索页等使用）
  │     └── NavBar.vue
  │           └── SvgIcon.vue
  │
  ├── TutorialLayout.vue ── 教程/文章详情页布局（三栏：侧边栏 + 内容 + 目录）
  │     ├── NavBar.vue
  │     │     └── SvgIcon.vue
  │     └── SvgIcon.vue
  │
  ├── Home.vue ───────────── 首页（留白叙事风格）
  ├── Articles.vue ───────── 文章列表页（几何秩序风格 Hero）
  │     └── SvgIcon.vue
  ├── Search.vue ────────── 搜索页（几何秩序风格 Hero）
  │     └── SvgIcon.vue
  ├── Tutorials.vue ─────── 教程总览页（卡片网格）
  └── SvgIcon.vue ────────── 图标工具组件（被多处引用）
```

### 布局选择逻辑

- **Layout** — 默认布局，首页/文章列表/搜索页/教程总览页使用
- **TutorialLayout** — 教程/文章详情页使用，提供左侧导航 + 右侧目录

### 样式约定

- 首页 Hero：**留白叙事** — 奶油暖调 `#fef9e8`
- 文章列表/搜索页 Hero：**几何秩序** — 浅灰蓝 `#eef2f5`
- 导航栏：毛玻璃效果 `backdrop-filter: blur(20px)`，固定顶部 64px

---

## 技术栈

| 技术 | 用途 |
|---|---|
| VuePress 2 | 静态站点生成框架 |
| Vite | 构建工具 |
| Vue 3 | 前端框架 |
| MiniSearch | 客户端全文搜索 |
| Mermaid | 图表渲染 |
| markdown-it-deflist | 定义列表插件 |

---

## 部署

### GitHub Actions 自动部署（推荐）

每次 push 到 `main` 分支时自动构建并部署。

1. 创建 `.github/workflows/deploy.yml`（参考 VuePress 官方文档）
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 推送后自动构建，Settings → Pages 查看站点地址

### 自定义域名

项目根目录已有 `CNAME` 文件。如需更换域名：

1. 修改 `CNAME` 文件内容
2. 在域名 DNS 添加 CNAME 记录指向 `<username>.github.io`
3. GitHub 仓库 Settings → Pages → Custom domain 填写新域名
4. 开启 **Enforce HTTPS**
