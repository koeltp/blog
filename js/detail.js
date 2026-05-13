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