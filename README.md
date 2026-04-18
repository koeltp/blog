# 教程网站项目

## 项目简介

这是一个基于HTML、CSS和JavaScript开发的教程网站，用于展示和管理各种技术教程。网站支持Markdown格式的教程内容，具有美观的界面和丰富的功能。

## 项目结构

```
itclass/
├── css/               # 样式文件
│   ├── common.css     # 通用样式
│   ├── index.css      # 首页样式
│   └── tutorial.css   # 教程页样式
├── data/              # 数据文件
│   └── nav.json       # 导航数据
├── docs/              # 教程文档（原markdown目录）
│   ├── dart/          # Dart教程
│   ├── flutter/       # Flutter教程
│   ├── langchain/     # LangChain教程
│   └── md/            # Markdown语法指南
├── js/                # JavaScript文件
│   ├── common.js      # 公共JavaScript
│   ├── index.js       # 首页JavaScript
│   └── tutorial.js    # 教程页JavaScript
├── index.html         # 首页
├── tutorial.html      # 教程详情页
└── README.md          # 项目说明
```

## 功能特性

1. **响应式设计**：适配不同屏幕尺寸
2. **Markdown支持**：使用markdown-it渲染Markdown内容
3. **代码高亮**：使用highlight.js实现代码语法高亮
4. **代码复制功能**：为代码块添加复制按钮
5. **标签式代码块**：支持多个代码示例切换
6. **YAML Front Matter**：支持文章标题、摘要、作者、日期等元数据
7. **左侧导航**：显示教程文件列表
8. **右侧目录**：根据文章标题自动生成
9. **定义列表支持**：通过markdown-it-deflist插件实现

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **Markdown渲染**：markdown-it
- **代码高亮**：highlight.js
- **Markdown插件**：
  - markdown-it-container（支持容器）
  - markdown-it-deflist（支持定义列表）

## 如何运行

1. **本地运行**：
   - 直接在浏览器中打开 `index.html` 文件
   - 或使用本地服务器运行：
     ```bash
     # 使用Python 3
     python -m http.server 8000
     # 然后访问 http://localhost:8000
     ```

2. **部署**：
   - 将所有文件上传到Web服务器即可

## 如何添加教程

1. 在 `docs/` 目录下创建对应技术的文件夹（如 `new-tech/`）
2. 在文件夹中创建Markdown文件（如 `index.md`）
3. 在Markdown文件顶部添加YAML Front Matter：
   ```yaml
   ---
title: 教程标题
summary: 教程简介
authors:
    - 作者1
    - 作者2
date: 2026-04-18
   ---
```
4. 在 `data/nav.json` 中添加导航条目

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

## 自定义样式

- 修改 `css/` 目录下的样式文件来自定义网站外观
- 主要样式文件：
  - `common.css`：网站通用样式
  - `tutorial.css`：教程页特有样式
  - `index.css`：首页特有样式

## 浏览器兼容性

- 支持现代浏览器：Chrome, Firefox, Safari, Edge
- 响应式设计，适配桌面、平板和移动设备

## 许可证

本项目采用 MIT 许可证。