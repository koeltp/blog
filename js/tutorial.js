// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}



// 加载文件列表
async function loadFileList(type) {
    const fileListDiv = document.getElementById('file-list');
    
    try {
        // 从JSON文件加载文件列表
        const response = await fetch('data/nav.json');
        if (!response.ok) {
            throw new Error('文件列表加载失败');
        }
        
        const data = await response.json();
        const leftnav = data.leftnav || {};
        const files = leftnav[type] || [];
        const currentFile = getUrlParam('file') || 'index.md';
        
        let html = '';
        files.forEach(file => {
            const isActive = file.file === currentFile;
            html += `<li><a href="tutorial.html?type=${type}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
        });
        
        fileListDiv.innerHTML = html;
    } catch (error) {
        fileListDiv.innerHTML = `<li style="color: red;">加载失败</li>`;
    }
}

// 加载并渲染markdown文件
async function loadMarkdown() {
    const type = getUrlParam('type') || 'langchain';
    const file = getUrlParam('file') || 'index.md';
    const contentDiv = document.getElementById('content');
    
    try {
        // 加载markdown文件
        const response = await fetch(`docs/${type}/${file}`);
        if (!response.ok) {
            throw new Error('文件加载失败');
        }
        
        const markdown = await response.text();

        // 创建 MarkdownParser 实例
        const parser = new MarkdownParser();

        // 渲染 Markdown
        const { html, frontMatterHtml } = parser.render(markdown);

        // 插入渲染后的内容
        contentDiv.innerHTML = frontMatterHtml + html;
        
        // 应用代码高亮
        parser.applyHighlight();
        
        // 初始化标签切换功能
        parser.initTabs(contentDiv);
        
        // 生成右侧导航
        setTimeout(() => {
            const tocList = document.getElementById('toc-list');
            const headings = contentDiv.querySelectorAll('h1, h2, h3');
            
            if (headings.length === 0) {
                document.getElementById('right-nav').style.display = 'none';
                return;
            }
            
            let tocHtml = '';
            headings.forEach((heading, index) => {
                const level = heading.tagName.toLowerCase();
                const text = heading.textContent;
                const id = `heading-${index}`;
                
                heading.id = id;
                
                tocHtml += `<li><a href="#${id}" class="toc-${level}">${text}</a></li>`;
            });
            
            tocList.innerHTML = tocHtml;
            
            // 添加滚动监听
            const tocLinks = tocList.querySelectorAll('a');
            const headingElements = contentDiv.querySelectorAll('h1, h2, h3');
            
            function updateActiveLink() {
                let currentActive = null;
                
                headingElements.forEach((heading, index) => {
                    const rect = heading.getBoundingClientRect();
                    const link = tocLinks[index];
                    
                    if (rect.top <= 100) {
                        if (currentActive === null || rect.top > currentActive.getBoundingClientRect().top) {
                            currentActive = link;
                        }
                    }
                });
                
                tocLinks.forEach(link => link.classList.remove('active'));
                if (currentActive) {
                    currentActive.classList.add('active');
                }
            }
            
            window.addEventListener('scroll', updateActiveLink);
            updateActiveLink();
            
            // 点击导航链接平滑滚动
            tocLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }, 150);
        
        // 更新页面标题
        const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || '教程详情';
        document.title = title;
        
        // 加载文件列表
        await loadFileList(type);
    } catch (error) {
        contentDiv.innerHTML = `<div style="text-align: center; padding: 4rem; color: red;">错误：${error.message}</div>`;
    }
}



// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async () => {
    await loadNavigation();
    await loadMarkdown();
});