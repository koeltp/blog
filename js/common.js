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
        const displayNames = data.displayNames || {};
        const currentUrl = window.location.href;
        
        // 检查是否在教程详情页
        const isTutorialPage = window.location.pathname.includes('tutorial.html');
        const tutorialType = isTutorialPage ? new URLSearchParams(window.location.search).get('type') : null;
        const tutorialName = tutorialType ? displayNames[tutorialType] : null;
        
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
        
        // 如果在教程详情页，追加当前教程名称作为面包屑
        if (isTutorialPage && tutorialName) {
            html += `<li><a href="tutorial.html?type=${tutorialType}" class="active breadcrumb-current">${tutorialName}</a></li>`;
        }
        
        navLinksDiv.innerHTML = html;
    } catch (error) {
        navLinksDiv.innerHTML = `<li style="color: red;">加载失败</li>`;
    }
}