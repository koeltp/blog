// ===== 公共常量 =====

// SVG 图标（内联复用，供各页面共享）
const Icons = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

// 分类显示名映射（统一管理，避免各文件定义不一致）
const categoryNames = {
    'tutorial': '教程',
    'life': '生活',
    'tech': '技术',
    'article': '文章',
    'docker': 'Docker',
    'finance': '财经'
};

// 获取分类标签（兼容旧调用方式）
function getCategoryLabel(category) {
    return categoryNames[category] || category || '技术';
}

/**
 * 构建文章元信息 HTML（作者、日期、分类、标签药丸）
 * 统一所有页面（列表页、搜索页、详情页、教程页）的 meta 渲染逻辑
 * @param {Object} options - { authors, date, category, tags, showAuthor? }
 * @returns {string} HTML 字符串
 */
function buildMetaHtml({ authors, date, category, tags, showAuthor = true } = {}) {
    const metaItems = [];

    if (showAuthor && authors) {
        const authorsStr = Array.isArray(authors) ? authors.join(', ') : authors;
        metaItems.push(`<span class="meta-item">${Icons.user}${authorsStr}</span>`);
    }
    if (date) {
        metaItems.push(`<span class="meta-item">${Icons.calendar}${date}</span>`);
    }
    const categoryLabel = getCategoryLabel(category);
    metaItems.push(`<span class="meta-item">${Icons.folder}${categoryLabel}</span>`);

    const tagArr = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    if (tagArr.length > 0) {
        const searchUrl = resolveUrl('search.html?q=');
        const tagLinks = tagArr.map(t => `<a href="${searchUrl}${encodeURIComponent(t)}" class="meta-tag">${t}</a>`).join('');
        metaItems.push(`<span class="meta-item meta-tags">${Icons.tag}${tagLinks}</span>`);
    }

    return metaItems.length > 0 ? `<div class="article-card-meta">${metaItems.join('')}</div>` : '';
}

// ===== 路径工具函数 =====

// 获取基础路径前缀（根据当前页面位置返回 '../' 或 ''）
function getBasePath() {
    return window.location.pathname.includes('/articles/') ? '../' : '';
}

// 解析相对路径（自动添加基础前缀）
function resolveUrl(path) {
    return getBasePath() + path;
}

// 加载导航数据
async function loadNavigation() {
    const navLinksDiv = document.getElementById('nav-links');
    
    try {
        const navJsonPath = resolveUrl('data/nav.json');
        
        const response = await fetch(navJsonPath);
        if (!response.ok) {
            throw new Error('导航数据加载失败');
        }
        
        const data = await response.json();
        const topnav = data.topnav || [];
        const currentUrl = window.location.href;
        
        // 检查是否在教程详情页
        const isTutorialPage = window.location.pathname.includes('tutorial.html');
        
        let html = '';
        topnav.forEach(item => {
            let isActive = currentUrl.includes(item.url);
            
            // 特殊处理：当当前页面是文章详情页时，也将"文章列表"标记为激活
            if (item.url === 'articles/list.html' && window.location.pathname.includes('/articles/detail.html')) {
                isActive = true;
            }
            
            // 在教程详情页时，将"教程"标记为激活
            if (item.url === 'tutorials.html' && isTutorialPage) {
                isActive = true;
            }
            
            // 构建正确的链接路径
            let linkUrl = item.url;
            if (getBasePath() && !item.url.startsWith('http') && !item.url.startsWith('/')) {
                linkUrl = getBasePath() + item.url;
            }
            html += `<li><a href="${linkUrl}" ${isActive ? 'class="active"' : ''}>${item.name}</a></li>`;
        });

        // 搜索图标：SVG 放大镜，与导航链接间隔 50px
        html += `<li class="nav-search"><button class="search-btn" id="search-btn" title="搜索"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button></li>`;

        navLinksDiv.innerHTML = html;

        // 添加汉堡菜单按钮
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.id = 'hamburger-btn';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.title = '菜单';
        document.querySelector('nav').appendChild(hamburger);

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinksDiv.classList.toggle('mobile-open');
        });

        // 点击导航链接后自动关闭菜单
        navLinksDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                hamburger.classList.remove('active');
                navLinksDiv.classList.remove('mobile-open');
            }
        });

        // 初始化搜索弹出框
        initSearchToggle();
    } catch (error) {
        navLinksDiv.innerHTML = `<li class="nav-error">加载失败</li>`;
    }
}

// ===== 全局搜索服务（弹出框和搜索页面共享 MiniSearch 实例）=====
let _sharedMiniSearch = null;
let _sharedMiniSearchLoading = false;
let _sharedMiniSearchReady = null; // Promise，防止并发加载

// 获取共享的 MiniSearch 实例（首次调用时加载索引）
async function getSharedMiniSearch(indexPath) {
    if (_sharedMiniSearch) return _sharedMiniSearch;
    if (_sharedMiniSearchLoading && _sharedMiniSearchReady) {
        return _sharedMiniSearchReady;
    }

    _sharedMiniSearchLoading = true;
    _sharedMiniSearchReady = (async () => {
        try {
            // 确保 MiniSearch 库已加载
            if (typeof MiniSearch === 'undefined') {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = resolveUrl('js/lib/minisearch.min.js');
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const path = indexPath || resolveUrl('data/search-index.json');
            const resp = await fetch(path);
            const data = await resp.json();
            data.forEach((item, i) => { item.id = i; });

            const ms = new MiniSearch({
                fields: ['title', 'tags', 'summary', 'content'],
                storeFields: ['title', 'tags', 'summary', 'content', 'type', 'dir', 'file', 'url', 'category', 'date', 'authors'],
                idField: 'id',
                searchOptions: {
                    boost: { title: 3, tags: 2, summary: 1.5, content: 1 },
                    prefix: true,
                    fuzzy: 0.2,
                    combineWith: 'AND'
                }
            });
            ms.addAll(data);
            _sharedMiniSearch = ms;
            _sharedMiniSearchLoading = false;
            return ms;
        } catch (e) {
            _sharedMiniSearchLoading = false;
            _sharedMiniSearchReady = null;
            return null;
        }
    })();

    return _sharedMiniSearchReady;
}

// 搜索弹出框：点击图标弹出输入框+实时结果（基于 MiniSearch）

function initSearchToggle() {
    const searchBtn = document.getElementById('search-btn');
    if (!searchBtn) return;

    let searchDebounceTimer = null;

    let basePath = resolveUrl('search.html');

    searchBtn.addEventListener('click', () => {
        const existing = document.getElementById('search-popup');
        if (existing) {
            existing.remove();
            return;
        }

        const popup = document.createElement('div');
        popup.id = 'search-popup';
        popup.className = 'search-popup';
        popup.innerHTML = `
            <div class="search-popup-inner">
                <input type="text" id="search-popup-input" placeholder="搜索教程和文章..." autocomplete="off">
                <div class="search-suggestions" id="search-suggestions"></div>
            </div>
        `;
        document.querySelector('nav').appendChild(popup);

        const input = document.getElementById('search-popup-input');
        const suggestions = document.getElementById('search-suggestions');
        input.focus();

        // 实时搜索建议
        input.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            const query = input.value.trim();

            if (!query) {
                suggestions.style.display = 'none';
                suggestions.innerHTML = '';
                return;
            }

            searchDebounceTimer = setTimeout(async () => {
                // getSharedMiniSearch 内部会自动加载 MiniSearch 库
                const ms = await getSharedMiniSearch();
                if (!ms) return;

                const results = ms.search(query, { limit: 5 });
                if (results.length === 0) {
                    suggestions.style.display = 'none';
                    suggestions.innerHTML = '';
                    return;
                }

                suggestions.innerHTML = results.map(item => {
                    const typeLabel = item.type === 'article' ? '文章' : '教程';
                    const typeClass = item.type === 'article' ? 'article' : 'tutorial';
                    let link = item.url;
                    if (getBasePath()) {
                        if (item.type === 'article') {
                            link = item.url.replace('articles/', '');
                        } else {
                            link = getBasePath() + item.url;
                        }
                    }
                    return `<a href="${link}" class="search-suggestion-item">
                        <span class="search-suggestion-type ${typeClass}">${typeLabel}</span>
                        <span class="search-suggestion-title">${item.title}</span>
                    </a>`;
                }).join('');
                suggestions.style.display = 'block';
            }, 200);
        });

        // 按 Enter 跳转搜索结果页
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `${basePath}?q=${encodeURIComponent(query)}`;
                }
            }
        });

        // 点击外部关闭
        document.addEventListener('click', function handler(e) {
            if (!popup.contains(e.target) && e.target !== searchBtn && !searchBtn.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', handler);
            }
        });
    });
}

// 返回顶部按钮
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.title = '返回顶部';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 0.5) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    initBackToTop();
});

/**
 * 初始化滚动监听，高亮当前目录项并自动滚动目录
 * 从 detail.js/tutorial.js 提取的公共逻辑
 * @param {string} tocListId - 目录列表的 DOM ID（默认 'toc-list'）
 * @param {string} rightNavId - 右侧导航容器的 DOM ID（默认 'right-nav'）
 */
function initScrollSpy(tocListId = 'toc-list', rightNavId = 'right-nav') {
    const tocList = document.getElementById(tocListId);
    const rightNav = document.getElementById(rightNavId);
    if (!tocList || !rightNav) return;

    const tocLinks = tocList.querySelectorAll('a');
    if (tocLinks.length === 0) return;

    // 从目录链接中提取对应的标题元素
    const headingElements = [];
    tocLinks.forEach(link => {
        const targetId = link.getAttribute('href')?.substring(1);
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) headingElements.push({ el, link });
        }
    });

    function updateActiveLink() {
        let currentActive = null;
        let minDistance = Infinity;

        headingElements.forEach(({ el, link }) => {
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - 100);

            if (distance < minDistance) {
                minDistance = distance;
                currentActive = link;
            }
        });

        tocLinks.forEach(link => link.classList.remove('active'));
        if (currentActive) {
            currentActive.classList.add('active');

            // 确保激活的目录项在可视区域内
            const rightNavRect = rightNav.getBoundingClientRect();
            const linkRect = currentActive.getBoundingClientRect();
            const linkTopInNav = linkRect.top - rightNavRect.top + rightNav.scrollTop;
            const linkBottomInNav = linkTopInNav + linkRect.height;

            if (linkTopInNav < rightNav.scrollTop) {
                rightNav.scrollTo({ top: linkTopInNav - 10, behavior: 'smooth' });
            } else if (linkBottomInNav > rightNav.scrollTop + rightNavRect.height) {
                rightNav.scrollTo({ top: linkBottomInNav - rightNavRect.height + 10, behavior: 'smooth' });
            }
        }
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();

    // 点击目录链接平滑滚动
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}