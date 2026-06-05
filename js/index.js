// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    loadNavigation();
    loadLatestArticles();
});

// 加载最近更新的文章
async function loadLatestArticles() {
    const container = document.getElementById('latest-articles');
    if (!container) return;

    try {
        const response = await fetch('data/articles.json');
        if (!response.ok) throw new Error('获取文章列表失败');

        const articles = await response.json();

        // 按日期降序排序，取最新 6 篇
        const latest = articles
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        if (latest.length === 0) {
            container.innerHTML = '<div class="latest-item"><p>暂无文章</p></div>';
            return;
        }

        container.innerHTML = latest.map(article => {
            const date = article.date ? new Date(article.date).toLocaleDateString('zh-CN') : '';
            const tags = (article.tags || []).slice(0, 3).map(t =>
                `<span class="tag">${t}</span>`
            ).join('');
            return `
                <div class="latest-item">
                    <div class="article-meta">
                        <span class="article-category ${article.category || 'tech'}">${getCategoryLabel(article.category)}</span>
                        <span class="article-date">${date}</span>
                    </div>
                    <h3>${article.title}</h3>
                    <p>${article.summary || ''}</p>
                    <div class="article-tags">
                        ${tags}
                        <a href="articles/detail.html?file=${encodeURIComponent(article.filename)}" class="read-more">阅读更多 →</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('加载最新文章失败:', e);
        container.innerHTML = '<div class="latest-item"><p>加载失败</p></div>';
    }
}

// 获取分类标签
function getCategoryLabel(category) {
    const labels = {
        tech: '技术',
        tutorial: '教程',
        life: '生活',
        docker: 'Docker',
        finance: '财经'
    };
    return labels[category] || category || '技术';
}