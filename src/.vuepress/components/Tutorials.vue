<template>
  <div class="tutorials-container">
    <div class="tutorials-header">
      <h1>教程总览</h1>
      <p>选择你感兴趣的教程，开始学习之旅</p>
    </div>
    <div class="tutorials-grid">
      <RouterLink
        v-for="item in tutorialCards"
        :key="item.type"
        :to="item.url"
        class="tutorial-card"
        :data-type="item.type"
      >
        <div class="tutorial-card-icon">{{ item.icon }}</div>
        <div class="tutorial-card-title">{{ item.displayName }}</div>
        <div class="tutorial-card-desc">{{ item.desc }}</div>
        <div class="tutorial-card-meta">
          <span class="tutorial-card-count">{{ item.count }} 篇文章</span>
          <span class="tutorial-card-arrow">→</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const tutorialConfig = {
  langchain:   { icon: '🦜', desc: '学习 LangChain 框架，构建强大的 AI 应用与智能代理' },
  flutter:     { icon: '📱', desc: '使用 Flutter 开发跨平台移动应用，一套代码多端运行' },
  dart:        { icon: '🎯', desc: '掌握 Dart 编程语言，为 Flutter 开发打下坚实基础' },
  freport:     { icon: '📊', desc: '学会阅读财务报表，看懂企业经营的真实状况' },
  md:          { icon: '📝', desc: '掌握 Markdown 语法，高效编写技术文档与笔记' },
  openiddict:  { icon: '🔐', desc: '深入理解 OpenIddict，搭建企业级 OAuth2/OpenID Connect 认证中心' },
  dotnet:      { icon: '💻', desc: '深入 .NET 技术栈，从认证授权到微服务架构全面掌握' },
  aspire:      { icon: '☁️', desc: '学习 .NET Aspire，构建云原生分布式应用' },
  zhouyi:      { icon: '☯️', desc: '探索周易预测，理解卦象法则与传统文化智慧' },
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
.tutorials-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.tutorials-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.tutorials-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
  position: relative;
  display: inline-block;
}

.tutorials-header h1::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px; height: 4px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 2px;
}

.tutorials-header p {
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 1.5rem;
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
  transition: all 0.3s ease;
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
  font-size: 2rem;
  margin-bottom: 1.5rem;
  background: var(--card-bg, #fff5f0);
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
  .tutorials-container { padding: 1rem; }
  .tutorials-header h1 { font-size: 1.8rem; }
  .tutorials-grid { grid-template-columns: 1fr; gap: 1rem; }
  .tutorial-card { padding: 1.5rem; }
  .tutorial-card-icon { width: 56px; height: 56px; font-size: 1.6rem; }
  .tutorial-card-title { font-size: 1.2rem; }
}
</style>
