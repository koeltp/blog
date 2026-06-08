<template>
  <div class="articles-container">
    <h1 class="page-title">文章列表</h1>
    <div class="articles-list">
      <div v-for="article in articles" :key="article.filename" class="article-card">
        <h3 class="article-card-title">
          <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`">{{ article.title }}</RouterLink>
        </h3>
        <div class="article-card-meta">
          <span v-if="article.authors" class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {{ article.authors }}
          </span>
          <span v-if="article.date" class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ formatDate(article.date) }}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {{ getCategoryLabel(article.category) }}
          </span>
          <span v-if="article.tags && article.tags.length" class="meta-item meta-tags">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <RouterLink v-for="tag in article.tags" :key="tag" :to="`/search/?q=${encodeURIComponent(tag)}`" class="meta-tag">{{ tag }}</RouterLink>
          </span>
        </div>
        <p v-if="article.summary" class="article-card-summary">{{ article.summary }}</p>
        <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`" class="article-card-link">
          阅读全文
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </RouterLink>
      </div>
      <div v-if="articles.length === 0" class="msg-empty">暂无文章</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章', docker: 'Docker', finance: '财经'
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
.articles-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
  position: relative;
  display: inline-block;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px; left: 0;
  width: 60px; height: 4px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 2px;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .articles-container { padding: 1rem; }
  .articles-list { gap: 0.75rem; }
}
</style>
