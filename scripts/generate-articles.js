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
    // 解析YAML front matter
    const frontMatterMatch = content.match(/^---[\s\S]*?---/m);
    let frontMatter = {};
    let bodyContent = content;

    if (frontMatterMatch) {
        const frontMatterText = frontMatterMatch[0].replace(/^---|---$/g, '').trim();
        bodyContent = content.replace(frontMatterMatch[0], '').trim();

        // 简单解析YAML
        frontMatterText.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim().replace(/^"|"$/g, '');
                    frontMatter[key] = value;
                }
            }
        });
    }

    // 提取标题（如果front matter中没有，从内容中提取）
    let title = frontMatter.title;
    if (!title) {
        const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : `文章 ${filename}`;
    }

    // 提取摘要（前150个字符）
    const plainText = bodyContent.replace(/#+\s+/g, '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    const excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

    // 构建文章对象
    return {
        title: title,
        date: frontMatter.date || '2026-04-18',
        category: frontMatter.category || 'tech',
        tags: frontMatter.tags ? frontMatter.tags.split(',').map(tag => tag.trim()) : [],
        summary: frontMatter.summary || excerpt,
        excerpt: frontMatter.summary || excerpt,
        authors: frontMatter.authors || '',
        filename: filename
    };
}

// 执行扫描
scanArticles();
