import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'
import markdownItDeflist from 'markdown-it-deflist'

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'TaiPi - TaiPi.Top',
  description: '技术教程与生活分享，涵盖 .NET、Flutter、LangChain、Docker 等技术领域',

  source: 'src',
  dest: 'dist',

  head: [
    ['link', { rel: 'icon', href: '/img/logo/logo.png' }],
    ['meta', { name: 'keywords', content: 'TaiPi,技术教程,编程,.NET,Flutter,LangChain,Docker,周易' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
  ],

  bundler: viteBundler(),

  theme: defaultTheme({
    logo: '/img/logo/logo.png',
    navbar: false,
    sidebar: false,
    editLink: false,
    lastUpdated: false,
    contributors: false,
  }),

  // 自定义 Markdown 扩展
  extendsMarkdown: (md) => {
    // 定义列表插件
    md.use(markdownItDeflist)

    // 自定义图片语法：![alt|宽x高](url) 或 ![alt|宽](url) 或 ![alt|x高](url) 或 ![alt|80%](url)
    const defaultImage = md.renderer.rules.image.bind(md.renderer.rules)
    md.renderer.rules.image = (tokens, idx, options, env, slf) => {
      const token = tokens[idx]
      const alt = token.content || ''
      const pipeIdx = alt.indexOf('|')
      if (pipeIdx === -1) return defaultImage(tokens, idx, options, env, slf)

      // 解析尺寸参数
      token.content = alt.slice(0, pipeIdx)
      const sizeStr = alt.slice(pipeIdx + 1)
      let style = ''
      const pxMatch = sizeStr.match(/^(\d*)(?:x(\d+))?$/)
      const pctMatch = sizeStr.match(/^(\d+%)$/)

      if (pxMatch) {
        if (pxMatch[1]) style += `max-width:${pxMatch[1]}px;`
        if (pxMatch[2]) style += `max-height:${pxMatch[2]}px;`
      } else if (pctMatch) {
        style += `max-width:${pctMatch[1]};`
      }

      const html = defaultImage(tokens, idx, options, env, slf)
      return style ? html.replace('<img', `<img style="${style}"`) : html
    }

    // 自定义 fence 渲染器：处理 mermaid 图表
    const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)

    md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
      const token = tokens[idx]
      const info = token.info ? token.info.trim() : ''
      const lang = info.split(/\s+/)[0]

      // mermaid 代码块渲染为带控制栏的图表容器
      if (lang === 'mermaid') {
        const escaped = md.utils.escapeHtml(token.content)
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
</div>`
      }

      // 默认渲染（title= 语法由 VuePress 内置 codeBlockTitle 插件处理）
      return defaultFence(tokens, idx, options, env, slf)
    }
  },

  plugins: [],
})
