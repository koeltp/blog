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
            // 先渲染根目录文件（如 dotnet 下的配置体系详解）
            const rootFiles = leftnav[parentKey] || [];
            if (rootFiles.length > 0) {
                html += `<ul class="nav-root-items">`;
                rootFiles.forEach(file => {
                    const isActive = file.file === currentFile;
                    html += `<li><a href="tutorial.html?type=${parentKey}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
                });
                html += `</ul>`;
            }
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
            // 一级目录：检查是否有子目录
            const subs = subCategories[type] || [];
            const rootFiles = leftnav[type] || [];
            const hasSubDirs = subs.length > 0;

            if (hasSubDirs) {
                // 有子目录的一级目录：渲染根目录文件 + 子目录分组
                const allFiles = rootFiles;
                // 收集所有子目录的文件用于判断当前文件
                const subKeys = subs.map(s => `${type}/${s}`);
                let activeSubKey = null;
                let activeFile = getUrlParam('file') || (rootFiles.length > 0 ? rootFiles[0].file : null);

                // 判断当前文件属于哪个分组
                if (getUrlParam('file')) {
                    const f = getUrlParam('file');
                    if (rootFiles.some(rf => rf.file === f)) {
                        activeFile = f;
                    } else {
                        for (const sk of subKeys) {
                            if ((leftnav[sk] || []).some(sf => sf.file === f)) {
                                activeSubKey = sk;
                                activeFile = f;
                                break;
                            }
                        }
                    }
                }

                let html = '';

                // 渲染根目录文件
                if (rootFiles.length > 0) {
                    html += `<ul class="nav-root-items">`;
                    rootFiles.forEach(file => {
                        const isActive = !activeSubKey && file.file === activeFile;
                        html += `<li><a href="tutorial.html?type=${type}&file=${file.file}" ${isActive ? 'class="active"' : ''}>${file.name}</a></li>`;
                    });
                    html += `</ul>`;
                }

                // 渲染子目录分组
                subs.forEach(subDir => {
                    const subKey = `${type}/${subDir}`;
                    const subFiles = leftnav[subKey] || [];
                    const subDisplayName = displayNames[subKey] || subDir;
                    const isActiveGroup = subKey === activeSubKey;

                    html += `<li class="nav-group ${isActiveGroup ? '' : 'collapsed'}">`;
                    html += `<div class="nav-group-header" data-group="${subKey}">`;
                    html += `<span class="nav-group-arrow">${isActiveGroup ? '▼' : '▶'}</span>`;
                    html += `<span class="nav-group-title">${subDisplayName}</span>`;
                    html += `</div>`;
                    html += `<ul class="nav-group-items">`;

                    subFiles.forEach(file => {
                        const isActive = isActiveGroup && file.file === activeFile;
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
                            fileListDiv.querySelectorAll('.nav-group').forEach(g => {
                                g.classList.add('collapsed');
                                g.querySelector('.nav-group-arrow').textContent = '▶';
                            });
                            group.classList.remove('collapsed');
                            arrow.textContent = '▼';

                            const groupKey = header.dataset.group;
                            const groupFiles = leftnav[groupKey] || [];
                            if (groupFiles.length > 0) {
                                window.location.href = `tutorial.html?type=${encodeURIComponent(groupKey)}&file=${groupFiles[0].file}`;
                            }
                        } else {
                            group.classList.add('collapsed');
                            arrow.textContent = '▶';
                        }
                    });
                });

                fileListDiv.querySelectorAll('.nav-group-items a').forEach(link => {
                    link.addEventListener('click', (e) => e.stopPropagation());
                });

            } else {
                // 普通一级目录：直接渲染文件列表
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
        }
    } catch (error) {
        fileListDiv.innerHTML = `<li class="nav-error">加载失败</li>`;
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

            // 使用公共滚动监听函数
            initScrollSpy();

            // 渲染 Mermaid 图表（懒加载）
            loadMermaidIfNeeded().then(loaded => {
                if (loaded) renderMermaid();
            });
        }, 150);
        
        // 添加上一篇/下一篇导航
        await addPrevNextNav(type, fileName, contentDiv);
        
        // 更新页面标题
        const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || '教程详情';
        document.title = title;
        
        // 加载文件列表
        await loadFileList(type);
    } catch (error) {
        contentDiv.innerHTML = `<div class="msg-load-error">错误：${error.message}</div>`;
    }
}



// 添加上一篇/下一篇导航
async function addPrevNextNav(type, currentFile, contentDiv) {
    try {
        const response = await fetch('data/nav.json');
        if (!response.ok) return;
        const data = await response.json();
        const leftnav = data.leftnav || {};
        const files = leftnav[type] || [];
        if (files.length === 0) return;

        const currentIndex = files.findIndex(f => f.file === currentFile);
        if (currentIndex === -1) return;

        const prev = currentIndex > 0 ? files[currentIndex - 1] : null;
        const next = currentIndex < files.length - 1 ? files[currentIndex + 1] : null;
        if (!prev && !next) return;

        let navHtml = '<div class="prev-next-nav">';
        if (prev) {
            navHtml += `<a href="tutorial.html?type=${encodeURIComponent(type)}&file=${prev.file}" class="prev-next-link prev">
                <span class="prev-next-label">上一篇</span>
                <span class="prev-next-title">${prev.name}</span>
            </a>`;
        } else {
            navHtml += '<span class="prev-next-link prev disabled"></span>';
        }
        if (next) {
            navHtml += `<a href="tutorial.html?type=${encodeURIComponent(type)}&file=${next.file}" class="prev-next-link next">
                <span class="prev-next-label">下一篇</span>
                <span class="prev-next-title">${next.name}</span>
            </a>`;
        } else {
            navHtml += '<span class="prev-next-link next disabled"></span>';
        }
        navHtml += '</div>';

        const mdContent = contentDiv.querySelector('.markdown-content');
        if (mdContent) mdContent.insertAdjacentHTML('beforeend', navHtml);
    } catch (e) {
        // 导航生成失败不影响主内容
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async () => {
    await loadNavigation();
    await loadMarkdown();
});

