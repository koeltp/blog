const fs = require('fs');
const path = require('path');

// 文档根目录
const docsDir = path.join(__dirname, '../docs');
// 输出文件
const outputFile = path.join(__dirname, '../data/search-index.json');

// 扫描所有 MD 文件并生成搜索索引
function generateSearchIndex() {
    const index = [];

    // 扫描 docs 下的所有子目录
    const dirs = fs.readdirSync(docsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    dirs.forEach(dirName => {
        const dirPath = path.join(docsDir, dirName);
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = parseMarkdown(content, file);

            if (dirName === 'article') {
                // 文章类型
                index.push({
                    title: parsed.title,
                    type: 'article',
                    dir: 'article',
                    file: file,
                    url: `articles/detail.html?file=${encodeURIComponent(file)}`,
                    category: parsed.frontMatter.category || 'tech',
                    tags: Array.isArray(parsed.frontMatter.tags)
                        ? parsed.frontMatter.tags.join(', ')
                        : (parsed.frontMatter.tags || ''),
                    summary: parsed.frontMatter.summary || parsed.excerpt,
                    content: parsed.plainText.substring(0, 500)
                });
            } else {
                // 教程类型
                index.push({
                    title: parsed.title,
                    type: 'tutorial',
                    dir: dirName,
                    file: file,
                    url: `tutorial.html?type=${dirName}&file=${encodeURIComponent(file)}`,
                    category: parsed.frontMatter.category || '',
                    tags: Array.isArray(parsed.frontMatter.tags)
                        ? parsed.frontMatter.tags.join(', ')
                        : (parsed.frontMatter.tags || ''),
                    summary: parsed.frontMatter.summary || parsed.excerpt,
                    content: parsed.plainText.substring(0, 500)
                });
            }
        });
    });

    // 写入文件
    fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
    console.log(`搜索索引生成完成: ${index.length} 条记录`);
    console.log(`输出文件: ${outputFile}`);
}

// 解析 Markdown 文件
function parseMarkdown(content, filename) {
    // 解析 front matter
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    let frontMatter = {};
    let bodyContent = content;

    if (frontMatterMatch) {
        const frontMatterText = frontMatterMatch[1];
        bodyContent = content.substring(frontMatterMatch[0].length);

        let currentKey = null;
        let currentValue = [];

        frontMatterText.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;

            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                if (currentKey) {
                    frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
                }
                currentKey = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
                currentValue = value ? [value] : [];
            } else if (currentKey && (line.startsWith('-') || line.startsWith('  '))) {
                const value = line.replace(/^ -\s*/, '').replace(/^\s*-\s*/, '').trim();
                if (value) currentValue.push(value);
            }
        });

        if (currentKey) {
            frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
        }
    }

    // 提取标题
    let title = frontMatter.title;
    if (!title) {
        const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
    }

    // 提取纯文本（去掉代码块和 Markdown 标记）
    const plainText = bodyContent
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
        .replace(/#+\s+/g, '')
        .replace(/[*_~>|]/g, '')
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 摘要取前 200 字符
    const excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');

    return { title, frontMatter, plainText, excerpt };
}

generateSearchIndex();
