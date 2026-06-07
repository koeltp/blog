document.addEventListener('DOMContentLoaded', function() {
    loadNavigation();
    // 仅在列表页加载文章数据
    if (document.getElementById('articles-list')) {
        loadArticles();
    }
});

/**
 * 构建文章卡片 HTML（列表页和搜索页共用）
 * @param {Object} options
 * @param {string} options.link - 文章链接
 * @param {string} options.title - 标题（可含高亮标记）
 * @param {string} [options.summary] - 摘要（可含高亮标记）
 * @param {string} [options.authors] - 作者
 * @param {string} [options.date] - 日期
 * @param {string} [options.category] - 分类
 * @param {string|Array} [options.tags] - 标签
 * @returns {string} 卡片 HTML
 */
function buildArticleCard({ link, title, summary, authors, date, category, tags }) {
    const metaHtml = buildMetaHtml({ authors, date, category, tags });
    const summaryHtml = summary ? `<p class="article-card-summary">${summary}</p>` : '';

    return `
        <div class="article-card">
            <h3 class="article-card-title"><a href="${link}">${title}</a></h3>
            ${metaHtml}
            ${summaryHtml}
            <a href="${link}" class="article-card-link">阅读全文${Icons.arrowRight}</a>
        </div>
    `;
}

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
        articlesList.innerHTML = `<div class="msg-error">加载失败: ${error.message}</div>`;
    }
}

// 渲染文章列表
function renderArticles(articles) {
    const articlesList = document.getElementById('articles-list');

    if (articles.length === 0) {
        articlesList.innerHTML = `<div class="msg-empty">暂无文章</div>`;
        return;
    }

    articlesList.innerHTML = articles.map(article =>
        buildArticleCard({
            link: `detail.html?file=${stripMdExt(article.filename)}`,
            title: article.title,
            summary: article.summary || '',
            authors: article.authors,
            date: article.date,
            category: article.category,
            tags: article.tags
        })
    ).join('');
}
