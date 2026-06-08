<template>
  <div class="home-page">
    <!-- Hero 区域：留白叙事风格 -->
    <section class="hero">
      <div class="hero-content">
        <p class="hero-badge">技术教程 & 生活分享</p>
        <h1 class="hero-title">
          你好，我是<span class="highlight">TaiPi</span>
        </h1>
        <p class="hero-desc">
          希望能像鸟一样随着季节迁徙 ————鸟人
        </p>
        <div class="hero-actions">
          <RouterLink to="/tutorials/" class="btn btn-primary">浏览教程</RouterLink>
          <RouterLink to="/articles/" class="btn btn-secondary">阅读文章</RouterLink>
        </div>
        <div class="hero-socials">
          <a href="https://github.com/koeltp" class="social-icon" title="GitHub" target="_blank">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="mailto:tp@taipi.top" class="social-icon" title="Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- 主内容区 -->
    <main class="content-section">

      <!-- 最近更新 -->
      <div class="section latest-section">
        <h2>最近更新</h2>
        <div class="latest-items">
          <div v-for="article in latestArticles" :key="article.filename" class="latest-item">
          
            <h3><RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`">{{ article.title }}</RouterLink></h3>
              <div class="article-meta">
              <span :class="['article-category', article.category || 'tech']">{{ getCategoryLabel(article.category) }}</span>
              <span class="article-date">{{ formatDate(article.date) }}</span>
            </div>
            <p>{{ article.summary || '' }}</p>
            <div class="article-tags">
                 <RouterLink v-for="tag in article.tags" :key="tag" :to="`/search/?q=${encodeURIComponent(tag)}`" class="meta-tag">{{ tag }}</RouterLink>
             
              <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`" class="read-more">阅读更多 →</RouterLink>
            </div>
          </div>
          <div v-if="latestArticles.length === 0" class="latest-item"><p>暂无文章</p></div>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="section skills-section">
        <h2>技术栈</h2>
        <div class="skills">
          <span v-for="skill in skills" :key="skill" class="skill-tag">{{ skill }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章',  finance: '财经'
}

function getCategoryLabel(category) {
  return categoryNames[category] || category || '技术'
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('zh-CN') : ''
}

const skills = ['Python', 'JavaScript', 'Flutter', 'Dart', 'LangChain', 'React', '.NET', 'vue', 'Docker']
const latestArticles = ref([])

onMounted(async () => {
  try {
    const resp = await fetch('/data/articles.json')
    const articles = await resp.json()
    latestArticles.value = articles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
  } catch (e) {
    console.warn('加载最新文章失败:', e)
  }
})
</script>

<style scoped>
/* ===== Hero 区域：留白叙事风格（奶油极简暖调） ===== */
.home-page {
  background: var(--vp-c-bg, #ffffff);
}

.hero {
  position: relative;
  padding: 6rem 2rem 5rem;
  text-align: center;
  overflow: hidden;
  background: #fef9e8;
  border-bottom: 1px solid #f0e2c5;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  font-size: 0.85rem;
  color: #8b7355;
  background: rgba(74,59,44,0.08);
  border: 1px solid rgba(74,59,44,0.15);
  border-radius: 100px;
  margin-bottom: 1.75rem;
  letter-spacing: 0.03em;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #4a3b2c;
  line-height: 1.15;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.highlight {
  background: linear-gradient(135deg, #c9a227 0%, #d4a574 50%, #b8860b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.15rem;
  color: #7a6b55;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
  letter-spacing: 0.3px;
}

.btn-primary {
  background: #4a3b2c;
  color: #fef9e8;
}

.btn-primary:hover {
  background: #6e5540;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: #4a3b2c;
  border: 1.5px solid #c4b49a;
}

.btn-secondary:hover {
  background: rgba(74,59,44,0.06);
  transform: translateY(-2px);
}

.hero-socials {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  border-radius: 8px;
  color: #9a8a70;
  background: rgba(74,59,44,0.06);
  border: 1px solid rgba(74,59,44,0.1);
  transition: all 0.25s ease;
}

.social-icon:hover {
  color: #4a3b2c;
  background: rgba(74,59,44,0.12);
  transform: translateY(-2px);
}

/* ===== 主内容区 ===== */
.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.content-section .section {
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin-bottom: 2.5rem;
  box-shadow: none;
  border: none;
}

.section h2 {
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: -8px; left: 0;
  width: 60px; height: 4px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border-radius: 2px;
}

.latest-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.latest-item {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.latest-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59,130,246,0.1);
  transform: translateY(-5px);
}

.latest-item h3 {
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.latest-item p {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
}

.read-more {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: block;
  text-align: right;
}

.read-more:hover {
  transform: translateX(5px);
  color: #6366f1;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0369a1;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border: 1px solid #bae6fd;
}

.skill-tag:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14,165,233,0.3);
}

@media (max-width: 768px) {
  .hero { padding: 4rem 1.25rem 3.5rem; }
  .hero-title { font-size: 2.5rem; }
  .hero-desc { font-size: 1rem; }
  .hero-actions { flex-direction: column; align-items: center; }
  .btn { width: 100%; max-width: 240px; justify-content: center; }
  .content-section { padding: 2rem 1rem 3rem; }
  .section h2 { font-size: 1.5rem; }
  .latest-items { grid-template-columns: 1fr; }
}
/* ===== 标签药丸样式 ===== */
a.meta-tag {
    display: inline-block;
    padding: 1px 8px;
    background: rgb(217, 236, 255);
    border-radius: 2px;
    font-size: 0.75rem;
    line-height: 1.6;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 2px;
}

a.meta-tag:hover {
    color: #047857;
    text-decoration: none !important;
}
</style>
