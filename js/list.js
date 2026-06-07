document.addEventListener('DOMContentLoaded', function() {
    loadNavigation();
    loadArticles();
});

// SVG 图标（内联复用）
const Icons = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

// 分类显示名映射
const categoryNames = {
    'tutorial': '教程',
    'life': '生活',
    'tech': '技术'
};

// 加载文章列表
async function loadArticles() {
    const articlesList = document.getElementById('articles-list');

    try {
        const response = await fetch('../data/articles.json');
        if (!response.ok) throw new Error('无法加载文章列表');

        let articles = await response.json();
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderArticles(articles);

    } catch (error) {
        articlesList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">加载失败: ${error.message}</div>`;
    }
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
        const categoryName = categoryNames[article.category] || '技术';
        const tagsStr = article.tags ? article.tags.join(', ') : '';

        html += `
            <a href="detail.html?file=${article.filename}" class="article-card">
                <h3 class="article-card-title">${article.title}</h3>
                <div class="article-card-meta">
                    <span class="meta-item">${Icons.user}${article.authors || ''}</span>
                    <span class="meta-item">${Icons.calendar}${article.date}</span>
                    <span class="meta-item">${Icons.folder}${categoryName}</span>
                    ${tagsStr ? `<span class="meta-item meta-tags">${Icons.tag}${tagsStr}</span>` : ''}
                </div>
                <p class="article-card-summary">${article.summary || ''}</p>
                <span class="article-card-link">阅读全文${Icons.arrowRight}</span>
            </a>
        `;
    });

    articlesList.innerHTML = html;
}
