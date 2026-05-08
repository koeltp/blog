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

        // 初始化 markdown-it
        this.md = window.markdownit(this.options);

        // 启用定义列表插件
        if (window.markdownitDeflist) {
            this.md.use(window.markdownitDeflist);
        }
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
                            // 单行值
                            frontMatter[currentKey] = currentValue[0];
                        } else {
                            // 多行值（如 authors 数组）
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
                    // 处理多行值（如 authors 数组）
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
     * 处理标签式代码块的 Markdown 语法
     * @param {string} markdown - Markdown 内容
     * @returns {string} 处理后的 Markdown 内容
     */
    processMarkdown(markdown) {
        let processedMarkdown = markdown;

        // 替换 [tabs] 和 [tab] 语法为 HTML（先处理，避免与 ```python xxx 语法冲突）
        processedMarkdown = processedMarkdown.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/g, (match, content) => {
            // 提取带有 name 属性的代码块
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

            // 生成标签头部
            codeBlocks.forEach((block, index) => {
                tabsHtml += `<div class="code-tab ${index === 0 ? 'active' : ''}" data-tab="${index}" data-lang="${block.lang}"><span class="tab-name">${block.name}</span></div>`;
            });

            // 在标签行右侧添加语言标签
            const firstLang = codeBlocks[0].lang || 'plaintext';
            tabsHtml += `<div class="code-tabs-language">${firstLang}</div>`;

            tabsHtml += '</div>';
            tabsHtml += '<div class="code-tabs-content">';

            // 生成标签内容
            codeBlocks.forEach((block, index) => {
                // 渲染代码块
                let codeHtml = this.md.utils.escapeHtml(block.code);
                // 应用代码高亮
                if (window.hljs && block.lang && window.hljs.getLanguage) {
                    try {
                        if (window.hljs.getLanguage(block.lang)) {
                            codeHtml = window.hljs.highlight(block.code, { language: block.lang }).value;
                        }
                    } catch (e) {
                        // 高亮失败，使用原代码
                    }
                }

                const renderedContent = `<div class="code-with-copy">
<pre><code class="hljs language-${block.lang}">${codeHtml}</code></pre>
<button class="copy-button" onclick="copyCode(this)">复制</button>
</div>`;

                tabsHtml += `<div class="tab-content ${index === 0 ? 'active' : ''}" data-tab="${index}">${renderedContent}</div>`;
            });

            tabsHtml += '</div>';
            tabsHtml += '</div>';

            return tabsHtml;
        });

        // 处理 ```python name="xxx" 语法（单个代码块带标签名，不转换为 tabs 格式）
        // 支持中文、英文、数字、下划线组成的标签名（在 [tabs] 处理之后执行）
        processedMarkdown = processedMarkdown.replace(/```(\w+)\s+name="([^"]+)"[\r\n]+([\s\S]*?)```/g, (match, lang, tabName, code) => {
            // 转义标签名和代码内容
            const escapedTabName = this.md.utils.escapeHtml(tabName);
            let codeHtml = this.md.utils.escapeHtml(code);
            // 应用代码高亮
            if (window.hljs && lang && window.hljs.getLanguage) {
                try {
                    if (window.hljs.getLanguage(lang)) {
                        codeHtml = window.hljs.highlight(code, { language: lang }).value;
                    }
                } catch (e) {
                    // 高亮失败，使用原代码
                }
            }
            // 生成 HTML 结构，标签名在左侧，语言在右侧
            return `<div class="single-code-block">
<div class="single-code-header">
<div class="tab-name">${escapedTabName}</div>
<div class="language-label">${lang}</div>
</div>
<div class="code-with-copy">
<pre><code class="hljs language-${lang}">${codeHtml}</code></pre>
<button class="copy-button" onclick="copyCode(this)">复制</button>
</div>
</div>`;
        });

        // 处理普通的 ```language 代码块（没有标签名）
        processedMarkdown = processedMarkdown.replace(/```(\w+)[\r\n]+([\s\S]*?)```/g, (match, lang, code) => {
            // 转义代码内容
            let codeHtml = this.md.utils.escapeHtml(code);
            // 应用代码高亮
            if (window.hljs && lang && window.hljs.getLanguage) {
                try {
                    if (window.hljs.getLanguage(lang)) {
                        codeHtml = window.hljs.highlight(code, { language: lang }).value;
                    }
                } catch (e) {
                    // 高亮失败，使用原代码
                }
            }
            // 生成 HTML 结构，包含语言显示和复制按钮
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
        });

        return processedMarkdown;
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

        // 处理 Markdown 语法
        const processedMarkdown = this.processMarkdown(content);

        // 渲染 Markdown
        const html = this.md.render(processedMarkdown);

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
                    // 移除所有标签的 active 类并隐藏内容
                    tabButtons.forEach(btn => btn.classList.remove("active"));
                    tabContents.forEach(content => {
                        content.classList.remove("active");
                        content.style.display = 'none';
                    });

                    // 添加当前标签的 active 类并显示内容
                    button.classList.add("active");
                    tabContents[index].classList.add("active");
                    tabContents[index].style.display = 'block';

                    // 更新语言标签
                    const lang = button.getAttribute("data-lang");
                    if (languageElement) {
                        languageElement.textContent = lang;
                    }
                });
            });

            // 初始化标签内容显示
            tabContents.forEach((content, index) => {
                content.style.display = index === 0 ? 'block' : 'none';
            });
        });
    }

    /**
     * 应用代码高亮
     */
    applyHighlight() {
        if (window.hljs) {
            window.hljs.highlightAll();
        }
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

    // 更新语言类
    codeBlock.className = `hljs language-${newLang}`;
    preElement.className = `language-${newLang}`;

    // 重新应用代码高亮
    if (window.hljs && window.hljs.getLanguage) {
        try {
            if (window.hljs.getLanguage(newLang)) {
                const highlightedCode = window.hljs.highlight(code, { language: newLang }).value;
                codeBlock.innerHTML = highlightedCode;
            }
        } catch (e) {
            // 高亮失败，使用原代码
            codeBlock.textContent = code;
        }
    } else {
        // 语言不支持，使用原代码
        codeBlock.textContent = code;
    }
}

// 导出 MarkdownParser 类
window.MarkdownParser = MarkdownParser;
window.copyCode = copyCode;
window.changeLanguage = changeLanguage;