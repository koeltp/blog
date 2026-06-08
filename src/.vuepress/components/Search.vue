<template>
  <div class="search-main">
    <div class="search-hero">
      <div class="search-page-input-wrapper">
        <input
          v-model="query"
          type="text"
          placeholder="输入关键词搜索..."
          autocomplete="off"
          @keydown.enter="doSearch"
        >
        <button class="search-page-btn" @click="doSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          搜索
        </button>
      </div>
    </div>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ item.authors }}
            </span>
            <span v-if="item.date" class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ item.date }}
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {{ getCategoryLabel(item.category) }}
            </span>
          </div>
          <p v-if="item.snippet" class="article-card-summary" v-html="highlightText(item.snippet, query)" />
          <RouterLink :to="item.url" class="article-card-link">
            阅读全文
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </RouterLink>
        </div>
      </div>

      <div v-else class="search-empty">
        <div class="search-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <p>未找到与 "<strong>{{ query }}</strong>" 相关的内容</p>
        <p class="search-empty-hint">试试其他关键词，或使用更简短的词语</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章', docker: 'Docker', finance: '财经'
}

function getCategoryLabel(category) {
  return categoryNames[category] || category || '技术'
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

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  // 更新 URL
  router.replace({ path: '/search/', query: { q } })
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
    await doSearch()
  }
})
</script>

<style scoped>
.search-main {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.search-hero {
  text-align: center;
  padding: 2.5rem 0 1.5rem;
}

.search-page-input-wrapper {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.search-page-input-wrapper input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #3b82f6;
  border-right: none;
  border-radius: 12px 0 0 12px;
  font-size: 1.05rem;
  outline: none;
  transition: box-shadow 0.2s;
  background: white;
}

.search-page-input-wrapper input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-page-btn {
  padding: 14px 18px;
  border: 2px solid #3b82f6;
  border-left: none;
  border-radius: 0 12px 12px 0;
  background: #3b82f6;
  color: white;
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
  background: #2563eb;
  border-color: #2563eb;
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

@media (max-width: 768px) {
  .search-main { padding: 1rem; }
  .search-hero { padding: 1.5rem 0 1rem; }
}
</style>
