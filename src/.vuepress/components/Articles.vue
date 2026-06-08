<template>
  <div class="articles-page">
    <!-- 几何秩序风格 Hero（撑满整行） -->
    <section class="geo-hero">
      <div class="geo-hero-inner">
        <h1 class="geo-hero-title">文章列表</h1>
        <p class="geo-hero-desc">记录技术探索与生活感悟的每一篇文字</p>
      </div>
    </section>

    <div class="articles-container">
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

.articles-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 几何秩序风格 Hero */
.geo-hero {
  background: #eef2f5;
  border-bottom: 1px solid #dde3ea;
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.geo-hero::before {
  content: '⬚ ◇ ◯ △';
  position: absolute;
  font-size: 130px;
  bottom: 0;
  left: 0;
  opacity: 0.08;
  font-weight: bold;
  pointer-events: none;
  white-space: pre;
  line-height: 1;
  color: #1a2a3a;
}

.geo-hero-inner {
  position: relative;
  z-index: 1;
}

.geo-hero-title {
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  color: #1a2a3a;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.geo-hero-desc {
  font-size: 1.05rem;
  color: #5a6a7a;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .articles-container { padding: 0 1rem; }
  .geo-hero { padding: 3rem 1.25rem; }
  .articles-list { gap: 0.75rem; }
}
</style>
