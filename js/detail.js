document.addEventListener('DOMContentLoaded', () => {
    loadNavigation();
    loadArticleDetail();
});

// 加载文章详情
async function loadArticleDetail() {
    const articleDetail = document.getElementById('article-detail');

    try {
        // 获取 URL 参数中的文件名
        const urlParams = new URLSearchParams(window.location.search);
        const filename = urlParams.get('file');

        if (!filename) {
            articleDetail.innerHTML = `<div style="text-align: center; padding: 4rem 1rem; color: #ef4444;">文章不存在</div>`;
            return;
        }

        // 加载文章文件
        const response = await fetch(`../docs/article/${filename}`);
        if (!response.ok) {
            articleDetail.innerHTML = `<div style="text-align: center; padding: 4rem 1rem; color: #ef4444;">文章不存在</div>`;
            return;
        }

        const content = await response.text();
        const article = parseArticle(content, filename);

        if (!article) {
            articleDetail.innerHTML = `<div style="text-align: center; padding: 4rem 1rem; color: #ef4444;">文章解析失败</div>`;
            return;
        }

        // 渲染文章详情
        renderArticleDetail(article);

    } catch (error) {
        articleDetail.innerHTML = `<div style="text-align: center; padding: 4rem 1rem; color: #ef4444;">加载失败: ${error.message}</div>`;
    }
}

// 解析文章内容
function parseArticle(content, filename) {
    // 解析YAML front matter
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    let frontMatter = {};
    let markdownContent = content;

    if (frontMatterMatch) {
        const frontMatterText = frontMatterMatch[1];
        markdownContent = content.substring(frontMatterMatch[0].length);

        // 解析front matter字段（支持多行值）
        let currentKey = null;
        let currentValue = [];

        frontMatterText.split('\n').forEach(line => {
            line = line.trim();

            // 跳过空行
            if (!line) return;

            // 检查是否是新的键值对
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                // 处理之前的键值对
                if (currentKey) {
                    if (currentValue.length === 1) {
                        // 单行值
                        frontMatter[currentKey] = currentValue[0];
                    } else {
                        // 多行值（如authors数组）
                        frontMatter[currentKey] = currentValue;
                    }
                }

                // 开始新的键值对
                currentKey = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();

                if (value) {
                    currentValue = [value];
                } else {
                    currentValue = [];
                }
            } else if (currentKey && (line.startsWith('-') || line.startsWith('  '))) {
                // 处理多行值（如authors数组）
                const value = line.replace(/^-\s*/, '').trim();
                if (value) {
                    currentValue.push(value);
                }
            }
        });

        // 处理最后一个键值对
        if (currentKey) {
            if (currentValue.length === 1) {
                frontMatter[currentKey] = currentValue[0];
            } else {
                frontMatter[currentKey] = currentValue;
            }
        }
    }

    // 提取标题
    let title = frontMatter.title || '无标题';

    // 提取摘要
    let excerpt = frontMatter.summary || '';
    if (!excerpt) {
        // 从内容中提取摘要
        const plainText = markdownContent.replace(/#+\s/g, '').replace(/```[\s\S]*?```/g, '').replace(/\[.*?\]\(.*?\)/g, '').trim();
        excerpt = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }

    // 构建文章对象
    return {
        title: title,
        date: frontMatter.date || '2026-04-18',
        category: frontMatter.category || 'tech',
        tags: frontMatter.tags ? frontMatter.tags.split(',').map(tag => tag.trim()) : [],
        authors: frontMatter.authors || '',
        content: markdownContent,
        filename: filename
    };
}

// 渲染文章详情
function renderArticleDetail(article) {
    const articleDetail = document.getElementById('article-detail');

    // 生成front matter的HTML
    let frontMatterHtml = '';
    if (article.authors || article.date || article.tags.length > 0) {
        frontMatterHtml = '<div class="article-header">';

        if (article.title) {
            frontMatterHtml += `<h1 class="article-detail-title">${article.title}</h1>`;
        }

        const metaParts = [];
        if (article.authors) {
            const authors = Array.isArray(article.authors) ? article.authors.join(', ') : article.authors;
            metaParts.push(`作者：${authors}`);
        }
        if (article.date) {
            metaParts.push(`发布日期：${article.date}`);
        }
        if (article.tags.length > 0) {
            metaParts.push(`标签：${article.tags.join(', ')}`);
        }
        if (metaParts.length > 0) {
            frontMatterHtml += `<div class="article-detail-meta">${metaParts.join(' &nbsp;|&nbsp; ')}</div>`;
        }

        frontMatterHtml += '</div>';
    }

    // 创建 MarkdownParser 实例
    const parser = new MarkdownParser();

    // 渲染 Markdown
    const { html } = parser.render(article.content);

    // 插入渲染后的内容
    articleDetail.innerHTML = frontMatterHtml + '<div class="article-detail-content">' + html + '</div>';

    // 应用代码高亮
    parser.applyHighlight();

    // 初始化标签切换功能
    parser.initTabs(articleDetail);

    // 生成右侧目录（使用setTimeout确保DOM已渲染）
    setTimeout(() => {
        generateToc();
        // 渲染 Mermaid 图表
        if (window.mermaid) {
            try {
                mermaid.run({ querySelector: '.mermaid' }).then(() => {
                    // 等 SVG 完全渲染后再初始化交互
                    setTimeout(() => initMermaidInteractions(), 300);
                });
            } catch (e) {
                console.warn('Mermaid 渲染失败:', e);
            }
        }
    }, 100);

    // 更新页面标题
    document.title = article.title + ' - 太皮';
}

// 生成目录（只显示1-3级标题）
function generateToc() {
    const tocList = document.getElementById('toc-list');
    const contentDiv = document.getElementById('article-detail');
    const headings = contentDiv.querySelectorAll('h1, h2, h3');
    
    if (!headings || headings.length === 0) {
        document.getElementById('right-nav').style.display = 'none';
        return;
    }

    // 为标题添加ID（如果没有的话）
    headings.forEach((heading, index) => {
        if (!heading.getAttribute('id')) {
            const id = 'heading-' + index;
            heading.setAttribute('id', id);
        }
    });

    // 生成目录HTML
    let html = '';
    headings.forEach(heading => {
        const id = heading.getAttribute('id');
        const text = heading.textContent;
        const level = parseInt(heading.tagName.substring(1));
        const indentStyle = level > 1 ? `style="padding-left: ${(level - 1) * 12}px;"` : '';
        html += `<li ${indentStyle}><a href="#${id}">${text}</a></li>`;
    });

    tocList.innerHTML = html;

    // 添加目录点击事件（平滑滚动）
    tocList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 添加滚动监听（高亮当前目录项）
    setupScrollSpy();
}

// 滚动监听高亮目录
function setupScrollSpy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocLinks = document.querySelectorAll('#toc-list a');

    window.addEventListener('scroll', () => {
        let currentId = '';

        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 100) {
                currentId = heading.getAttribute('id');
            }
        });

        // 高亮当前目录项
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentId) {
                link.classList.add('active');
            }
        });

        // 自动滚动目录
        const activeLink = document.querySelector('#toc-list a.active');
        if (activeLink) {
            const rightNav = document.getElementById('right-nav');
            const linkTop = activeLink.offsetTop;
            const navTop = rightNav.scrollTop;
            const navHeight = rightNav.offsetHeight;

            if (linkTop < navTop) {
                rightNav.scrollTo({ top: linkTop - 10, behavior: 'smooth' });
            } else if (linkTop > navTop + navHeight - 40) {
                rightNav.scrollTo({ top: linkTop - navHeight + 40, behavior: 'smooth' });
            }
        }
    });
}

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

        // 图表/代码切换
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

        // 操作按钮
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

// 缩放 SVG：修改 width/height，viewBox 保证内容等比缩放
function applySvgScale(svg) {
    const w = svg._baseWidth * svg._currentScale;
    const h = svg._baseHeight * svg._currentScale;
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.style.maxWidth = 'none';
}

// 下载 Mermaid 图表为 SVG
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
        // 退出全屏：恢复 SVG 原始状态
        wrapper.classList.remove('fullscreen');
        if (svg && svg._baseWidth) {
            svg._currentScale = 1;
            // 恢复原始属性和样式
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

    // 关闭其他全屏
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

    // 保存当前缩放值
    if (svg) svg._savedScale = svg._currentScale;

    wrapper.classList.add('fullscreen');
    _mermaidFullscreenEl = wrapper;
    document.body.style.overflow = 'hidden';

    // 全屏时自动缩放铺满屏幕
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

    // ESC 退出
    wrapper._escHandler = (e) => {
        if (e.key === 'Escape') toggleMermaidFullscreen(wrapper);
    };
    document.addEventListener('keydown', wrapper._escHandler);
}