const fs = require('fs');
const path = require('path');

// 文档根目录
const docsDir = path.join(__dirname, '../docs');
// 导航配置文件（同时包含配置和生成的导航）
const navFile = path.join(__dirname, '../data/nav.json');

// 默认配置
const defaultConfig = {
    displayNames: {
        'yi': '周易预测',
        'langchain': 'LangChain教程',
        'flutter': 'Flutter教程',
        'dart': 'Dart教程',
        'md': 'Markdown语法指南',
        'article': '文章'
    },
    excludeDirs: ['article'],
    topnavBase: [
        { name: "首页", url: "index.html" },
        { name: "文章列表", url: "articles/list.html" }
    ],
    topnav: [],
    leftnav: {}
};

// 读取导航配置
function readNavConfig() {
    try {
        const content = fs.readFileSync(navFile, 'utf-8');
        const existing = JSON.parse(content);
        // 合并默认配置和现有配置
        return {
            ...defaultConfig,
            ...existing,
            displayNames: { ...defaultConfig.displayNames, ...(existing.displayNames || {}) },
            excludeDirs: existing.excludeDirs || defaultConfig.excludeDirs,
            topnavBase: existing.topnavBase || defaultConfig.topnavBase
        };
    } catch {
        return defaultConfig;
    }
}

// 获取目录的显示名称（基于目录名）
function getDisplayName(dirName) {
    const config = readNavConfig();
    return config.displayNames[dirName] || dirName;
}

// 获取文件的显示名称（基于文件名或 frontmatter）
function getFileDisplayName(filePath, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // 尝试从 frontmatter 获取标题
        const frontMatterMatch = content.match(/^---[\s\S]*?---/m);
        if (frontMatterMatch) {
            const frontMatterText = frontMatterMatch[0];
            const titleMatch = frontMatterText.match(/^title:\s*(.+)$/m);
            if (titleMatch) {
                return titleMatch[1].trim();
            }
        }
    } catch (e) {
        console.log(`无法读取文件: ${fileName}`);
    }
    
    // 如果没有 frontmatter，从文件名提取
    const nameWithoutExt = fileName.replace(/\.md$/, '');
    return nameWithoutExt || '未命名';
}

// 生成导航配置
function generateNav() {
    const config = readNavConfig();
    
    try {
        // 读取 docs 目录下的所有子目录
        const entries = fs.readdirSync(docsDir, { withFileTypes: true });
        const dirs = entries.filter(entry => 
            entry.isDirectory() && !config.excludeDirs.includes(entry.name)
        );
        
        const leftnav = {};
        
        // 遍历每个目录
        dirs.forEach(dir => {
            const dirPath = path.join(docsDir, dir.name);
            const files = fs.readdirSync(dirPath);
            const mdFiles = files.filter(file => file.endsWith('.md'));
            
            // 如果目录中有 md 文件
            if (mdFiles.length > 0) {
                const items = [];
                
                mdFiles.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    const displayName = getFileDisplayName(filePath, file);
                    
                    items.push({
                        name: displayName,
                        file: file
                    });
                });
                
                // 按文件名排序
                items.sort((a, b) => a.file.localeCompare(b.file));
                
                leftnav[dir.name] = items;
            }
        });
        
        // 生成 topnav 中的教程链接（按照 displayNames 的顺序）
        const tutorialLinks = Object.keys(config.displayNames)
            .filter(key => leftnav[key])  // 只保留有内容的分类
            .map(key => ({
                name: getDisplayName(key),
                url: `tutorial.html?type=${key}`
            }));
        
        // 构建最终的导航配置（保留配置部分）
        const nav = {
            displayNames: config.displayNames,
            excludeDirs: config.excludeDirs,
            topnavBase: config.topnavBase,
            topnav: [
                ...config.topnavBase,
                ...tutorialLinks
            ],
            leftnav: leftnav
        };
        
        // 写入文件
        fs.writeFileSync(navFile, JSON.stringify(nav, null, 2));
        
        console.log('成功生成导航配置!');
        console.log(`输出文件: ${navFile}`);
        console.log(`检测到 ${Object.keys(leftnav).length} 个教程分类`);
        
    } catch (error) {
        console.error('生成导航配置失败:', error.message);
        process.exit(1);
    }
}

// 执行生成
generateNav();
