<template>
  <div class="search-page">
    <!-- 几何秩序风格 Hero（撑满整行） -->
    <section class="geo-hero">
      <div class="geo-hero-inner">
        <h1 class="geo-hero-title">搜索</h1>
        <p class="geo-hero-desc">探索知识库，找到你感兴趣的内容</p>
      </div>
      <!-- 搜索框内嵌到 Hero 中 -->
      <div class="search-page-input-wrapper">
        <input
          v-model="query"
          type="text"
          placeholder="输入关键词搜索..."
          autocomplete="off"
          @keydown.enter="doSearch"
        >
        <button class="search-page-btn" @click="doSearch">
          <SvgIcon name="search" />
          搜索
        </button>
      </div>
    </section>

    <div class="search-main">

    <div v-if="loading" class="search-loading">搜索中...</div>

    <div v-else-if="searched">
      <p v-if="results.length" class="search-count">找到 {{ results.length }} 个结果</p>

      <div v-if="results.length">
        <div v-for="item in results" :key="item.id" class="article-card">
          <h3 class="article-card-title">
            <RouterLink :to="item.url" v-html="highlightText(item.title, query)" />
          </h3>
          <div class="article-card-meta">
            <span v-if="item.authors" class="meta-item">
              <SvgIcon name="user" />
              {{ item.authors }}
            </span>
            <span v-if="item.authors && item.date" class="meta-item-divider">|</span>
            <span v-if="item.date" class="meta-item">
              <SvgIcon name="calendar" />
              {{ item.date }}
            </span>
            <span class="meta-item-divider">|</span>
            <span class="meta-item">
              <SvgIcon name="folder" />
              {{ getCategoryLabel(item.category) }}
            </span>
            <span class="meta-item-divider">|</span>
            <span class="meta-tags">
              <SvgIcon name="tag" class-name="meta-tags-icon" />
              <RouterLink
                v-for="tag in parseTags(item.tags)"
                :key="tag"
                :to="{ path: '/search/', query: { q: tag } }"
                class="el-tag"
              >{{ tag }}</RouterLink>
            </span>
          </div>
          <p v-if="item.snippet" class="article-card-summary" v-html="highlightText(item.snippet, query)" />
          <RouterLink :to="item.url" class="article-card-link">
            阅读全文
            <SvgIcon name="arrow-right" />
          </RouterLink>
        </div>
      </div>

      <div v-else class="search-empty">
        <div class="search-empty-icon">
          <SvgIcon name="search" />
        </div>
        <p>未找到与 "<strong>{{ query }}</strong>" 相关的内容</p>
        <p class="search-empty-hint">试试其他关键词，或使用更简短的词语</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章', docker: 'Docker', finance: '财经'
}

function getCategoryLabel(category) {
  return categoryNames[category] || category || '技术'
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean)
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
  return []
}

function highlightText(text, q) {
  if (!q || !text) return text || ''
  const keywords = q.split(/\s+/).filter(k => k.length > 0)
  let result = text
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  })
  return result
}

function getContextSnippet(content, q, maxLen = 150) {
  if (!content || !q) return ''
  const lower = content.toLowerCase()
  const keywords = q.toLowerCase().split(/\s+/).filter(k => k.length > 0)
  let pos = -1
  for (const kw of keywords) {
    const idx = lower.indexOf(kw)
    if (idx !== -1) { pos = idx; break }
  }
  if (pos === -1) return content.substring(0, maxLen) + '...'
  const start = Math.max(0, pos - 30)
  const end = Math.min(content.length, start + maxLen)
  let snippet = content.substring(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'
  return snippet
}

const route = useRoute()
const router = useRouter()
const query = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)

let miniSearch = null

async function loadMiniSearch() {
  if (miniSearch) return miniSearch
  // 动态加载 MiniSearch
  const module = await import('minisearch')
  const MiniSearch = module.default
  const resp = await fetch('/data/search-index.json')
  const data = await resp.json()
  data.forEach((item, i) => { item.id = i })
  const ms = new MiniSearch({
    fields: ['title', 'tags', 'summary', 'content'],
    storeFields: ['title', 'tags', 'summary', 'content', 'type', 'dir', 'file', 'url', 'category', 'date', 'authors'],
    idField: 'id',
    searchOptions: {
      boost: { title: 3, tags: 2, summary: 1.5, content: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND'
    }
  })
  ms.addAll(data)
  miniSearch = ms
  return ms
}

async function doSearch(skipUrlUpdate) {
  const q = query.value.trim()
  if (!q) return
  // 非路由触发时更新 URL
  if (!skipUrlUpdate) {
    router.replace({ path: '/search/', query: { q } })
  }
  loading.value = true
  searched.value = true
  try {
    const ms = await loadMiniSearch()
    const raw = ms.search(q)
    results.value = raw.map(item => ({
      ...item,
      snippet: getContextSnippet(item.content || '', q),
      url: item.url ? item.url.replace(/\.md$/, '.html') : '#'
    }))
  } catch (e) {
    console.warn('搜索失败:', e)
    results.value = []
  }
  loading.value = false
}

onMounted(async () => {
  const q = route.query.q
  if (q) {
    query.value = q
    await doSearch(true)
  }
})

// 监听路由 query 变化，支持标签点击跳转
watch(() => route.query.q, async (newQ) => {
  if (newQ && newQ !== query.value) {
    query.value = newQ
    await doSearch(true)
  }
})
</script>

<style scoped>
.search-page {
  background: var(--vp-c-bg, #ffffff);
}

.search-main {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* 几何秩序风格 Hero */
.geo-hero {
  background: #eef2f5;
  border-bottom: 1px solid #dde3ea;
  padding: 4rem 2rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
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
  margin-bottom: 2rem;
}

.geo-hero-title {
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  color: #1a2a3a;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.geo-hero-desc {
  font-size: 1.05rem;
  color: #5a6a7a;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.search-page-input-wrapper {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.search-page-input-wrapper input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #1a2a3a;
  border-right: none;
  border-radius: 0 0 0 0;
  font-size: 1.05rem;
  outline: none;
  transition: box-shadow 0.2s;
  background: #ffffff;
}

.search-page-input-wrapper input:focus {
  box-shadow: 0 0 0 3px rgba(26,42,58,0.12);
}

.search-page-btn {
  padding: 14px 18px;
  border: 2px solid #1a2a3a;
  border-left: none;
  border-radius: 0 0 0 0;
  background: #1a2a3a;
  color: #eef2f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-weight: 500;
}

.search-page-btn svg {
  width: 20px; height: 20px;
  margin-right: 0.5rem;
}

.search-page-btn:hover {
  background: #2c4c6c;
  border-color: #2c4c6c;
}

.search-count {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.search-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
}

.search-empty-icon svg {
  width: 50px; height: 50px;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.search-empty p { font-size: 1.1rem; margin-bottom: 0.5rem; }
.search-empty-hint { font-size: 0.9rem; color: #94a3b8; }
.search-loading { text-align: center; padding: 4rem; color: #64748b; font-size: 1.1rem; }

.meta-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tags-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
  color: #6b7280;
  flex-shrink: 0;
}

.el-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 20px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
  text-decoration: none;
  transition: all 0.2s;
}

.el-tag:hover {
  background: #d9ecff;
  color: #337ecc;
  border-color: #b3d8ff;
}

@media (max-width: 768px) {
  .search-main { padding: 0 1rem; }
  .geo-hero { padding: 3rem 1.25rem 2rem; }
}
</style>
