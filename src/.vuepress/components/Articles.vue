<template>
  <div class="articles-page">
    <!-- Hero 区域：404 极客幽默风格 -->
    <section class="art-hero">
      <div class="art-hero-container">
        <div class="art-hero-content">
          <div class="art-hero-badge">404 NOT FOUND</div>
          <h1 class="art-hero-title">页面会丢失<br>但知识不会</h1>
          <p class="art-hero-desc">这里没有死链，只有重启探索的勇气。从错误中学习，从404中创造。</p>
          <div class="art-btn-group">
            <a href="#articles-list" class="art-btn art-btn-primary" @click.prevent="scrollToArticles">
              <i class="fas fa-compass"></i> 浏览文章
            </a>
            <a href="/" class="art-btn art-btn-outline">重定向人生</a>
          </div>
        </div>
      </div>
    </section>

    <div id="articles-list" class="articles-container">
      <div class="articles-list">
      <div v-for="article in articles" :key="article.filename" class="article-card">
        <h3 class="article-card-title">
          <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`">{{ article.title }}</RouterLink>
        </h3>
        <div class="article-card-meta">
          <span v-if="article.authors" class="meta-item">
            <SvgIcon name="user" />
            {{ article.authors }}
          </span>
          <span v-if="article.authors && (article.date || article.category)" class="meta-item-divider">|</span>
          <span v-if="article.date" class="meta-item">
            <SvgIcon name="calendar" />
            {{ formatDate(article.date) }}
          </span>
          <span class="meta-item-divider">|</span>
          <span class="meta-item">
            <SvgIcon name="folder" />
            {{ getCategoryLabel(article.category) }}
          </span>
          <span v-if="article.tags && article.tags.length" class="meta-item-divider">|</span>
          <span v-if="article.tags && article.tags.length" class="meta-item meta-tags">
            <SvgIcon name="tag" class-name="meta-tags-icon" />
            <RouterLink v-for="tag in article.tags" :key="tag" :to="`/search/?q=${encodeURIComponent(tag)}`" class="meta-tag">{{ tag }}</RouterLink>
          </span>
        </div>
        <p v-if="article.summary" class="article-card-summary">{{ article.summary }}</p>
        <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`" class="article-card-link">
          阅读全文
          <SvgIcon name="arrow-right" />
        </RouterLink>
      </div>
      <div v-if="articles.length === 0" class="msg-empty">暂无文章</div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

function scrollToArticles() {
  document.getElementById('articles-list')?.scrollIntoView({ behavior: 'smooth' })
}

const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章', finance: '财经'
}

function getCategoryLabel(category) {
  return categoryNames[category] || category || '技术'
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('zh-CN') : ''
}

const articles = ref([])

onMounted(async () => {
  try {
    const resp = await fetch('/data/articles.json')
    const data = await resp.json()
    articles.value = data.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (e) {
    console.warn('加载文章列表失败:', e)
  }
})
</script>

<style scoped>
.articles-page {
  background: var(--vp-c-bg, #ffffff);
}

/* ===== Hero：404 极客幽默风格（暖棕 + 橙黄大字）===== */
.art-hero {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #1f1b14;
  color: #ffaa66;
  border-bottom: 1px solid rgba(255, 170, 102, 0.15);
  margin-bottom: 2rem;
  contain: layout style;
}

.art-hero-container {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 4rem 2rem;
  position: relative;
  z-index: 2;
}

.art-hero-content {
  max-width: 750px;
}

.art-hero-badge {
  font-family: monospace;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: inline-block;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
  color: #ffd4a8;
}

.art-hero-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.2rem;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
}

.art-hero-desc {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  opacity: 0.85;
  max-width: 550px;
  font-family: 'Inter', system-ui, sans-serif;
}

.art-btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.art-btn {
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

.art-btn-primary {
  background: #ffaa66;
  color: #1f1b14;
}

.art-btn-primary:hover {
  filter: brightness(1.05);
  transform: translateY(-2px);
}

.art-btn-outline {
  border: 1px solid #ffaa66;
  color: #ffaa66;
  background: transparent;
}

.art-btn-outline:hover {
  background: rgba(255, 170, 102, 0.08);
  transform: translateY(-2px);
}

/* ===== 文章列表区 ===== */
.articles-container {
  max-width: 900px;
  margin: 0 auto;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .art-hero-container { padding: 2.5rem 1.5rem; }
  .art-btn-group { flex-direction: column; align-items: flex-start; }
  .art-btn { width: 100%; max-width: 240px; justify-content: center; }
  .articles-container { padding: 0 1rem; }
  .articles-list { gap: 0.75rem; }
}
</style>
