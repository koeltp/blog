const fs = require('fs');
const path = require('path');

// 文档根目录
const docsDir = path.join(__dirname, '../docs');
// 导航配置文件（同时包含配置和生成的导航）
const navFile = path.join(__dirname, '../data/nav.json');

// 默认配置
const defaultConfig = {
    // displayNames 的 key 顺序决定导航的固定显示顺序
    // 支持一级 key（如 'zhouyi'）和二级 key（如 'dotnet/auth'）
    displayNames: {
        'zhouyi': '周易预测',
        'langchain': 'LangChain教程',
        'flutter': 'Flutter教程',
        'dart': 'Dart教程',
        'freport': '手把手教读财报',
        'md': 'Markdown语法指南',
        'openiddict': 'OpenIddict教程',
        'aspire': 'Aspire教程',
        'dotnet': '.NET教程',
        'dotnet/auth': '认证与授权'
    },
    // 二级目录的父级映射，用于确定哪些一级目录包含子目录
    // key 是一级目录名，value 是该目录下的二级目录名数组
    subCategories: {
        'dotnet': ['auth']
    },
    excludeDirs: ['article'],
    topnavBase: [
        { name: "首页", url: "index.html" },
        { name: "文章", url: "articles/list.html" },
        { name: "教程", url: "tutorials.html" }
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
            topnavBase: defaultConfig.topnavBase
        };
    } catch {
        return defaultConfig;
    }
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
        
        const leftnav = {};
        
        // 按 displayNames 的 key 顺序遍历目录，确保固定排序
        const orderedDirs = Object.keys(config.displayNames)
            .filter(key => !config.excludeDirs.includes(key) && !key.includes('/'));
        
        // 扫描不在 displayNames 中的目录（追加到末尾）
        const extraDirs = entries
            .filter(entry => entry.isDirectory() && !config.excludeDirs.includes(entry.name))
            .map(d => d.name)
            .filter(name => !orderedDirs.includes(name));
        
        const finalOrder = [...orderedDirs, ...extraDirs];
        
        // 遍历每个目录（按固定顺序）
        finalOrder.forEach(dirName => {
            const dirPath = path.join(docsDir, dirName);
            if (!fs.existsSync(dirPath)) return;
            
            const subCategories = config.subCategories && config.subCategories[dirName];
            
            if (subCategories && subCategories.length > 0) {
                // 有二级子目录的一级目录：先扫描根目录 md 文件，再扫描子目录
                const rootFiles = fs.readdirSync(dirPath);
                const rootMdFiles = rootFiles.filter(file => file.endsWith('.md'));

                if (rootMdFiles.length > 0) {
                    const items = [];
                    rootMdFiles.forEach(file => {
                        const filePath = path.join(dirPath, file);
                        const displayName = getFileDisplayName(filePath, file);
                        items.push({ name: displayName, file: file });
                    });
                    items.sort((a, b) => a.file.localeCompare(b.file));
                    leftnav[dirName] = items;
                }

                subCategories.forEach(subDirName => {
                    const subDirPath = path.join(dirPath, subDirName);
                    if (!fs.existsSync(subDirPath)) return;

                    const files = fs.readdirSync(subDirPath);
                    const mdFiles = files.filter(file => file.endsWith('.md'));

                    if (mdFiles.length > 0) {
                        const items = [];
                        mdFiles.forEach(file => {
                            const filePath = path.join(subDirPath, file);
                            const displayName = getFileDisplayName(filePath, file);
                            items.push({ name: displayName, file: file });
                        });
                        items.sort((a, b) => a.file.localeCompare(b.file));
                        leftnav[`${dirName}/${subDirName}`] = items;
                    }
                });
            } else {
                // 普通一级目录：直接扫描 md 文件
                const files = fs.readdirSync(dirPath);
                const mdFiles = files.filter(file => file.endsWith('.md'));
                
                if (mdFiles.length > 0) {
                    const items = [];
                    mdFiles.forEach(file => {
                        const filePath = path.join(dirPath, file);
                        const displayName = getFileDisplayName(filePath, file);
                        items.push({ name: displayName, file: file });
                    });
                    items.sort((a, b) => a.file.localeCompare(b.file));
                    leftnav[dirName] = items;
                }
            }
        });
        
        // 构建最终的导航配置（topnav 只保留 base 项，教程通过 tutorials.html 访问）
        const nav = {
            displayNames: config.displayNames,
            subCategories: config.subCategories || {},
            excludeDirs: config.excludeDirs,
            topnavBase: config.topnavBase,
            topnav: config.topnavBase,
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
