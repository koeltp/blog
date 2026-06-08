# 太皮 - 技术教程博客

基于 **VuePress 2** 构建的技术教程博客，涵盖 .NET、Flutter、LangChain、Docker、Aspire、财报分析、周易等多个领域。

## 项目结构

```
blog/
├── src/                          # VuePress 源码目录
│   ├── .vuepress/                # VuePress 配置
│   │   ├── components/           # 自定义组件
│   │   ├── public/               # 静态资源（data、img）
│   │   ├── styles/               # 全局样式
│   │   ├── client.js             # 客户端入口（Mermaid、代码块增强等）
│   │   └── config.js             # VuePress 配置文件
│   └── docs/                     # Markdown 文档
│       ├── article/              # 独立文章
│       ├── aspire/               # .NET Aspire 教程
│       ├── dart/                 # Dart 语言
│       ├── dotnet/               # .NET 教程（认证授权、生命周期、配置体系）
│       ├── flutter/              # Flutter 全套教程
│       ├── freport/              # 财报分析
│       ├── langchain/            # LangChain 教程
│       ├── md/                   # Markdown 语法指南
│       ├── openiddict/           # OpenIddict OAuth2 教程
│       └── zhouyi/               # 周易预测
├── img/                          # 图片资源
├── package.json
├── CNAME                         # 自定义域名
└── README.md
```

## 技术栈

| 技术 | 用途 |
|---|---|
| VuePress 2 | 静态站点生成框架 |
| Vite | 构建工具 |
| Vue 3 | 前端框架 |
| Sass | CSS 预处理器 |
| Mermaid | 图表渲染 |
| markdown-it | Markdown 解析扩展 |

## 功能特性

- **自定义布局**：首页、教程页、文章列表页、搜索页等独立布局
- **Mermaid 图表**：支持图表/代码切换、缩放、下载、全屏
- **代码块增强**：统一的头部栏（语言标签 + 复制按钮）、标签式多代码切换
- **定义列表**：通过 `markdown-it-deflist` 插件支持
- **响应式设计**：适配桌面端与移动端

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 如何添加内容

1. 在 `src/docs/` 下对应分类目录创建 `.md` 文件
2. 在文件顶部添加 Front Matter：

```yaml
---
title: 文章标题
summary: 文章简介
date: 2026-06-08
---
```

3. 使用 Mermaid 图表时，代码块语言标记为 `mermaid`：

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

## 部署到 GitHub Pages

本项目已配置 `CNAME` 文件用于自定义域名。以下是几种常见的 GitHub Pages 部署方式。

### 前置准备

1. 在 GitHub 上创建仓库（如 `koeltp/blog`）
2. 确保仓库中包含 `CNAME` 文件（指向你的自定义域名），或删除它使用默认的 `*.github.io` 域名

> **注意**：如果使用自定义域名，需在域名 DNS 管理处添加 CNAME 记录指向 `<username>.github.io`。

---

### 方式一：GitHub Actions 自动部署（推荐）

每次 push 到 `main` 分支时自动构建并部署，无需手动操作。

#### 1. 创建工作流文件

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  # 也支持手动触发
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build VuePress site
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ github.event.repository.html_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 2. 配置 GitHub Pages 设置

进入仓库 → **Settings** → **Pages** → **Build and deployment**：
- **Source**：选择 **GitHub Actions**

#### 3. 配置 VuePress base 路径（可选）

如果仓库不是 `[username].github.io` 这种特殊仓库名，需要在 `src/.vuepress/config.js` 中设置 `base`：

```js
export default defineUserConfig({
  // 仓库名为 blog 时，base 设为 /blog/
  base: '/blog/',
  // ...其他配置
})
```

> 特殊仓库名（`<username>.github.io` 或 `<org>.github.io`）不需要设置 `base`，保持默认 `/` 即可。

#### 4. 提交并推送

```bash
git add . && git commit -m "添加 GitHub Actions 部署工作流"
git push origin main
```

推送后自动触发构建，完成后在仓库 **Actions** 页面查看状态，**Settings → Pages** 查看站点地址。

---

### 方式二：手动构建 + gh-pages 分支

适合不想用 Actions 或需要手动控制发布时机的场景。

#### 1. 安装 gh-pages 工具

```bash
npm install --save-dev gh-pages
```

#### 2. 在 package.json 中添加部署脚本

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

#### 3. 执行部署

```bash
npm run deploy
```

这会将 `dist/` 目录内容推送到 `gh-pages` 分支。

#### 4. 配置 GitHub Pages 来源

进入仓库 → **Settings** → **Pages** → **Build and deployment**：
- **Source**：选择 **Deploy from a branch**
- **Branch**：选择 `gh-pages` / `(root)`

---

### 方式三：使用 vuepress-plugin-deploy 插件

VuePress 官方提供的部署插件，集成度更高。

#### 1. 安装插件

```bash
npm install --save-dev vuepress-plugin-deploy@next
```

#### 2. 在 config.js 中配置

```js
import { deployPlugin } from 'vuepress-plugin-deploy'

export default defineUserConfig({
  plugins: [
    deployPlugin({
      // 构建产物目录
      buildDir: './dist',
      // 目标分支
      branch: 'gh-pages',
      // 推送前是否清空目标分支
      clearBeforePush: true,
    }),
  ],
})
```

#### 3. 执行部署命令

```bash
npx vuepress-plugin-deploy deploy
```

或直接运行：

```bash
npm run build && npx vuepress-plugin-deploy deploy
```

---

### 自定义域名配置

如果使用自定义域名（如 `example.com`）：

1. 确保 `CNAME` 文件存在于项目根目录（本项目已有）
2. 在域名 DNS 管理面板添加记录：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | `@` | `<username>.github.io` |
| CNAME | `www` | `<username>.github.io` |

3. 在 GitHub 仓库 **Settings → Pages → Custom domain** 中填写域名
4. 开启 **Enforce HTTPS**

### 部署方式对比

| | Actions 自动部署 | 手动 gh-pages | deploy 插件 |
|---|---|---|---|
| 自动化程度 | 全自动 | 手动执行 | 半自动 |
| 适用场景 | 持续集成、团队协作 | 偶尔更新、简单场景 | 深度定制 |
| 配置复杂度 | 中等 | 低 | 中等 |
| 依赖外部工具 | GitHub Actions | gh-pages CLI | vuepress-plugin-deploy |
| 推荐 | ★★★★★ | ★★★ | ★★★★ |
