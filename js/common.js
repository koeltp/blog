// 加载导航数据
async function loadNavigation() {
    const navLinksDiv = document.getElementById('nav-links');
    
    try {
        // 构建正确的导航数据路径
        let navJsonPath = 'data/nav.json';
        if (window.location.pathname.includes('/articles/')) {
            navJsonPath = '../data/nav.json';
        }
        
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
            if (window.location.pathname.includes('/articles/') && !item.url.startsWith('http') && !item.url.startsWith('/')) {
                linkUrl = '../' + item.url;
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
        navLinksDiv.innerHTML = `<li style="color: red;">加载失败</li>`;
    }
}

// 搜索弹出框：点击图标弹出输入框+实时结果（基于 MiniSearch）
let popupMiniSearch = null;

function initSearchToggle() {
    const searchBtn = document.getElementById('search-btn');
    if (!searchBtn) return;

    let searchDebounceTimer = null;

    let basePath = 'search.html';
    let indexPath = 'data/search-index.json';
    if (window.location.pathname.includes('/articles/')) {
        basePath = '../search.html';
        indexPath = '../data/search-index.json';
    }

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
                // 懒加载 MiniSearch 实例
                if (!popupMiniSearch) {
                    try {
                        const resp = await fetch(indexPath);
                        const data = await resp.json();
                        data.forEach((item, i) => { item.id = i; });

                        popupMiniSearch = new MiniSearch({
                            fields: ['title', 'tags', 'summary'],
                            storeFields: ['title', 'type', 'url'],
                            idField: 'id',
                            searchOptions: {
                                boost: { title: 3, tags: 2, summary: 1 },
                                prefix: true,
                                fuzzy: 0.2
                            }
                        });
                        popupMiniSearch.addAll(data);
                    } catch (e) {
                        return;
                    }
                }

                const results = popupMiniSearch.search(query, { limit: 5 });
                if (results.length === 0) {
                    suggestions.style.display = 'none';
                    suggestions.innerHTML = '';
                    return;
                }

                suggestions.innerHTML = results.map(item => {
                    const typeLabel = item.type === 'article' ? '文章' : '教程';
                    const typeClass = item.type === 'article' ? 'article' : 'tutorial';
                    let link = item.url;
                    if (window.location.pathname.includes('/articles/')) {
                        if (item.type === 'article') {
                            link = item.url.replace('articles/', '');
                        } else {
                            link = '../' + item.url;
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