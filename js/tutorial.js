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

        // 解析YAML front matter
        const frontMatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        let frontMatter = {};
        let contentToRender = markdown;

        if (frontMatterMatch) {
            const frontMatterText = frontMatterMatch[1];
            contentToRender = markdown.substring(frontMatterMatch[0].length);

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

        // 生成front matter的HTML
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

        // 初始化markdown-it
        const md = window.markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true,
            xhtmlOut: true,
            langPrefix: 'language-',
            quotes: '""\'\'',
            highlight: function (str, lang) {
                if (window.hljs && lang && window.hljs.getLanguage(lang)) {
                    try {
                        return '<pre><code class="hljs language-' + lang + '">' + window.hljs.highlight(str, { language: lang }).value + '</code></pre>';
                    } catch (__) {}
                }
                return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
            }
        });

        // 启用定义列表插件
        md.use(window.markdownitDeflist);
        
        // 先处理标签式代码块的Markdown语法
        let processedMarkdown = contentToRender;

        // 替换[tabs]和[tab]语法为HTML（先处理，避免与 ```python xxx 语法冲突）
        processedMarkdown = processedMarkdown.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/g, (match, content) => {
            // 提取带有name属性的代码块
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
                let codeHtml = md.utils.escapeHtml(block.code);
                // 应用代码高亮
                if (window.hljs && block.lang && window.hljs.getLanguage(block.lang)) {
                    try {
                        codeHtml = window.hljs.highlight(block.code, { language: block.lang }).value;
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

        // 添加标签切换功能，包括更新语言标签
        processedMarkdown += `<script>
// 为所有标签容器添加切换功能
function initTabs() {
    const codeTabs = document.querySelectorAll(".code-tabs");
    codeTabs.forEach(tabs => {
        const tabButtons = tabs.querySelectorAll(".code-tab");
        const tabContents = tabs.querySelectorAll(".tab-content");
        const languageElement = tabs.querySelector(".code-tabs-language");
        
        tabButtons.forEach((button, index) => {
            button.addEventListener("click", () => {
                // 移除所有标签的active类
                tabButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(content => content.classList.remove("active"));
                
                // 添加当前标签的active类
                button.classList.add("active");
                tabContents[index].classList.add("active");
                
                // 更新语言标签
                const lang = button.getAttribute("data-lang");
                console.log('Switching to language:', lang);
                languageElement.textContent = lang;
            });
        });
    });
}

// 当DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
} else {
    initTabs();
}
</script>`;

        // 处理 ```python name="xxx" 语法（单个代码块带标签名，不转换为tabs格式）
        // 支持中文、英文、数字、下划线组成的标签名（在 [tabs] 处理之后执行）
        processedMarkdown = processedMarkdown.replace(/```(\w+)\s+name="([^"]+)"[\r\n]+([\s\S]*?)```/g, (match, lang, tabName, code) => {
            // 转义标签名和代码内容
            const escapedTabName = md.utils.escapeHtml(tabName);
            let codeHtml = md.utils.escapeHtml(code);
            // 应用代码高亮
            if (window.hljs && lang && window.hljs.getLanguage(lang)) {
                try {
                    codeHtml = window.hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    // 高亮失败，使用原代码
                }
            }
            // 生成HTML结构，标签名在左侧，语言在右侧
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
            let codeHtml = md.utils.escapeHtml(code);
            // 应用代码高亮
            if (window.hljs && lang && window.hljs.getLanguage(lang)) {
                try {
                    codeHtml = window.hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    // 高亮失败，使用原代码
                }
            }
            // 生成HTML结构，包含语言显示和复制按钮
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

        // 渲染处理后的Markdown
        const html = md.render(processedMarkdown);
        contentDiv.innerHTML = frontMatterHtml + html;
        
        // 应用代码高亮
        if (window.hljs) {
            window.hljs.highlightAll();
        }
        
        // 添加标签切换事件
        setTimeout(() => {
            const tabElements = contentDiv.querySelectorAll('.code-tab');
            tabElements.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabIndex = tab.getAttribute('data-tab');
                    const codeTabs = tab.closest('.code-tabs');
                    
                    // 移除所有标签的active类
                    codeTabs.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                    codeTabs.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                    
                    // 添加当前标签的active类
                    tab.classList.add('active');
                    codeTabs.querySelector(`.tab-content[data-tab="${tabIndex}"]`).style.display = 'block';
                    
                    // 更新语言标签
                    const languageElement = codeTabs.querySelector('.code-tabs-language');
                    const lang = tab.getAttribute('data-lang');
                    console.log('Switching to language:', lang);
                    languageElement.textContent = lang;
                });
            });
            
            // 初始化标签内容显示
            contentDiv.querySelectorAll('.code-tabs').forEach(tabs => {
                const tabContents = tabs.querySelectorAll('.tab-content');
                tabContents.forEach((content, index) => {
                    content.style.display = index === 0 ? 'block' : 'none';
                });
            });
        }, 100);
        
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
    if (window.hljs && window.hljs.getLanguage(newLang)) {
        try {
            const highlightedCode = window.hljs.highlight(code, { language: newLang }).value;
            codeBlock.innerHTML = highlightedCode;
        } catch (e) {
            // 高亮失败，使用原代码
            codeBlock.textContent = code;
        }
    } else {
        // 语言不支持，使用原代码
        codeBlock.textContent = code;
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async () => {
    await loadNavigation();
    await loadMarkdown();
});