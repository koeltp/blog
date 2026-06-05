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
            if (lang === 'mermaid') {
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
<div class="mermaid-diagram"><div class="mermaid">\n${token.content}\n</div></div>
<pre class="mermaid-source" style="display:none"><code>${this.md.utils.escapeHtml(token.content)}</code></pre>
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
<button class="copy-button" onclick="copyCode(this)">复制</button>
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
                frontMatterHtml += `<div class="article-title">${frontMatter.title}</div>`;
            }

            if (frontMatter.summary) {
                frontMatterHtml += `<p class="article-summary">${frontMatter.summary}</p>`;
            }

            const metaParts = [];
            if (frontMatter.authors) {
                const authors = Array.isArray(frontMatter.authors) ? frontMatter.authors.join(', ') : frontMatter.authors;
                metaParts.push(`作者：${authors}`);
            }
            if (frontMatter.date) {
                metaParts.push(`发布日期：${frontMatter.date}`);
            }
            if (metaParts.length > 0) {
                frontMatterHtml += `<div class="article-meta">${metaParts.join(' &nbsp;|&nbsp; ')}</div>`;
            }

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
<button class="copy-button" onclick="copyCode(this)">复制</button>
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
<button class="copy-button" onclick="copyCode(this)">复制</button>
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
            return { html: '<div style="color: red;">Markdown 解析器初始化失败</div>', frontMatter: {} };
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

// 复制代码功能
function copyCode(button) {
    const codeBlock = button.parentElement.querySelector('code');
    if (codeBlock) {
        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(() => {
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
}

// 切换语言功能
function changeLanguage(selectElement, code) {
    const newLang = selectElement.value;
    const codeBlock = selectElement.closest('.single-code-block').querySelector('code');
    const preElement = codeBlock.parentElement;

    codeBlock.className = `hljs language-${newLang}`;
    preElement.className = `language-${newLang}`;

    if (window.hljs && window.hljs.getLanguage && window.hljs.getLanguage(newLang)) {
        try {
            const highlightedCode = window.hljs.highlight(code, { language: newLang }).value;
            codeBlock.innerHTML = highlightedCode;
        } catch (e) {
            codeBlock.textContent = code;
        }
    } else {
        codeBlock.textContent = code;
    }
}

// 导出
window.MarkdownParser = MarkdownParser;
window.copyCode = copyCode;
window.changeLanguage = changeLanguage;
