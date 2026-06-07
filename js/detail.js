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
            articleDetail.innerHTML = `<div class="msg-error">文章不存在</div>`;
            return;
        }

        // 加载文章文件
        const response = await fetch(`../docs/article/${filename}`);
        if (!response.ok) {
            articleDetail.innerHTML = `<div class="msg-error">文章不存在</div>`;
            return;
        }

        const content = await response.text();
        const article = parseArticle(content, filename);

        if (!article) {
            articleDetail.innerHTML = `<div class="msg-error">文章解析失败</div>`;
            return;
        }

        // 渲染文章详情
        renderArticleDetail(article);

    } catch (error) {
        articleDetail.innerHTML = `<div class="msg-error">加载失败: ${error.message}</div>`;
    }
}

// 解析文章内容（复用 MarkdownParser 的 front matter 解析）
function parseArticle(content, filename) {
    const parser = new MarkdownParser();
    const { frontMatter, content: markdownContent } = parser.parseFrontMatter(content);

    // 统一 tags 为数组
    let tags = [];
    if (Array.isArray(frontMatter.tags)) {
        tags = frontMatter.tags;
    } else if (frontMatter.tags) {
        tags = frontMatter.tags.split(',').map(tag => tag.trim());
    }

    const authors = Array.isArray(frontMatter.authors) ? frontMatter.authors.join(', ') : (frontMatter.authors || '');

    // 构建文章对象
    return {
        title: frontMatter.title || '无标题',
        date: frontMatter.date || '',
        category: frontMatter.category || 'tech',
        tags: tags,
        authors: authors,
        content: markdownContent,
        filename: filename
    };
}

// 渲染文章详情
function renderArticleDetail(article) {
    const articleDetail = document.getElementById('article-detail');

    // 生成front matter的HTML
    let frontMatterHtml = '';
    if (article.title) {
        frontMatterHtml = '<div class="article-header">';

        if (article.title) {
            frontMatterHtml += `<h1 class="article-title">${article.title}</h1>`;
        }

        // 元信息行（复用公共函数）
        frontMatterHtml += buildMetaHtml({
            authors: article.authors,
            date: article.date,
            category: article.category,
            tags: article.tags
        });

        frontMatterHtml += '</div>';
    }

    // 创建 MarkdownParser 实例
    const parser = new MarkdownParser();

    // 渲染 Markdown
    const { html } = parser.render(article.content);

    // 插入渲染后的内容
    articleDetail.innerHTML = frontMatterHtml + '<div class="markdown-content">' + html + '</div>';

    // 应用代码高亮
    parser.applyHighlight();

    // 初始化标签切换功能
    parser.initTabs(articleDetail);

    // 生成右侧目录（使用setTimeout确保DOM已渲染）
    setTimeout(() => {
        generateToc();
        // 渲染 Mermaid 图表（懒加载）
        loadMermaidIfNeeded('../').then(loaded => {
            if (loaded) renderMermaid();
        });
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
            heading.setAttribute('id', 'heading-' + index);
        }
    });

    // 生成目录HTML
    let html = '';
    headings.forEach(heading => {
        const id = heading.getAttribute('id');
        const text = heading.textContent;
        const level = parseInt(heading.tagName.substring(1));
        const indentClass = level > 1 ? `toc-h${level}` : '';
        html += `<li class="${indentClass}"><a href="#${id}">${text}</a></li>`;
    });

    tocList.innerHTML = html;

    // 使用公共滚动监听函数
    initScrollSpy();
}

