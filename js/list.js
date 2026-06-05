document.addEventListener('DOMContentLoaded', function() {
    loadNavigation();
    loadArticles();
});

// 加载文章列表
async function loadArticles(searchTerm = '') {
    const articlesList = document.getElementById('articles-list');

    try {
        // 从JSON文件加载文章列表（自动生成）
        const response = await fetch('../data/articles.json');
        if (!response.ok) {
            throw new Error('无法加载文章列表');
        }

        let articles = await response.json();
        console.log(`加载文章列表: ${articles.length} 篇`);

        console.log(`所有文章:`, articles);

        // 按日期排序（最新的在前）
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 根据搜索条件过滤文章
        const filteredArticles = articles.filter(article => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                article.title.toLowerCase().includes(searchLower) ||
                article.summary.toLowerCase().includes(searchLower) ||
                article.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                article.authors.toLowerCase().includes(searchLower)
            );
        });

        // 生成文章列表HTML
        renderArticles(filteredArticles);

        // 绑定搜索功能
        bindSearchEvents();

    } catch (error) {
        articlesList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${error.message}</div>`;
    }
}

// 解析文章内容（与 generate-articles.js 保持一致）
function parseArticle(content, filename) {
    // 解析YAML front matter
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
                const value = line.replace(/^\s*-\s*/, '').trim();
                if (value) currentValue.push(value);
            }
        });

        if (currentKey) {
            frontMatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
        }
    }

    let title = frontMatter.title;
    if (!title) {
        const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1] : `文章 ${filename}`;
    }

    const plainText = bodyContent.replace(/#+\s+/g, '').replace(/```[\s\S]*?```/g, '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    const summary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

    // 统一 tags 为数组
    let tags = [];
    if (Array.isArray(frontMatter.tags)) {
        tags = frontMatter.tags;
    } else if (frontMatter.tags) {
        tags = frontMatter.tags.split(',').map(tag => tag.trim());
    }

    const authors = Array.isArray(frontMatter.authors) ? frontMatter.authors.join(', ') : (frontMatter.authors || '');

    return {
        title: title,
        date: frontMatter.date || '2026-04-18',
        category: frontMatter.category || 'tech',
        tags: tags,
        summary: frontMatter.summary || summary,
        authors: authors,
        filename: filename
    };
}

// 渲染文章列表
function renderArticles(articles) {
    const articlesList = document.getElementById('articles-list');

    if (articles.length === 0) {
        articlesList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #64748b;">暂无文章</div>`;
        return;
    }

    let html = '';
    articles.forEach(article => {
        const categoryClass = article.category;
        const categoryText = {
            'tutorial': '教程',
            'life': '生活',
            'tech': '技术'
        }[article.category] || '技术';

        html += `
            <div class="article-item">
                <div class="article-meta">
                    ${article.authors ? `<span class="article-authors">${article.authors}</span>` : ''}
                </div>
                <h3 class="article-title"><a href="detail.html?file=${article.filename}">${article.title}</a></h3>
                <p class="article-excerpt">${article.summary}</p>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    <span class="article-date">${article.date}</span>
                </div>
            </div>
        `;
    });

    articlesList.innerHTML = html;
}

// 绑定搜索事件
function bindSearchEvents() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // 搜索按钮点击事件
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        loadArticles(searchTerm);
    });

    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            loadArticles(searchTerm);
        }
    });
}