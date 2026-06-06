// 搜索功能：从 search-index.json 加载索引，按关键词匹配标题/标签/内容

// 获取 URL 中的搜索关键词
function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
}

// 加载搜索索引
async function loadSearchIndex() {
    try {
        const response = await fetch('data/search-index.json');
        if (!response.ok) throw new Error('索引加载失败');
        return await response.json();
    } catch (error) {
        console.error('搜索索引加载失败:', error);
        return [];
    }
}

// 执行搜索，返回匹配结果（按相关度排序）
function searchItems(index, query) {
    if (!query.trim()) return [];

    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    const results = index.map(item => {
        const title = (item.title || '').toLowerCase();
        const tags = (item.tags || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const content = (item.content || '').toLowerCase();

        let score = 0;

        keywords.forEach(keyword => {
            // 标题匹配权重最高
            if (title.includes(keyword)) score += 10;
            // 标签匹配
            if (tags.includes(keyword)) score += 5;
            // 摘要匹配
            if (summary.includes(keyword)) score += 3;
            // 内容匹配
            if (content.includes(keyword)) score += 1;
        });

        return { ...item, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return results;
}

// 高亮关键词
function highlightText(text, query) {
    if (!query.trim()) return text;
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
                <div class="search-empty-icon">🔍</div>
                <p>未找到与 "<strong>${query}</strong>" 相关的内容</p>
                <p class="search-empty-hint">试试其他关键词，或使用更简短的词语</p>
            </div>
        `;
        return;
    }

    let html = `<p class="search-count">找到 ${results.length} 个结果</p>`;

    results.forEach(item => {
        const isArticle = item.type === 'article';
        const typeLabel = isArticle ? '文章' : '教程';
        const typeClass = isArticle ? 'article' : 'tutorial';

        const snippet = getContextSnippet(item.content || '', query);
        const highlightedTitle = highlightText(item.title || '', query);
        const highlightedSnippet = highlightText(snippet, query);

        // 构建链接路径
        let link = item.url;
        if (window.location.pathname.includes('/articles/')) {
            // 当前在 articles 目录下，需要调整路径
            if (isArticle) {
                link = item.url; // 已经是 articles/ 下的路径
            } else {
                link = '../' + item.url;
            }
        }

        html += `
            <a href="${link}" class="search-result-item">
                <div class="search-result-header">
                    <span class="search-result-type ${typeClass}">${typeLabel}</span>
                    <h3 class="search-result-title">${highlightedTitle}</h3>
                </div>
                ${highlightedSnippet ? `<p class="search-result-snippet">${highlightedSnippet}</p>` : ''}
                ${item.tags ? `<div class="search-result-tags">${item.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
            </a>
        `;
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
    const index = await loadSearchIndex();
    const results = searchItems(index, query);
    renderResults(results, query);
}

// 搜索页面输入框 Enter 事件
function initSearchPageInput() {
    const input = document.getElementById('search-page-input');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initSearchPageInput();
    initSearch();
});
