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
