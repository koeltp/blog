const fs = require('fs');
const path = require('path');

// 文章目录
const articlesDir = path.join(__dirname, '../docs/article');
// 输出的JSON文件
const outputFile = path.join(__dirname, '../data/articles.json');

// 扫描文章目录
function scanArticles() {
    const articles = [];
    
    try {
        // 读取目录中的所有文件
        const files = fs.readdirSync(articlesDir);
        
        // 过滤出Markdown文件
        const mdFiles = files.filter(file => file.endsWith('.md'));
        
        // 遍历每个文件
        mdFiles.forEach(file => {
            const filePath = path.join(articlesDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // 解析文章信息
            const article = parseArticle(content, file);
            if (article) {
                articles.push(article);
            }
        });
        
        // 按日期排序（最新的在前）
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 写入JSON文件
        fs.writeFileSync(outputFile, JSON.stringify(articles, null, 2));
        
        console.log(`成功生成文章列表: ${articles.length} 篇文章`);
        console.log(`输出文件: ${outputFile}`);
        
    } catch (error) {
        console.error('生成文章列表失败:', error.message);
        process.exit(1);
    }
}

// 解析文章内容
function parseArticle(content, filename) {
    // 解析YAML front matter（与前端 markdown-parser.js 保持一致）
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    let frontMatter = {};
    let bodyContent = content;

    if (frontMatterMatch) {
        const frontMatterText = frontMatterMatch[1];
        bodyContent = content.substring(frontMatterMatch[0].length);

        // 解析 front matter 字段（支持多行值和 YAML 列表语法）
        let currentKey = null;
        let currentValue = [];

        frontMatterText.split('\n').forEach(line => {
            line = line.trim();

            // 跳过空行
            if (!line) return;

            // 检查是否是新的键值对
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                // 处理之前的键值对
                if (currentKey) {
                    frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
                }

                // 开始新的键值对
                currentKey = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

                if (value) {
                    currentValue = [value];
                } else {
                    currentValue = [];
                }
            } else if (currentKey && (line.startsWith('-') || line.startsWith('  '))) {
                // 处理 YAML 列表项
                const value = line.replace(/^ -\s*/, '').replace(/^\s*-\s*/, '').trim();
                if (value) {
                    currentValue.push(value);
                }
            }
        });

        // 处理最后一个键值对
        if (currentKey) {
            frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
        }
    }

    // 提取标题（如果front matter中没有，从内容中提取）
    let title = frontMatter.title;
    if (!title) {
        const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : `文章 ${filename}`;
    }

    // 提取摘要（前150个字符）
    const plainText = bodyContent.replace(/#+\s+/g, '').replace(/```[\s\S]*?```/g, '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

    // 统一 tags 为数组（支持 YAML 列表和逗号分隔两种格式）
    let tags = [];
    if (Array.isArray(frontMatter.tags)) {
        tags = frontMatter.tags;
    } else if (frontMatter.tags) {
        tags = frontMatter.tags.split(',').map(tag => tag.trim());
    }

    // 统一 authors（支持 YAML 列表和字符串）
    const authors = Array.isArray(frontMatter.authors) ? frontMatter.authors.join(', ') : (frontMatter.authors || '');

    // 构建文章对象
    return {
        title: title,
        date: frontMatter.date || '2026-04-18',
        category: frontMatter.category || 'tech',
        tags: tags,
        summary: frontMatter.summary || excerpt,
        authors: authors,
        filename: filename
    };
}

// 执行扫描
scanArticles();
