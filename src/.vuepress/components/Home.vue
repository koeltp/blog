<template>
  <div class="home-page">
    <!-- Hero 区域：经典终端风格 -->
    <section class="hero">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">❯ cat README.md</div>
          <h1 class="hero-title">$ echo "Hello, World!"<span class="cursor-blink">_</span></h1>
            <p class="hero-desc">不爱吹牛，只爱解决问题。如果你有技术问题或者想聊聊开源，欢迎找我。</p>
          <div class="hero-actions">
            <a href="#latest" class="btn btn-primary" @click.prevent="scrollToLatest">
              <i class="fas fa-terminal"></i> 进入博客
            </a>

            <a href="https://github.com/koeltp" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
              <i class="fab fa-github"></i> GitHub
            </a>
            <a href="mailto:tp@taipi.top" class="btn btn-outline">
              <i class="fas fa-envelope"></i> 邮箱
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 主内容区 -->
    <main class="content-section">

      <!-- 最近更新 -->
      <div id="latest" class="section latest-section">
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

const skills = ['.NET', 'C#', 'ASP.NET Core', 'EF Core', 'Vue', 'TypeScript', 'Flutter', 'Dart', 'Docker']
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

function scrollToLatest() {
  document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
/* ===== Hero 区域：经典终端风格（深色极客） ===== */
.home-page {
  background: var(--vp-c-bg, #ffffff);
}

.hero {
  position: relative;
  width: 100%;
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0e17;
  color: #c3e8e1;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.hero-container {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 4rem 2rem;
  position: relative;
  z-index: 2;
}

.hero-content {
  max-width: 950px;
}

.hero-badge {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: inline-block;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
}

.hero-title {
  font-size: clamp(2.2rem, 6vw, 4.2rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.2rem;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
  color: #2dd4bf;
  text-shadow: 0 0 5px #2dd4bf40;
  white-space: nowrap;
}

.cursor-blink {
  display: inline-block;
  width: 5px;
  height: 1.2rem;
  background-color: #2dd4bf;
  vertical-align: middle;
  margin-left: 4px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  opacity: 0.85;
  max-width: 550px;
  font-family: 'Inter', system-ui, sans-serif;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
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

.btn-primary {
  background: #2dd4bf;
  color: #0a0e17;
}

.btn-primary:hover {
  filter: brightness(1.05);
  transform: translateY(-2px);
}

.btn-outline {
  border: 1px solid #2dd4bf;
  color: #2dd4bf;
  background: transparent;
}

.btn-outline:hover {
  background: rgba(255,255,255,0.05);
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
  color: orangered;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14,165,233,0.3);
}

@media (max-width: 768px) {
  .hero-container { padding: 2.5rem 1rem; }
  .hero-actions { flex-direction: column; align-items: flex-start; }
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
