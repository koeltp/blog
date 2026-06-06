# 教程网站项目

## 项目简介

这是一个基于 HTML、CSS 和 JavaScript 开发的教程网站，用于展示和管理各种技术教程和文章。网站支持 Markdown 格式的内容，具有美观的界面和丰富的功能。

## 项目结构

```
itclass/
├── articles/           # 文章页面
│   ├── list.html       # 文章列表页
│   └── detail.html     # 文章详情页
├── css/               # 样式文件
│   ├── common.css     # 通用样式
│   ├── index.css      # 首页样式
│   ├── tutorial.css   # 教程页样式
│   └── detail.css     # 文章详情页样式
├── data/              # 数据文件
│   ├── nav.json       # 导航数据
│   └── articles.json  # 文章列表数据（自动生成）
├── docs/              # 文档目录
│   ├── article/       # 文章文档
│   ├── dart/          # Dart教程
│   ├── flutter/       # Flutter教程
│   ├── langchain/     # LangChain教程
│   ├── md/            # Markdown语法指南
│   └── yi/            # 周易预测教程
├── js/                # JavaScript文件
│   ├── common.js      # 公共JavaScript
│   ├── index.js       # 首页JavaScript
│   ├── tutorial.js    # 教程页JavaScript
│   ├── list.js        # 文章列表页JavaScript
│   ├── detail.js      # 文章详情页JavaScript
│   └── markdown-parser.js  # Markdown解析器
├── scripts/           # 脚本文件
│   └── generate-articles.js  # 文章列表生成脚本
├── index.html         # 首页
├── tutorial.html      # 教程详情页
└── README.md          # 项目说明
```

## 功能特性

1. **响应式设计**：适配不同屏幕尺寸
2. **Markdown支持**：使用 markdown-it 渲染 Markdown 内容
3. **代码高亮**：使用 highlight.js 实现代码语法高亮
4. **代码复制功能**：为代码块添加复制按钮
5. **标签式代码块**：支持多个代码示例切换
6. **YAML Front Matter**：支持文章标题、摘要、作者、日期等元数据
7. **左侧导航**：显示教程文件列表
8. **右侧目录**：根据文章标题自动生成（支持滚动高亮和自动滚动）
9. **定义列表支持**：通过 markdown-it-deflist 插件实现
10. **文章系统**：支持文章列表展示和详情查看
11. **自动文章列表**：运行脚本自动生成文章列表 JSON
12. **文章搜索**：支持按标题、摘要、标签搜索文章

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **Markdown渲染**：markdown-it
- **代码高亮**：highlight.js
- **Markdown插件**：
  - markdown-it-container（支持容器）
  - markdown-it-deflist（支持定义列表）

## 如何运行

### 本地运行

直接在浏览器中打开 `index.html` 文件，或使用本地服务器运行：

```bash
# 使用 Python 3
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 部署

将所有文件上传到 Web 服务器即可。

## 如何添加教程

1. 在 `docs/` 目录下创建对应技术的文件夹（如 `new-tech/`）
2. 在文件夹中创建 Markdown 文件（如 `index.md`）
3. 在 Markdown 文件顶部添加 YAML Front Matter：
   ```yaml
   ---
   title: 教程标题
   summary: 教程简介
   authors: 作者姓名
   date: 2026-04-18
   category: tech
   tags: tag1, tag2, tag3
   ---
   ```
4. 运行导航生成脚本自动更新导航：
   ```bash
   node scripts/generate-nav.js
   ```

## 如何添加文章

1. 在 `docs/article/` 目录下创建 Markdown 文件
2. 在 Markdown 文件顶部添加 YAML Front Matter：
   ```yaml
   ---
   title: 文章标题
   summary: 文章简介
   authors: 作者姓名
   date: 2026-04-18
   category: tech
   tags: tag1, tag2, tag3
   ---
   ```
3. 运行文章列表生成脚本：
   ```bash
   node scripts/generate-articles.js
   ```

## Git 提交前自动生成数据

项目提供了 `scripts/pre-commit.sh`，在 `git commit` 前自动运行三个生成脚本并暂存结果。

### 安装（首次克隆后执行一次）

```bash
# Linux / macOS
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Windows (PowerShell)
Copy-Item scripts/pre-commit.sh .git\hooks\pre-commit
```

安装后每次 `git commit` 会自动：
1. 运行 `generate-nav.js` 生成导航数据
2. 运行 `generate-articles.js` 生成文章列表
3. 运行 `generate-search-index.js` 生成搜索索引
4. 将 `data/nav.json`、`data/articles.json`、`data/search-index.json` 自动加入暂存区

## 主要功能说明

### 首页
- 展示网站介绍和教程分类
- 响应式设计，适配不同设备

### 教程页
- 左侧导航：显示当前技术的教程文件列表
- 右侧目录：根据文章标题自动生成，点击可跳转到对应位置
- 文章头部：显示标题、摘要、作者和日期
- 代码块：支持语法高亮和复制功能
- 标签式代码块：可在多个代码示例之间切换

### 文章列表页
- 展示所有文章列表
- 支持按标题、摘要、标签搜索
- 文章按日期排序（最新在前）
- 显示文章标签和发布日期

### 文章详情页
- 完整的文章内容展示
- 右侧目录（只显示1-3级标题）
- 滚动时自动高亮当前目录项
- 目录过长时自动滚动

## 自定义样式

- 修改 `css/` 目录下的样式文件来自定义网站外观
- 主要样式文件：
  - `common.css`：网站通用样式
  - `tutorial.css`：教程页特有样式
  - `index.css`：首页特有样式
  - `detail.css`：文章详情页特有样式

## 浏览器兼容性

- 支持现代浏览器：Chrome, Firefox, Safari, Edge
- 响应式设计，适配桌面、平板和移动设备

## 许可证

本项目采用 MIT 许可证。
