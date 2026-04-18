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
        
        let html = '';
        topnav.forEach(item => {
            let isActive = currentUrl.includes(item.url);
            
            // 特殊处理：当当前页面是文章详情页时，也将"文章列表"标记为激活
            if (item.url === 'articles/list.html' && window.location.pathname.includes('/articles/detail.html')) {
                isActive = true;
            }
            
            // 构建正确的链接路径
            let linkUrl = item.url;
            if (window.location.pathname.includes('/articles/') && !item.url.startsWith('http') && !item.url.startsWith('/')) {
                linkUrl = '../' + item.url;
            }
            html += `<li><a href="${linkUrl}" ${isActive ? 'class="active"' : ''}>${item.name}</a></li>`;
        });
        
        navLinksDiv.innerHTML = html;
    } catch (error) {
        navLinksDiv.innerHTML = `<li style="color: red;">加载失败</li>`;
    }
}