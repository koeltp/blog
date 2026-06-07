// 搜索功能：基于 MiniSearch 实现全文搜索，支持前缀匹配和模糊搜索

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
    'tech': '技术',
    'article': '文章'
};

// 获取 URL 中的搜索关键词
function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
}

// 全局 MiniSearch 实例缓存
let miniSearchInstance = null;

// 加载搜索索引并构建 MiniSearch 实例
async function loadSearchIndex() {
    if (miniSearchInstance) return miniSearchInstance;

    try {
        const response = await fetch('data/search-index.json');
        if (!response.ok) throw new Error('索引加载失败');
        const data = await response.json();

        // 给每条记录分配唯一 id（MiniSearch 要求）
        data.forEach((item, i) => {
            item.id = i;
        });

        miniSearchInstance = new MiniSearch({
            fields: ['title', 'tags', 'summary', 'content'],
            storeFields: ['title', 'tags', 'summary', 'content', 'type', 'dir', 'file', 'url', 'category'],
            idField: 'id',
            // 搜索选项：标题权重最高
            searchOptions: {
                boost: { title: 3, tags: 2, summary: 1.5, content: 1 },
                prefix: true,    // 前缀匹配，输入"认"就能匹配"认证"
                fuzzy: 0.2,      // 模糊搜索，容忍拼写错误
                combineWith: 'AND'
            }
        });

        miniSearchInstance.addAll(data);
        return miniSearchInstance;
    } catch (error) {
        console.error('搜索索引加载失败:', error);
        return null;
    }
}

// 执行搜索，返回匹配结果
async function searchItems(query) {
    if (!query.trim()) return [];

    const ms = await loadSearchIndex();
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
        const typeLabel = categoryNames[item.category] || (isArticle ? '文章' : '教程');
        const tagsStr = item.tags || '';
        // 从文件路径中提取日期（如果有的话）
        const dateStr = item.date || '';

        const snippet = getContextSnippet(item.content || '', query);
        const highlightedTitle = highlightText(item.title || '', query);
        const highlightedSnippet = highlightText(snippet, query);

        // 构建链接路径
        let link = item.url;
        if (window.location.pathname.includes('/articles/')) {
            if (isArticle) {
                link = item.url.replace('articles/', '');
            } else {
                link = '../' + item.url;
            }
        }

        html += `
            <a href="${link}" class="article-card">
                <h3 class="article-card-title">${highlightedTitle}</h3>
                <div class="article-card-meta">
                    <span class="meta-item">${Icons.folder}${typeLabel}</span>
                    ${dateStr ? `<span class="meta-item">${Icons.calendar}${dateStr}</span>` : ''}
                    ${tagsStr ? `<span class="meta-item meta-tags">${Icons.tag}${tagsStr}</span>` : ''}
                </div>
                ${highlightedSnippet ? `<p class="article-card-summary">${highlightedSnippet}</p>` : ''}
                <span class="article-card-link">阅读全文${Icons.arrowRight}</span>
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
