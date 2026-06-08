import { defineClientConfig } from '@vuepress/client'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './components/Layout.vue'
import TutorialLayout from './components/TutorialLayout.vue'
import Home from './components/Home.vue'
import Tutorials from './components/Tutorials.vue'
import Articles from './components/Articles.vue'
import Search from './components/Search.vue'
import SvgIcon from './components/SvgIcon.vue'
import About from './components/About.vue'
import './styles/index.css'

// 初始化 Mermaid 图表渲染
async function initMermaid() {
  const mermaidElements = document.querySelectorAll('.mermaid')
  if (mermaidElements.length === 0) return

  try {
    const mermaid = await import('mermaid')
    const m = mermaid.default || mermaid
    m.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
    })

    // 从 data-mermaid 属性还原原始内容
    document.querySelectorAll('.mermaid[data-mermaid]').forEach(el => {
      const decoded = el.getAttribute('data-mermaid')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      el.textContent = decoded
      el.removeAttribute('data-mermaid')
    })

    await m.run({ querySelector: '.mermaid' })
    initMermaidInteractions()
  } catch (e) {
    console.warn('Mermaid 加载失败:', e)
  }
}

// Mermaid 图表交互功能
function initMermaidInteractions() {
  document.querySelectorAll('.mermaid-wrapper').forEach(wrapper => {
    const diagram = wrapper.querySelector('.mermaid-diagram')
    const source = wrapper.querySelector('.mermaid-source')
    const svg = diagram?.querySelector('svg')
    if (!svg) return

    // 保存基础尺寸
    const viewBox = svg.getAttribute('viewBox')
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/)
      svg._baseWidth = parseFloat(parts[2])
      svg._baseHeight = parseFloat(parts[3])
    } else {
      svg._baseWidth = svg.clientWidth || 800
      svg._baseHeight = svg.clientHeight || 400
    }
    svg._currentScale = 1

    // 图表/代码切换
    wrapper.querySelectorAll('.mermaid-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.mermaid-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        if (tab.dataset.view === 'diagram') {
          diagram.style.display = ''
          source.style.display = 'none'
        } else {
          diagram.style.display = 'none'
          source.style.display = ''
        }
      })
    })

    // 操作按钮
    wrapper.querySelectorAll('.mermaid-action').forEach(btn => {
      btn.addEventListener('click', () => {
        switch (btn.dataset.action) {
          case 'zoom-in':
            svg._currentScale = Math.min(5, svg._currentScale + 0.2)
            svg.style.transform = `scale(${svg._currentScale})`
            svg.style.transformOrigin = 'center'
            break
          case 'zoom-out':
            svg._currentScale = Math.max(0.3, svg._currentScale - 0.2)
            svg.style.transform = `scale(${svg._currentScale})`
            svg.style.transformOrigin = 'center'
            break
          case 'download': {
            const svgData = new XMLSerializer().serializeToString(svg)
            const blob = new Blob([svgData], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'mermaid-diagram.svg'
            a.click()
            URL.revokeObjectURL(url)
            break
          }
          case 'fullscreen':
            wrapper.classList.toggle('fullscreen')
            break
        }
      })
    })
  })
}

// 初始化代码复制功能
function initCopyButtons() {
  document.querySelectorAll('.copy-button').forEach(btn => {
    if (btn._bound) return
    btn._bound = true
    btn.addEventListener('click', () => {
      const codeBlock = btn.parentElement?.querySelector('code')
      if (!codeBlock) return
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        btn.textContent = '已复制!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = '复制'
          btn.classList.remove('copied')
        }, 2000)
      }).catch(() => {
        btn.textContent = '复制失败'
        setTimeout(() => { btn.textContent = '复制' }, 2000)
      })
    })
  })
}

// 为普通代码块添加与标签代码块一致的头部栏
// 布局：左侧 title（如有） | 右侧 语言 + copy 图标
function initCodeBlockHeaders() {
  const contentContainer = document.querySelector('.content-container')
  if (!contentContainer) return

  const contentDiv = contentContainer.querySelector(':scope > div:not(.article-meta-header):not(.prev-next-nav)')
  if (!contentDiv) return

  // 构建 header 的通用函数
  function buildHeader(title, lang, codeEl) {
    const headerDiv = document.createElement('div')
    headerDiv.className = 'code-block-header'

    // 左侧：title 或 语言|copy（无 title 时）

    const titleSpan = document.createElement('span')
    titleSpan.className = 'code-block-title'
    titleSpan.textContent = title
    headerDiv.appendChild(titleSpan)

    // 右侧：语言 | copy
    const actionsDiv = document.createElement('div')
    actionsDiv.className = 'code-block-actions'

    const langSpan = document.createElement('span')
    langSpan.className = 'code-block-lang'
    langSpan.textContent = lang

    const separator = document.createElement('span')
    separator.className = 'code-block-separator'
    separator.textContent = '|'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-block-copy'
    copyBtn.title = '复制代码'
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'

    actionsDiv.appendChild(langSpan)
    actionsDiv.appendChild(separator)
    actionsDiv.appendChild(copyBtn)
    headerDiv.appendChild(actionsDiv)

    // Copy 点击
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent)
        copyBtn.classList.add('copied')
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg>'
        setTimeout(() => {
          copyBtn.classList.remove('copied')
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    })


    return headerDiv
  }

  // 处理不在 code-tabs 内的 code-block-with-title（单个带标题的代码块）
  contentDiv.querySelectorAll('.code-block-with-title').forEach(block => {
    if (block.closest('.code-tabs')) return

    const titleBar = block.querySelector('.code-block-title-bar')
    const title = titleBar?.getAttribute('data-title') || titleBar?.textContent?.trim() || ''
    const codeEl = block.querySelector('code')
    if (!codeEl) return

    const lang = codeEl.className.replace('language-', '') || 'plaintext'

    // 移除原有标题栏
    if (titleBar) titleBar.remove()

    const headerDiv = buildHeader(title, lang, codeEl)

    // 用 wrapper 包裹
    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'

    block.parentElement.insertBefore(wrapper, block)

    const codeBlock = block.querySelector('div[class*="language-"]')
    if (codeBlock) {
      wrapper.appendChild(headerDiv)
      wrapper.appendChild(codeBlock)
    } else {
      wrapper.appendChild(headerDiv)
      while (block.firstChild) {
        wrapper.appendChild(block.firstChild)
      }
    }
    block.remove()
  })

  // 处理普通代码块（无 title）
  contentDiv.querySelectorAll('div[class*="language-"]').forEach(codeBlock => {
    if (codeBlock.closest('.code-block-wrapper') || codeBlock.closest('.code-tabs') || codeBlock.closest('.code-block-with-title') || codeBlock.closest('.mermaid-wrapper')) return

    const codeEl = codeBlock.querySelector('code')
    if (!codeEl) return

    const lang = codeEl.className.replace('language-', '') || codeBlock.className.match(/language-(\w+)/)?.[1] || 'plaintext'

    const headerDiv = buildHeader('', lang, codeEl)

    // 用 wrapper 包裹
    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'

    codeBlock.parentElement.insertBefore(wrapper, codeBlock)
    wrapper.appendChild(headerDiv)
    wrapper.appendChild(codeBlock)
  })
}

// 初始化标签切换功能
function initTabs() {
  document.querySelectorAll('.code-tabs').forEach(tabs => {
    const tabButtons = tabs.querySelectorAll('.code-tab')
    const tabContents = tabs.querySelectorAll('.tab-content')
    const languageElement = tabs.querySelector('.code-tabs-language')

    tabButtons.forEach((button, index) => {
      if (button._bound) return
      button._bound = true
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'))
        tabContents.forEach(content => {
          content.classList.remove('active')
          content.style.display = 'none'
        })
        button.classList.add('active')
        tabContents[index].classList.add('active')
        tabContents[index].style.display = 'block'
        const lang = button.getAttribute('data-lang')
        if (languageElement) languageElement.textContent = lang
      })
    })

    tabContents.forEach((content, index) => {
      content.style.display = index === 0 ? 'block' : 'none'
    })
  })
}

// 将连续的 code-block-with-title 合并为可切换标签页
function initCodeTabs() {
  const contentContainer = document.querySelector('.content-container')
  if (!contentContainer) return

  const contentDiv = contentContainer.querySelector(':scope > div:not(.article-meta-header):not(.prev-next-nav)')
  if (!contentDiv) return

  // 收集连续的 code-block-with-title 分组
  const childNodes = Array.from(contentDiv.children)
  let groups = []
  let currentGroup = []

  childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('code-block-with-title')) {
      currentGroup.push(node)
    } else {
      if (currentGroup.length > 1) {
        groups.push([...currentGroup])
      }
      currentGroup = []
    }
  })
  if (currentGroup.length > 1) {
    groups.push([...currentGroup])
  }

  // 为每组构建标签页
  groups.forEach(group => {
    const tabsDiv = document.createElement('div')
    tabsDiv.className = 'code-tabs'

    const headerDiv = document.createElement('div')
    headerDiv.className = 'code-tabs-header'

    // 左侧：tab 名称区域
    const tabListDiv = document.createElement('div')
    tabListDiv.className = 'code-tabs-list'

    // 右侧：语言 + copy 按钮
    const actionsDiv = document.createElement('div')
    actionsDiv.className = 'code-tabs-actions'

    const langSpan = document.createElement('span')
    langSpan.className = 'code-tabs-language'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-tabs-copy'
    copyBtn.title = '复制代码'
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'

    actionsDiv.appendChild(langSpan)

    const separator = document.createElement('span')
    separator.className = 'code-tabs-separator'
    separator.textContent = '|'
    actionsDiv.appendChild(separator)

    actionsDiv.appendChild(copyBtn)

    headerDiv.appendChild(tabListDiv)
    headerDiv.appendChild(actionsDiv)

    const tabsContentDiv = document.createElement('div')
    tabsContentDiv.className = 'code-tabs-content'

    // 收集每个 tab 的信息
    const tabInfos = []

    group.forEach((block, i) => {
      const titleBar = block.querySelector('.code-block-title-bar')
      const title = titleBar?.getAttribute('data-title') || titleBar?.textContent?.trim() || `Tab ${i + 1}`
      const codeEl = block.querySelector('code')
      const lang = codeEl?.className?.replace('language-', '') || 'plaintext'

      tabInfos.push({ title, lang })

      // 标签按钮
      const tabBtn = document.createElement('div')
      tabBtn.className = `code-tab${i === 0 ? ' active' : ''}`
      tabBtn.dataset.tab = i
      tabBtn.innerHTML = `<span class="tab-name">${title}</span>`
      tabListDiv.appendChild(tabBtn)

      // 内容区域
      const contentItem = document.createElement('div')
      contentItem.className = `tab-content${i === 0 ? ' active' : ''}`
      contentItem.dataset.tab = i
      contentItem.style.display = i === 0 ? 'block' : 'none'

      // 移除标题栏，移除 code-block-with-title 包装
      if (titleBar) titleBar.remove()
      while (block.firstChild) {
        contentItem.appendChild(block.firstChild)
      }

      tabsContentDiv.appendChild(contentItem)
    })

    tabsDiv.appendChild(headerDiv)
    tabsDiv.appendChild(tabsContentDiv)

    // 用 tabs 容器替换第一个代码块，移除其余代码块
    group[0].replaceWith(tabsDiv)
    for (let i = 1; i < group.length; i++) {
      group[i].remove()
    }

    // 设置初始状态
    const updateActiveTab = (index) => {
      // 更新 tab 按钮状态
      tabListDiv.querySelectorAll('.code-tab').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tab) === index)
      })
      // 更新内容区域
      tabsContentDiv.querySelectorAll('.tab-content').forEach(content => {
        const isActive = parseInt(content.dataset.tab) === index
        content.classList.toggle('active', isActive)
        content.style.display = isActive ? 'block' : 'none'
      })
      // 更新语言标签
      langSpan.textContent = tabInfos[index]?.lang || ''
    }

    updateActiveTab(0)

    // Tab 点击切换
    tabListDiv.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.code-tab')
      if (!tabBtn) return
      updateActiveTab(parseInt(tabBtn.dataset.tab))
    })

    // Copy 按钮点击
    copyBtn.addEventListener('click', async () => {
      const activeContent = tabsContentDiv.querySelector('.tab-content.active')
      if (!activeContent) return
      const codeEl = activeContent.querySelector('code')
      if (!codeEl) return

      try {
        await navigator.clipboard.writeText(codeEl.textContent)
        copyBtn.classList.add('copied')
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg>'
        setTimeout(() => {
          copyBtn.classList.remove('copied')
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    })
  })
}

// 页面初始化
function initPage() {
  setTimeout(() => {
    initMermaid()
    initCodeTabs()
    initCodeBlockHeaders()
    initCopyButtons()
    initTabs()
  }, 300)
}

export default defineClientConfig({
  enhance({ app }) {
    app.component('Layout', Layout)
    app.component('TutorialLayout', TutorialLayout)
    app.component('Home', Home)
    app.component('Tutorials', Tutorials)
    app.component('Articles', Articles)
    app.component('Search', Search)
    app.component('SvgIcon', SvgIcon)
    app.component('About', About)
  },
  layouts: {
    Layout,
    TutorialLayout,
  },
  setup() {
    const route = useRoute()

    onMounted(() => {
      initPage()
    })

    // 路由变化时重新初始化
    watch(() => route.path, () => {
      initPage()
    })
  },
  rootComponents: [],
})
