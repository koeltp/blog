// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}



// 获取默认文件（目录中的第一个文件）
function getDefaultFile(files) {
    if (files && files.length > 0) {
        return files[0].file;
    }
    return 'index.md';
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
        const defaultFile = getDefaultFile(files);
        const currentFile = getUrlParam('file') || defaultFile;
        
        // 如果当前文件不在列表中，使用默认文件
        const fileNames = files.map(f => f.file);
        const finalFile = fileNames.includes(currentFile) ? currentFile : defaultFile;
        
        let html = '';
        files.forEach(file => {
            const isActive = file.file === finalFile;
            html += `<li><a href="tutorial.html?type=${type}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
        });
        
        fileListDiv.innerHTML = html;
        
        // 如果文件不在列表中，重定向到默认文件
        if (finalFile !== currentFile && getUrlParam('file')) {
            window.location.href = `tutorial.html?type=${type}&file=${finalFile}`;
        }
    } catch (error) {
        fileListDiv.innerHTML = `<li style="color: red;">加载失败</li>`;
    }
}

// 加载并渲染markdown文件
async function loadMarkdown() {
    const type = getUrlParam('type') || 'langchain';
    const file = getUrlParam('file');
    const contentDiv = document.getElementById('content');
    
    try {
        // 获取默认文件
        let fileName = file;
        if (!file) {
            const navResponse = await fetch('data/nav.json');
            if (navResponse.ok) {
                const navData = await navResponse.json();
                const leftnav = navData.leftnav || {};
                const files = leftnav[type] || [];
                fileName = getDefaultFile(files);
            } else {
                fileName = 'index.md';
            }
        }
        
        // 加载markdown文件
        const response = await fetch(`docs/${type}/${fileName}`);
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
                let minDistance = Infinity;
                
                headingElements.forEach((heading, index) => {
                    const rect = heading.getBoundingClientRect();
                    const link = tocLinks[index];
                    
                    // 计算标题距离视口顶部的距离
                    const distance = Math.abs(rect.top - 100);
                    
                    // 找到距离视口顶部最近的标题
                    if (distance < minDistance) {
                        minDistance = distance;
                        currentActive = link;
                    }
                });
                
                tocLinks.forEach(link => link.classList.remove('active'));
                if (currentActive) {
                    currentActive.classList.add('active');
                    
                    // 确保激活的目录项在可视区域内
                    const rightNav = document.getElementById('right-nav');
                    const rightNavRect = rightNav.getBoundingClientRect();
                    const linkRect = currentActive.getBoundingClientRect();
                    
                    // 计算链接相对于目录容器的位置
                    const linkTopInNav = linkRect.top - rightNavRect.top + rightNav.scrollTop;
                    const linkBottomInNav = linkTopInNav + linkRect.height;
                    
                    // 如果链接在可视区域上方，滚动到链接位置
                    if (linkTopInNav < rightNav.scrollTop) {
                        rightNav.scrollTo({
                            top: linkTopInNav - 10,
                            behavior: 'smooth'
                        });
                    }
                    // 如果链接在可视区域下方，滚动使链接可见
                    else if (linkBottomInNav > rightNav.scrollTop + rightNavRect.height) {
                        rightNav.scrollTo({
                            top: linkBottomInNav - rightNavRect.height + 10,
                            behavior: 'smooth'
                        });
                    }
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

            // 渲染 Mermaid 图表
            if (window.mermaid) {
                try {
                    mermaid.run({ querySelector: '.mermaid' });
                } catch (e) {
                    console.warn('Mermaid 渲染失败:', e);
                }
            }
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