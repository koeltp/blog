document.addEventListener('DOMContentLoaded', function() {
    loadNavigation();
    loadArticles();
});

// 加载文章列表
async function loadArticles() {
    const articlesList = document.getElementById('articles-list');

    try {
        // 从JSON文件加载文章列表（自动生成）
        const response = await fetch('../data/articles.json');
        if (!response.ok) {
            throw new Error('无法加载文章列表');
        }

        let articles = await response.json();

        // 按日期排序（最新的在前）
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 生成文章列表HTML
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