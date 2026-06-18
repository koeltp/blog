<template>
  <div class="tutorials-page">
    <!-- Hero 区域：Git Graph 风格 -->
    <section class="tut-hero">
      <div class="tut-hero-container">
        <div class="tut-hero-content">
          <div class="tut-hero-badge">git log --oneline --graph</div>
          <h1 class="tut-hero-title">版本控制人生<br>每一次commit都是成长</h1>
          <p class="tut-hero-desc">从第一个commit到开源贡献者，代码仓库见证我的技术演变。</p>
          <div class="tut-btn-group">
            <a href="#tutorials-grid" class="tut-btn tut-btn-primary" @click.prevent="scrollToGrid">
              <i class="fab fa-git-alt"></i> 浏览教程
            </a>
            <a href="https://github.com/koeltp" class="tut-btn tut-btn-outline" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-github"></i> 开源项目
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 教程卡片区 -->
    <div id="tutorials-grid" class="tutorials-container">
    <div class="tutorials-grid">
      <RouterLink
        v-for="item in tutorialCards"
        :key="item.type"
        :to="item.url"
        class="tutorial-card"
        :data-type="item.type"
      >
        <div class="tutorial-card-icon"><i :class="item.icon"></i></div>
        <div class="tutorial-card-title">{{ item.displayName }}</div>
        <div class="tutorial-card-desc">{{ item.desc }}</div>
        <div class="tutorial-card-meta">
          <span class="tutorial-card-count">{{ item.count }} 篇文章</span>
          <span class="tutorial-card-arrow">→</span>
        </div>
      </RouterLink>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

function scrollToGrid() {
  document.getElementById('tutorials-grid')?.scrollIntoView({ behavior: 'smooth' })
}

const tutorialConfig = {
  langchain:   { icon: 'fas fa-robot',         desc: '学习 LangChain 框架，构建强大的 AI 应用与智能代理' },
  flutter:     { icon: 'fab fa-flutter',        desc: '使用 Flutter 开发跨平台移动应用，一套代码多端运行' },
  dart:        { icon: 'fas fa-bullseye',       desc: '掌握 Dart 编程语言，为 Flutter 开发打下坚实基础' },
  freport:     { icon: 'fas fa-chart-pie',      desc: '学会阅读财务报表，看懂企业经营的真实状况' },
  md:          { icon: 'fab fa-markdown',       desc: '掌握 Markdown 语法，高效编写技术文档与笔记' },
  openiddict:  { icon: 'fas fa-key',            desc: '深入理解 OpenIddict，搭建企业级 OAuth2/OpenID Connect 认证中心' },
  dotnet:      { icon: 'fab fa-microsoft',      desc: '深入 .NET 技术栈，从认证授权到微服务架构全面掌握' },
  aspire:      { icon: 'fas fa-cloud',          desc: '学习 .NET Aspire，构建云原生分布式应用' },
  zhouyi:      { icon: 'fas fa-yin-yang',       desc: '探索周易预测，理解卦象法则与传统文化智慧' },
}

const tutorialCards = ref([])

onMounted(async () => {
  try {
    const resp = await fetch('/data/nav.json')
    const data = await resp.json()
    const leftnav = data.leftnav || {}
    const displayNames = data.displayNames || {}
    const subCategories = data.subCategories || {}

    const cards = []
    Object.keys(displayNames).forEach(type => {
      if (type === 'article' || type.includes('/')) return

      const displayName = displayNames[type]
      const config = tutorialConfig[type] || { icon: '📚', desc: '点击查看更多教程内容' }

      // 计算文章总数
      let totalFiles = 0
      const subs = subCategories[type]
      if (subs && subs.length > 0) {
        totalFiles += (leftnav[type] || []).length
        subs.forEach(sub => {
          totalFiles += (leftnav[`${type}/${sub}`] || []).length
        })
      } else {
        totalFiles = (leftnav[type] || []).length
      }

      // 卡片链接
      let url
      const rootFiles = leftnav[type] || []
      if (subs && subs.length > 0) {
        if (rootFiles.length > 0) {
          url = `/docs/${type}/${rootFiles[0].file.replace('.md', '.html')}`
        } else {
          const firstSubKey = `${type}/${subs[0]}`
          const firstSubFiles = leftnav[firstSubKey] || []
          const firstFile = firstSubFiles.length > 0 ? firstSubFiles[0].file : 'index.md'
          url = `/docs/${firstSubKey}/${firstFile.replace('.md', '.html')}`
        }
      } else {
        const files = leftnav[type] || []
        url = files.length > 0 ? `/docs/${type}/${files[0].file.replace('.md', '.html')}` : `/docs/${type}/`
      }

      cards.push({ type, displayName, icon: config.icon, desc: config.desc, count: totalFiles, url })
    })

    tutorialCards.value = cards
  } catch (e) {
    console.warn('加载教程数据失败:', e)
  }
})
</script>

<style scoped>
/* ===== Hero：Git Graph 风格（深紫渐变 + 橙黄标题）===== */
.tutorials-page {
  background: var(--vp-c-bg, #ffffff);
}

.tut-hero {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(145deg, #1e1b2c, #0f0c1a);
  color: #f5e6ff;
  border-bottom: 1px solid rgba(255, 184, 108, 0.15);
  contain: layout style;
}

.tut-hero-container {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 4rem 2rem;
  position: relative;
  z-index: 2;
}

.tut-hero-content {
  max-width: 750px;
}

.tut-hero-badge {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: inline-block;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
  color: #c9b8e8;
}

.tut-hero-title {
  font-size: clamp(2.2rem, 6vw, 4.2rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.2rem;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
  color: #ffb86c;
}

.tut-hero-desc {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  opacity: 0.85;
  max-width: 550px;
  font-family: 'Inter', system-ui, sans-serif;
}

.tut-btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.tut-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.8rem 1.8rem;
  border-radius: 40px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  text-decoration: none;
  transition: 0.2s;
  cursor: pointer;
}

.tut-btn-primary {
  background: #ffb86c;
  color: #1e1b2c;
}

.tut-btn-primary:hover {
  filter: brightness(1.05);
  transform: translateY(-2px);
}

.tut-btn-outline {
  border: 1px solid #ffb86c;
  color: #ffb86c;
  background: transparent;
}

.tut-btn-outline:hover {
  background: rgba(255, 184, 108, 0.08);
  transform: translateY(-2px);
}
/* ===== 教程卡片区 ===== */
.tutorials-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.tutorial-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e9ecef;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  color: inherit;
}

.tutorial-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 4px;
  background: var(--card-color, #ff6b35);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tutorial-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  border-color: transparent;
}

.tutorial-card:hover::before { opacity: 1; }

.tutorial-card-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--card-bg, #fff5f0) 0%, var(--card-bg, #fff5f0) 60%, var(--card-color, #ff6b35) 200%);
  color: var(--card-color, #ff6b35);
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
}

.tutorial-card-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.tutorial-card-desc {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex: 1;
}

.tutorial-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.tutorial-card-count {
  color: #94a3b8;
  font-size: 0.85rem;
}

.tutorial-card-arrow {
  color: var(--card-color, #ff6b35);
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.tutorial-card:hover .tutorial-card-arrow {
  transform: translateX(5px);
}

/* 主题色 */
.tutorial-card[data-type="yi"]         { --card-color: #8b5cf6; --card-bg: #f5f3ff; }
.tutorial-card[data-type="langchain"]  { --card-color: #10b981; --card-bg: #ecfdf5; }
.tutorial-card[data-type="flutter"]    { --card-color: #0ea5e9; --card-bg: #f0f9ff; }
.tutorial-card[data-type="dart"]       { --card-color: #06b6d4; --card-bg: #ecfeff; }
.tutorial-card[data-type="freport"]    { --card-color: #f59e0b; --card-bg: #fffbeb; }
.tutorial-card[data-type="md"]         { --card-color: #6366f1; --card-bg: #eef2ff; }
.tutorial-card[data-type="openiddict"] { --card-color: #ec4899; --card-bg: #fdf2f8; }
.tutorial-card[data-type="dotnet"]     { --card-color: #7c3aed; --card-bg: #f5f3ff; }
.tutorial-card[data-type="aspire"]     { --card-color: #0ea5e9; --card-bg: #f0f9ff; }
.tutorial-card[data-type="zhouyi"]     { --card-color: #8b5cf6; --card-bg: #f5f3ff; }

@media (max-width: 768px) {
  .tut-hero-container { padding: 2.5rem 1.5rem; }
  .tut-btn-group { flex-direction: column; align-items: flex-start; }
  .tut-btn { width: 100%; max-width: 240px; justify-content: center; }
  .tutorials-container { padding: 1rem; }
  .tutorials-grid { grid-template-columns: 1fr; gap: 1rem; }
  .tutorial-card { padding: 1.5rem; }
  .tutorial-card-icon { width: 56px; height: 56px; font-size: 1.4rem; }
  .tutorial-card-title { font-size: 1.2rem; }
}
</style>
