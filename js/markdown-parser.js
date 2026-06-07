/**
 * Markdown 解析器 - 通用的 Markdown 解析库
 * 支持：
 * - 标准 Markdown 语法
 * - 定义列表
 * - 标签式代码块 ([tabs] 语法)
 * - 带标签名的代码块 (```language name="xxx" 语法)
 * - 代码高亮
 * - 代码复制功能
 * - 标签切换功能
 * - Mermaid 图表渲染
 */

class MarkdownParser {
    constructor(options = {}) {
        this.options = {
            html: true,
            linkify: true,
            typographer: true,
            breaks: true,
            xhtmlOut: true,
            langPrefix: 'language-',
            quotes: '""\'\'',
            ...options
        };
        this.md = null;
        // 占位符存储，用于保护代码块 HTML 不被 markdown-it 转义
        this._placeholders = [];
        this.init();
    }

    /**
     * 初始化 markdown-it 实例
     */
    init() {
        if (!window.markdownit) {
            console.error('Error: markdown-it library is not loaded');
            return;
        }

        // 配置 highlight.js 忽略未转义 HTML 警告
        if (window.hljs) {
            window.hljs.configure({ ignoreUnescapedHTML: true });
        }

        // 初始化 markdown-it
        this.md = window.markdownit(this.options);

        // 启用定义列表插件
        if (window.markdownitDeflist) {
            this.md.use(window.markdownitDeflist);
        }

        // 自定义 fence 渲染器：处理 mermaid 图表和普通代码块
        const defaultFence = this.md.renderer.rules.fence.bind(this.md.renderer.rules);

        this.md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
            const token = tokens[idx];
            const info = token.info ? token.info.trim() : '';
            const lang = info.split(/\s+/)[0];

            // mermaid 代码块渲染为带控制栏的图表容器
            // 内容存到 data-mermaid 属性，避免浏览器将 <<interface>> 等语法当作 HTML 标签解析
            if (lang === 'mermaid') {
                const escaped = this.md.utils.escapeHtml(token.content);
                return `<div class="mermaid-wrapper">
<div class="mermaid-toolbar">
<div class="mermaid-tabs"><span class="mermaid-tab active" data-view="diagram">图表</span><span class="mermaid-tab" data-view="code">代码</span></div>
<div class="mermaid-actions">
<button class="mermaid-action" data-action="zoom-in" title="放大">+</button>
<button class="mermaid-action" data-action="zoom-out" title="缩小">-</button>
<button class="mermaid-action" data-action="download" title="下载">↓</button>
<button class="mermaid-action" data-action="fullscreen" title="全屏">⛶</button>
</div>
</div>
<div class="mermaid-diagram"><div class="mermaid" data-mermaid="${escaped}"></div></div>
<pre class="mermaid-source"><code>${escaped}</code></pre>
</div>`;
            }

            // 其他语言：生成带复制按钮和高亮的代码块
            let codeHtml = this.md.utils.escapeHtml(token.content);
            if (window.hljs && lang && window.hljs.getLanguage && window.hljs.getLanguage(lang)) {
                try {
                    codeHtml = window.hljs.highlight(token.content, { language: lang }).value;
                } catch (e) {
                    // 高亮失败，使用转义后的代码
                }
            }

            return `<div class="single-code-block">
<div class="single-code-header">
<div class="tab-name"></div>
<div class="language-label">${lang}</div>
</div>
<div class="code-with-copy">
<pre><code class="hljs language-${lang}">${codeHtml}</code></pre>
<button class="copy-button">复制</button>
</div>
</div>`;
        };
    }

    /**
     * 解析 YAML front matter
     * @param {string} markdown - Markdown 内容
     * @returns {object} 包含 front matter 和内容的对象
     */
    parseFrontMatter(markdown) {
        const frontMatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        let frontMatter = {};
        let contentToRender = markdown;

        if (frontMatterMatch) {
            const frontMatterText = frontMatterMatch[1];
            contentToRender = markdown.substring(frontMatterMatch[0].length);

            // 解析 front matter 字段（支持多行值）
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
                            frontMatter[currentKey] = currentValue[0];
                        } else {
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

        return { frontMatter, content: contentToRender };
    }

    /**
     * 生成 front matter 的 HTML
     * @param {object} frontMatter - front matter 对象
     * @returns {string} HTML 字符串
     */
    generateFrontMatterHtml(frontMatter) {
        let frontMatterHtml = '';
        if (frontMatter.title || frontMatter.summary || frontMatter.authors || frontMatter.date) {
            frontMatterHtml = '<div class="article-header">';

            if (frontMatter.title) {
                frontMatterHtml += `<h1 class="article-title">${frontMatter.title}</h1>`;
            }

            if (frontMatter.summary) {
                frontMatterHtml += `<p class="article-summary">${frontMatter.summary}</p>`;
            }

            // 元信息行（复用公共函数）
            frontMatterHtml += buildMetaHtml({
                authors: frontMatter.authors,
                date: frontMatter.date,
                category: frontMatter.category,
                tags: frontMatter.tags
            });

            frontMatterHtml += '</div>';
        }
        return frontMatterHtml;
    }

    /**
     * 将 HTML 存入占位符，避免被 markdown-it 转义
     * @param {string} html - 需要保护的 HTML
     * @returns {string} 占位符标记
     */
    _addPlaceholder(html) {
        const index = this._placeholders.length;
        this._placeholders.push(html);
        // 使用 HTML 注释作为占位符，markdown-it 在 html:true 模式下会保留
        return `<!--MDPH_${index}-->`;
    }

    /**
     * 处理自定义 Markdown 语法（tabs、带标签名代码块）
     * 使用占位符保护生成的 HTML，防止被 markdown-it 二次转义
     * @param {string} markdown - Markdown 内容
     * @returns {string} 处理后的 Markdown 内容
     */
    processMarkdown(markdown) {
        let processedMarkdown = markdown;
        this._placeholders = [];

        // 替换 [tabs] 和 [tab] 语法为占位符
        processedMarkdown = processedMarkdown.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/g, (match, content) => {
            const codeBlocks = [];
            const codeBlockRegex = /```(\w+)\s+name="([^"]+)"[\r\n]+([\s\S]*?)```/g;
            let matchBlock;

            while ((matchBlock = codeBlockRegex.exec(content)) !== null) {
                codeBlocks.push({
                    lang: matchBlock[1],
                    name: matchBlock[2],
                    code: matchBlock[3]
                });
            }

            if (codeBlocks.length === 0) return match;

            let tabsHtml = '<div class="code-tabs">';
            tabsHtml += '<div class="code-tabs-header">';

            codeBlocks.forEach((block, index) => {
                tabsHtml += `<div class="code-tab ${index === 0 ? 'active' : ''}" data-tab="${index}" data-lang="${block.lang}"><span class="tab-name">${block.name}</span></div>`;
            });

            const firstLang = codeBlocks[0].lang || 'plaintext';
            tabsHtml += `<div class="code-tabs-language">${firstLang}</div>`;
            tabsHtml += '</div>';
            tabsHtml += '<div class="code-tabs-content">';

            codeBlocks.forEach((block, index) => {
                let codeHtml = this.md.utils.escapeHtml(block.code);
                if (window.hljs && block.lang && window.hljs.getLanguage && window.hljs.getLanguage(block.lang)) {
                    try {
                        codeHtml = window.hljs.highlight(block.code, { language: block.lang }).value;
                    } catch (e) { /* 高亮失败 */ }
                }

                const renderedContent = `<div class="code-with-copy">
<pre><code class="hljs language-${block.lang}">${codeHtml}</code></pre>
<button class="copy-button">复制</button>
</div>`;

                tabsHtml += `<div class="tab-content ${index === 0 ? 'active' : ''}" data-tab="${index}">${renderedContent}</div>`;
            });

            tabsHtml += '</div></div>';
            return this._addPlaceholder(tabsHtml);
        });

        // 处理 ```python name="xxx" 语法（带标签名的单个代码块）
        processedMarkdown = processedMarkdown.replace(/```(\w+)\s+name="([^"]+)"[\r\n]+([\s\S]*?)```/g, (match, lang, tabName, code) => {
            const escapedTabName = this.md.utils.escapeHtml(tabName);
            let codeHtml = this.md.utils.escapeHtml(code);
            if (window.hljs && lang && window.hljs.getLanguage && window.hljs.getLanguage(lang)) {
                try {
                    codeHtml = window.hljs.highlight(code, { language: lang }).value;
                } catch (e) { /* 高亮失败 */ }
            }

            const html = `<div class="single-code-block">
<div class="single-code-header">
<div class="tab-name">${escapedTabName}</div>
<div class="language-label">${lang}</div>
</div>
<div class="code-with-copy">
<pre><code class="hljs language-${lang}">${codeHtml}</code></pre>
<button class="copy-button">复制</button>
</div>
</div>`;
            return this._addPlaceholder(html);
        });

        return processedMarkdown;
    }

    /**
     * 将占位符还原为实际 HTML
     * @param {string} html - 含占位符的 HTML
     * @returns {string} 还原后的 HTML
     */
    _restorePlaceholders(html) {
        return html.replace(/<!--MDPH_(\d+)-->/g, (match, index) => {
            return this._placeholders[parseInt(index)] || '';
        });
    }

    /**
     * 渲染 Markdown 内容
     * @param {string} markdown - Markdown 内容
     * @returns {object} 包含 HTML 和 front matter 的对象
     */
    render(markdown) {
        if (!this.md) {
            return { html: '<div class="msg-error">Markdown 解析器初始化失败</div>', frontMatter: {} };
        }

        // 解析 front matter
        const { frontMatter, content } = this.parseFrontMatter(markdown);

        // 处理自定义语法（tabs、带标签名代码块），生成占位符
        const processedMarkdown = this.processMarkdown(content);

        // 渲染 Markdown（fence 渲染器处理 mermaid 和普通代码块）
        let html = this.md.render(processedMarkdown);

        // 还原占位符为实际 HTML
        html = this._restorePlaceholders(html);

        // 生成 front matter HTML
        const frontMatterHtml = this.generateFrontMatterHtml(frontMatter);

        return { html, frontMatter, frontMatterHtml };
    }

    /**
     * 初始化标签切换功能
     * @param {HTMLElement} container - 容器元素
     */
    initTabs(container) {
        const codeTabs = container.querySelectorAll(".code-tabs");
        codeTabs.forEach(tabs => {
            const tabButtons = tabs.querySelectorAll(".code-tab");
            const tabContents = tabs.querySelectorAll(".tab-content");
            const languageElement = tabs.querySelector(".code-tabs-language");

            tabButtons.forEach((button, index) => {
                button.addEventListener("click", () => {
                    tabButtons.forEach(btn => btn.classList.remove("active"));
                    tabContents.forEach(content => {
                        content.classList.remove("active");
                        content.style.display = 'none';
                    });

                    button.classList.add("active");
                    tabContents[index].classList.add("active");
                    tabContents[index].style.display = 'block';

                    const lang = button.getAttribute("data-lang");
                    if (languageElement) {
                        languageElement.textContent = lang;
                    }
                });
            });

            tabContents.forEach((content, index) => {
                content.style.display = index === 0 ? 'block' : 'none';
            });
        });
    }

    /**
     * 应用代码高亮（仅处理未被 fence 渲染器高亮的代码块）
     */
    applyHighlight() {
        if (!window.hljs) return;
        document.querySelectorAll('pre code:not(.hljs)').forEach(el => {
            hljs.highlightElement(el);
        });
    }
}

// 复制代码功能（事件委托）
document.addEventListener('click', function(e) {
    const button = e.target.closest('.copy-button');
    if (!button) return;
    const codeBlock = button.parentElement.querySelector('code');
    if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.textContent).then(() => {
            button.textContent = '已复制!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = '复制';
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            button.textContent = '复制失败';
            setTimeout(() => {
                button.textContent = '复制';
            }, 2000);
        });
    }
});

// 导出
window.MarkdownParser = MarkdownParser;

// Mermaid 懒加载：检测页面中是否有 .mermaid 元素，有则动态加载 mermaid 库
// 使用 ESM 动态 import 加载 Mermaid 11.x（支持 block-beta 等新图表类型）
window.loadMermaidIfNeeded = function(basePath) {
    const mermaidElements = document.querySelectorAll('.mermaid');
    if (mermaidElements.length === 0) {
        return Promise.resolve(false);
    }

    if (window.mermaid) {
        return Promise.resolve(true);
    }

    // 优先从 CDN 加载 ESM 版本，失败则回退到本地 IIFE 版本
    return import('https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.esm.min.mjs')
        .then(module => {
            window.mermaid = module.default || module;
            return true;
        })
        .catch(() => {
            // CDN 加载失败，回退到本地 10.6.1 IIFE 版本
            const prefix = basePath || '';
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = `${prefix}vendor/mermaid/mermaid.min.js`;
                script.onload = () => resolve(true);
                script.onerror = () => {
                    console.warn('Mermaid 库加载失败');
                    resolve(false);
                };
                document.head.appendChild(script);
            });
        });
};

// 渲染 Mermaid 图表（懒加载后调用）
window.renderMermaid = function() {
    if (!window.mermaid) return;

    // 从 data-mermaid 属性还原原始内容到元素文本，避免浏览器解析 <<interface>> 等
    document.querySelectorAll('.mermaid[data-mermaid]').forEach(el => {
        const decoded = el.getAttribute('data-mermaid')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        el.textContent = decoded;
        el.removeAttribute('data-mermaid');
    });

    try {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'default'
        });
        // 使用 mermaid.run()，它自带错误展示（SVG 风格）
        mermaid.run({ querySelector: '.mermaid' }).then(() => {
            setTimeout(() => {
                if (typeof initMermaidInteractions === 'function') {
                    initMermaidInteractions();
                }
            }, 300);
        }).catch(e => {
            // mermaid.run() 内部已处理单个图表错误，此处仅捕获整体初始化异常
            console.warn('Mermaid 运行异常:', e);
        });
    } catch (e) {
        console.warn('Mermaid 初始化失败:', e);
    }
};

/**
 * 初始化 Mermaid 图表交互功能
 * 支持：图表/代码切换、放大缩小、下载、全屏
 * 从 detail.js/tutorial.js 提取的公共逻辑
 */
window.initMermaidInteractions = function() {
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
};

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
