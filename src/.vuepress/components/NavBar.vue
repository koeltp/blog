<template>
  <!-- 毛玻璃导航栏 -->
  <header>
    <nav>
      <RouterLink to="/" class="logo"><img src="/img/logo/logo.png" alt="太皮"></RouterLink>
      <ul class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
        <li v-for="item in navItems" :key="item.url">
          <RouterLink :to="item.url" :class="{ active: isActive(item.url) }">{{ item.name }}</RouterLink>
        </li>
        <li class="nav-search">
          <button class="search-btn" title="搜索" @click="toggleSearch">
            <SvgIcon name="search" />
          </button>
        </li>
      </ul>
      <button class="hamburger-btn" :class="{ active: mobileMenuOpen }" @click="mobileMenuOpen = !mobileMenuOpen">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </header>

  <!-- 搜索弹出框 -->
  <div v-if="searchOpen" class="search-popup">
    <div class="search-popup-inner">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="搜索教程和文章..."
        autocomplete="off"
        @input="onSearchInput"
        @keydown.enter="goToSearchPage"
      >
      <div v-if="searchSuggestions.length" class="search-suggestions">
        <RouterLink
          v-for="item in searchSuggestions"
          :key="item.id"
          :to="item.url"
          class="search-suggestion-item"
          @click="searchOpen = false"
        >
          <span class="search-suggestion-type" :class="item.type">{{ item.type === 'article' ? '文章' : '教程' }}</span>
          <span class="search-suggestion-title">{{ item.title }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: '首页', url: '/' },
  { name: '文章', url: '/articles/' },
  { name: '教程', url: '/tutorials/' },
  { name: '关于', url: '/about/' },
]

const mobileMenuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchSuggestions = ref([])
const searchInput = ref(null)

let searchDebounce = null
let miniSearch = null

function isActive(url) {
  if (url === '/') return route.path === '/'
  return route.path.startsWith(url)
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    nextTick(() => searchInput.value?.focus())
  }
}

async function loadMiniSearch() {
  if (miniSearch) return miniSearch
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

function onSearchInput() {
  clearTimeout(searchDebounce)
  const q = searchQuery.value.trim()
  if (!q) { searchSuggestions.value = []; return }

  searchDebounce = setTimeout(async () => {
    const ms = await loadMiniSearch()
    if (!ms) return
    const results = ms.search(q, { limit: 5 })
    searchSuggestions.value = results.map(item => ({
      ...item,
      url: item.url ? item.url.replace(/\.md$/, '.html') : '#'
    }))
  }, 200)
}

function goToSearchPage() {
  const q = searchQuery.value.trim()
  if (q) router.push({ path: '/search/', query: { q } })
}

// 点击外部关闭搜索
function onClickOutside(e) {
  const popup = document.querySelector('.search-popup')
  const btn = document.querySelector('.search-btn')
  if (popup && !popup.contains(e.target) && btn && !btn.contains(e.target)) {
    searchOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  height: 64px;
}

nav {
  margin: 0 auto;
  padding: 0 8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
  text-decoration: none;
  display: flex;
  align-items: center;
  height: 100%;
}

.logo img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.nav-links {
  display: flex;
  list-style: none;
  height: 64px;
  align-items: center;
}

.nav-links li {
  margin-left: 0;
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-links a {
  color: #475569;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
  padding: 0 14px;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  transition: color 0.2s ease;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0; left: 14px; right: 14px;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.25s ease;
}

.nav-links a:hover { color: #1e293b; }
.nav-links a:hover::after { transform: scaleX(1); }
.nav-links a.active { color: #3b82f6; font-weight: 600; }
.nav-links a.active::after { transform: scaleX(1); }

.nav-search {
  display: flex;
  align-items: center;
  margin-left: 24px;
  height: 100%;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  color: #64748b;
}

.search-btn:hover { background: rgba(0,0,0,0.05); color: #1e293b; }
.search-btn svg { width: 22px; height: 22px; }

.search-popup {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: searchFadeIn 0.2s ease;
}

.search-popup-inner {
  position: relative;
  width: 480px;
  max-width: 90vw;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.12);
}

@keyframes searchFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.search-popup-inner input {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: transparent;
  color: #1e293b;
  font-size: 1rem;
  outline: none;
}

.search-popup-inner input::placeholder { color: #94a3b8; }

.search-suggestions {
  border-top: 1px solid rgba(0,0,0,0.06);
  max-height: 320px;
  overflow-y: auto;
}

.search-suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  color: #334155;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.search-suggestion-item:hover { background: rgba(0,0,0,0.04); }

.search-suggestion-type {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
}

.search-suggestion-type.article { background: rgba(59,130,246,0.1); color: #3b82f6; }
.search-suggestion-type.tutorial { background: rgba(245,158,11,0.1); color: #d97706; }

.search-suggestion-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hamburger-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  flex-direction: column;
  gap: 5px;
  z-index: 1001;
}

.hamburger-btn span {
  display: block;
  width: 22px; height: 2px;
  background: #334155;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-btn.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger-btn.active span:nth-child(2) { opacity: 0; }
.hamburger-btn.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

@media (max-width: 768px) {
  nav { padding: 0 1rem; }
  .hamburger-btn { display: flex; }

  .nav-links {
    position: fixed;
    top: 64px; left: 0; right: 0;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-direction: column;
    height: auto;
    padding: 0;
    transform: translateY(-100%);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 1000;
    border-top: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .nav-links.mobile-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-links li { height: auto; }
  .nav-links a { padding: 14px 24px; border-bottom: 1px solid rgba(0,0,0,0.04); color: #475569; }
  .nav-links a::after { display: none; }

  .nav-search { margin-left: 0; padding: 10px 24px; }

  .search-popup { left: 5%; right: 5%; transform: none; }
  .search-popup-inner { width: 100%; }
}
</style>
