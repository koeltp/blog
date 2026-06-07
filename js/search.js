// 搜索功能：基于 MiniSearch 实现全文搜索，支持前缀匹配和模糊搜索

// 获取 URL 中的搜索关键词
function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
}

// 执行搜索，返回匹配结果（使用共享 MiniSearch 实例）
async function searchItems(query) {
    if (!query.trim()) return [];

    const ms = await getSharedMiniSearch();
    if (!ms) return [];

    return ms.search(query);
}

// 高亮关键词
function highlightText(text, query) {
    if (!query.trim() || !text) return text || '';
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    let result = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });
    return result;
}

// 从内容中提取包含关键词的上下文片段
function getContextSnippet(content, query, maxLen = 150) {
    if (!content || !query.trim()) return '';

    const lowerContent = content.toLowerCase();
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    // 找到第一个关键词出现的位置
    let pos = -1;
    for (const keyword of keywords) {
        const idx = lowerContent.indexOf(keyword);
        if (idx !== -1) {
            pos = idx;
            break;
        }
    }

    if (pos === -1) return content.substring(0, maxLen) + '...';

    // 从关键词前 30 字符开始截取
    const start = Math.max(0, pos - 30);
    const end = Math.min(content.length, start + maxLen);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
}

// 渲染搜索结果
function renderResults(results, query) {
    const container = document.getElementById('search-results');

    if (results.length === 0) {
        container.innerHTML = `
            <div class="search-empty">
                <div class="search-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                <p>未找到与 "<strong>${query}</strong>" 相关的内容</p>
                <p class="search-empty-hint">试试其他关键词，或使用更简短的词语</p>
            </div>
        `;
        return;
    }

    let html = `<p class="search-count">找到 ${results.length} 个结果</p>`;

    results.forEach(item => {
        const isArticle = item.type === 'article';
        const snippet = getContextSnippet(item.content || '', query);
        const highlightedTitle = highlightText(item.title || '', query);
        const highlightedSnippet = highlightText(snippet, query);

        // 构建链接路径
        let link = item.url;
        if (getBasePath()) {
            link = isArticle ? item.url.replace('articles/', '') : getBasePath() + item.url;
        }

        html += buildArticleCard({
            link,
            title: highlightedTitle,
            summary: highlightedSnippet,
            authors: item.authors,
            date: item.date,
            category: item.category,
            tags: item.tags
        });
    });

    container.innerHTML = html;
}

// 页面初始化
async function initSearch() {
    const query = getSearchQuery();
    const input = document.getElementById('search-page-input');

    // 回填搜索框
    if (input && query) {
        input.value = query;
    }

    // 更新页面标题
    if (query) {
        document.title = `搜索: ${query} - 太皮`;
    }

    if (!query.trim()) return;

    // 显示加载状态
    const container = document.getElementById('search-results');
    container.innerHTML = '<div class="search-loading">搜索中...</div>';

    // 加载索引并搜索
    const results = await searchItems(query);
    renderResults(results, query);
}

// 搜索页面输入框 Enter 事件 + 按钮点击
function initSearchPageInput() {
    const input = document.getElementById('search-page-input');
    const btn = document.getElementById('search-page-btn');
    if (!input) return;

    function doSearch() {
        const query = input.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
    });

    if (btn) {
        btn.addEventListener('click', doSearch);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadNavigation();
    initSearchPageInput();
    initSearch();
});
