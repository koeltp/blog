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

// 加载文件列表（支持二级目录可折叠导航）
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
        const displayNames = data.displayNames || {};
        const subCategories = data.subCategories || {};
        
        // 判断是否为二级目录（如 dotnet/auth）
        const isSubCategory = type.includes('/');
        
        if (isSubCategory) {
            // 二级目录：渲染分组标题 + 文件列表
            const parentKey = type.split('/')[0]; // 如 dotnet
            const parentName = displayNames[parentKey] || parentKey;
            const subName = displayNames[type] || type.split('/')[1];
            const files = leftnav[type] || [];
            const defaultFile = getDefaultFile(files);
            const currentFile = getUrlParam('file') || defaultFile;
            const fileNames = files.map(f => f.file);
            const finalFile = fileNames.includes(currentFile) ? currentFile : defaultFile;
            
            let html = '';
            // 渲染同级所有子目录的分组
            const siblings = subCategories[parentKey] || [type.split('/')[1]];
            siblings.forEach(subDir => {
                const subKey = `${parentKey}/${subDir}`;
                const subFiles = leftnav[subKey] || [];
                const subDisplayName = displayNames[subKey] || subDir;
                const isActiveGroup = subKey === type;
                
                html += `<li class="nav-group ${isActiveGroup ? '' : 'collapsed'}">`;
                html += `<div class="nav-group-header" data-group="${subKey}">`;
                html += `<span class="nav-group-arrow">${isActiveGroup ? '▼' : '▶'}</span>`;
                html += `<span class="nav-group-title">${subDisplayName}</span>`;
                html += `</div>`;
                html += `<ul class="nav-group-items">`;
                
                subFiles.forEach(file => {
                    const isActive = isActiveGroup && file.file === finalFile;
                    html += `<li><a href="tutorial.html?type=${encodeURIComponent(subKey)}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
                });
                
                html += `</ul></li>`;
            });
            
            fileListDiv.innerHTML = html;
            
            // 绑定折叠事件
            fileListDiv.querySelectorAll('.nav-group-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    const group = header.parentElement;
                    const arrow = header.querySelector('.nav-group-arrow');
                    const isCollapsed = group.classList.contains('collapsed');

                    if (isCollapsed) {
                        // 折叠其他组，展开当前组
                        fileListDiv.querySelectorAll('.nav-group').forEach(g => {
                            g.classList.add('collapsed');
                            g.querySelector('.nav-group-arrow').textContent = '▶';
                        });
                        group.classList.remove('collapsed');
                        arrow.textContent = '▼';

                        // 如果当前不在该组，跳转到该组的第一篇文章
                        const groupKey = header.dataset.group;
                        if (groupKey !== type) {
                            const groupFiles = leftnav[groupKey] || [];
                            if (groupFiles.length > 0) {
                                window.location.href = `tutorial.html?type=${encodeURIComponent(groupKey)}&file=${groupFiles[0].file}`;
                            }
                        }
                    } else {
                        // 折叠当前组
                        group.classList.add('collapsed');
                        arrow.textContent = '▶';
                    }
                });
            });

            // 阻止分组标题下的链接点击冒泡到折叠逻辑
            fileListDiv.querySelectorAll('.nav-group-items a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            });
            
            // 如果文件不在列表中，重定向到默认文件
            if (finalFile !== currentFile && getUrlParam('file')) {
                window.location.href = `tutorial.html?type=${encodeURIComponent(type)}&file=${finalFile}`;
            }
        } else {
            // 一级目录：原有逻辑
            const files = leftnav[type] || [];
            const defaultFile = getDefaultFile(files);
            const currentFile = getUrlParam('file') || defaultFile;
            const fileNames = files.map(f => f.file);
            const finalFile = fileNames.includes(currentFile) ? currentFile : defaultFile;
            
            let html = '';
            files.forEach(file => {
                const isActive = file.file === finalFile;
                html += `<li><a href="tutorial.html?type=${type}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
            });
            
            fileListDiv.innerHTML = html;
            
            if (finalFile !== currentFile && getUrlParam('file')) {
                window.location.href = `tutorial.html?type=${type}&file=${finalFile}`;
            }
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
        
        // 加载markdown文件（支持二级目录路径如 dotnet/auth）
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
        contentDiv.innerHTML = '<div class="markdown-content">' + frontMatterHtml + html + '</div>';
        
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

            // 渲染 Mermaid 图表（懒加载）
            loadMermaidIfNeeded().then(loaded => {
                if (loaded) renderMermaid();
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

/**
 * 初始化 Mermaid 图表交互功能
 * 支持：图表/代码切换、放大缩小、下载、全屏
 */
function initMermaidInteractions() {
    document.querySelectorAll('.mermaid-wrapper').forEach(wrapper => {
        const diagram = wrapper.querySelector('.mermaid-diagram');
        const source = wrapper.querySelector('.mermaid-source');
        const svg = diagram.querySelector('svg');
        if (!svg) return;

        // 从 viewBox 获取原始尺寸（最可靠）
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/[\s,]+/);
            svg._baseWidth = parseFloat(parts[2]);
            svg._baseHeight = parseFloat(parts[3]);
        } else {
            svg._baseWidth = parseFloat(svg.getAttribute('width')) || svg.clientWidth || 800;
            svg._baseHeight = parseFloat(svg.getAttribute('height')) || svg.clientHeight || 400;
        }
        svg._currentScale = 1;

        // 保存 SVG 原始属性，退出全屏时恢复
        svg._origWidth = svg.getAttribute('width');
        svg._origHeight = svg.getAttribute('height');
        svg._origStyleWidth = svg.style.width;
        svg._origStyleHeight = svg.style.height;
        svg._origMaxWidth = svg.style.maxWidth;

        // 确保 viewBox 存在（缩放依赖 viewBox）
        if (!viewBox) {
            svg.setAttribute('viewBox', `0 0 ${svg._baseWidth} ${svg._baseHeight}`);
        }

        wrapper.querySelectorAll('.mermaid-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                wrapper.querySelectorAll('.mermaid-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.view === 'diagram') {
                    diagram.style.display = '';
                    source.style.display = 'none';
                } else {
                    diagram.style.display = 'none';
                    source.style.display = '';
                }
            });
        });

        wrapper.querySelectorAll('.mermaid-action').forEach(btn => {
            btn.addEventListener('click', () => {
                switch (btn.dataset.action) {
                    case 'zoom-in':
                        svg._currentScale = Math.min(5, svg._currentScale + 0.2);
                        applySvgScale(svg);
                        break;
                    case 'zoom-out':
                        svg._currentScale = Math.max(0.3, svg._currentScale - 0.2);
                        applySvgScale(svg);
                        break;
                    case 'download':
                        downloadMermaid(wrapper);
                        break;
                    case 'fullscreen':
                        toggleMermaidFullscreen(wrapper);
                        break;
                }
            });
        });
    });
}

function applySvgScale(svg) {
    const w = svg._baseWidth * svg._currentScale;
    const h = svg._baseHeight * svg._currentScale;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.style.maxWidth = 'none';
}

function downloadMermaid(wrapper) {
    const svg = wrapper.querySelector('.mermaid-diagram svg');
    if (!svg) return;

    const clone = svg.cloneNode(true);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-' + Date.now() + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 全屏切换
let _mermaidFullscreenEl = null;
function toggleMermaidFullscreen(wrapper) {
    const diagram = wrapper.querySelector('.mermaid-diagram');
    const svg = diagram.querySelector('svg');

    if (wrapper.classList.contains('fullscreen')) {
        wrapper.classList.remove('fullscreen');
        if (svg && svg._baseWidth) {
            svg._currentScale = 1;
            if (svg._origWidth) svg.setAttribute('width', svg._origWidth);
            else svg.removeAttribute('width');
            if (svg._origHeight) svg.setAttribute('height', svg._origHeight);
            else svg.removeAttribute('height');
            svg.style.width = svg._origStyleWidth || '';
            svg.style.height = svg._origStyleHeight || '';
            svg.style.maxWidth = svg._origMaxWidth || '';
        }
        _mermaidFullscreenEl = null;
        document.body.style.overflow = '';
        return;
    }

    if (_mermaidFullscreenEl && _mermaidFullscreenEl !== wrapper) {
        _mermaidFullscreenEl.classList.remove('fullscreen');
        const otherSvg = _mermaidFullscreenEl.querySelector('.mermaid-diagram svg');
        if (otherSvg && otherSvg._baseWidth) {
            otherSvg._currentScale = 1;
            if (otherSvg._origWidth) otherSvg.setAttribute('width', otherSvg._origWidth);
            else otherSvg.removeAttribute('width');
            if (otherSvg._origHeight) otherSvg.setAttribute('height', otherSvg._origHeight);
            else otherSvg.removeAttribute('height');
            otherSvg.style.width = otherSvg._origStyleWidth || '';
            otherSvg.style.height = otherSvg._origStyleHeight || '';
            otherSvg.style.maxWidth = otherSvg._origMaxWidth || '';
        }
        document.body.style.overflow = '';
    }

    if (svg) svg._savedScale = svg._currentScale;

    wrapper.classList.add('fullscreen');
    _mermaidFullscreenEl = wrapper;
    document.body.style.overflow = 'hidden';

    if (svg && svg._baseWidth) {
        requestAnimationFrame(() => {
            const toolbarH = wrapper.querySelector('.mermaid-toolbar').offsetHeight;
            const availW = window.innerWidth - 40;
            const availH = window.innerHeight - toolbarH - 40;
            const scaleX = availW / svg._baseWidth;
            const scaleY = availH / svg._baseHeight;
            svg._currentScale = Math.min(scaleX, scaleY, 5);
            applySvgScale(svg);
        });
    }

    wrapper._escHandler = (e) => {
        if (e.key === 'Escape') toggleMermaidFullscreen(wrapper);
    };
    document.addEventListener('keydown', wrapper._escHandler);
}