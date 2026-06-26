<template>
  <div class="tutorial-layout">
    <NavBar />

    <div class="page-wrapper">
      <!-- 左侧导航 -->
      <aside class="sidebar" :class="{ 'has-nav': hasSidebar }">
        <h3 v-if="hasSidebar">目录</h3>
        <ul v-if="hasSidebar" id="file-list">
          <!-- 根目录文件 -->
          <template v-if="rootFiles.length">
            <li v-for="file in rootFiles" :key="file.file">
              <RouterLink :to="getLink(parentType, file.file)" :class="{ active: currentFile === file.file }">
                {{ file.name }}
              </RouterLink>
            </li>
          </template>
          <!-- 子目录分组 -->
          <li v-for="sub in subGroups" :key="sub.key" class="nav-group" :class="{ collapsed: collapsedGroups.has(sub.key) }">
            <div class="nav-group-header" @click="toggleGroup(sub)">
              <span class="nav-group-arrow">{{ collapsedGroups.has(sub.key) ? '▶' : '▼' }}</span>
              <span class="nav-group-title">{{ sub.displayName }}</span>
            </div>
            <ul class="nav-group-items">
              <li v-for="file in sub.files" :key="file.file">
                <RouterLink :to="getLink(sub.key, file.file)" :class="{ active: currentSubKey === sub.key && currentFile === file.file }">
                  {{ file.name }}
                </RouterLink>
              </li>
            </ul>
          </li>
          <!-- 普通一级目录文件 -->
          <template v-if="!rootFiles.length && !subGroups.length">
            <li v-for="file in allFiles" :key="file.file">
              <RouterLink :to="getLink(navType, file.file)" :class="{ active: currentFile === file.file }">
                {{ file.name }}
              </RouterLink>
            </li>
          </template>
        </ul>
      </aside>

      <!-- 内容区 -->
      <div class="content-area">
        <div class="content-container">
          <!-- 文章 meta 数据 -->
          <div v-if="frontmatter.title" class="article-meta-header">
            <h1 class="article-meta-title">{{ frontmatter.title }}</h1>
            <p v-if="frontmatter.summary" class="article-meta-summary">{{ frontmatter.summary }}</p>
            <div class="article-meta-info">
              <span v-if="frontmatter.authors" class="meta-info-item">
                <SvgIcon name="user" />
                {{ formatAuthors(frontmatter.authors) }}
              </span>
              <span class="meta-info-divider">|</span>
              <span v-if="frontmatter.date" class="meta-info-item">
                <SvgIcon name="calendar" />
                {{ formatDate(frontmatter.date) }}
              </span>
              <span class="meta-info-divider">|</span>
              <span v-if="frontmatter.category" class="meta-info-item">
                <SvgIcon name="folder" />
                {{ getCategoryLabel(frontmatter.category) }}
              </span>
              <span class="meta-info-divider">|</span>
              <span class="meta-info-tags">
                <SvgIcon name="tag" class-name="meta-tags-icon" />
                <RouterLink
                  v-for="tag in tagList"
                  :key="tag"
                  :to="{ path: '/search/', query: { q: tag } }"
                  class="el-tag"
                >{{ tag }}</RouterLink>
              </span>
            </div>
          </div>
          <Content />
          <!-- 上一篇/下一篇 -->
          <div v-if="prevNext.prev || prevNext.next" class="prev-next-nav">
            <RouterLink v-if="prevNext.prev" :to="prevNext.prev.url" class="prev-next-link prev">
              <span class="prev-next-label">上一篇</span>
              <span class="prev-next-title">{{ prevNext.prev.name }}</span>
            </RouterLink>
            <span v-else class="prev-next-link prev disabled"></span>
            <RouterLink v-if="prevNext.next" :to="prevNext.next.url" class="prev-next-link next">
              <span class="prev-next-label">下一篇</span>
              <span class="prev-next-title">{{ prevNext.next.name }}</span>
            </RouterLink>
            <span v-else class="prev-next-link next disabled"></span>
          </div>
        </div>
      </div>

      <!-- 右侧目录 -->
      <div class="right-nav" v-if="tocTree.length">
        <div class="right-nav-title">目录</div>
        <ul class="toc-tree">
          <TocNode v-for="item in tocTree" :key="item.id" :item="item" :active-heading="activeHeading" :collapsed-set="collapsedSet" @navigate="scrollTo" @toggle="toggleCollapse" />
        </ul>
      </div>
    </div>

    <!-- 页脚 -->
    <footer>
      <p>&copy; 2026 太皮. 保留所有权利.</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageFrontmatter } from '@vuepress/client'
import NavBar from './NavBar.vue'

// 递归目录节点组件
const TocNode = defineComponent({
  name: 'TocNode',
  props: {
    item: { type: Object, required: true },
    activeHeading: { type: String, default: '' },
    collapsedSet: { type: Set, required: true }
  },
  emits: ['navigate', 'toggle'],
  setup(props, { emit }) {
    return () => {
      const { item, activeHeading, collapsedSet } = props
      const hasChildren = item.children && item.children.length > 0
      const isCollapsed = collapsedSet.has(item.id)
      const isActive = activeHeading === item.id
      // 判断子节点或自身是否处于活跃状态（用于高亮父级）
      const isAncestorOfActive = activeHeading ? isAncestor(item, activeHeading) : false

      return h('li', { class: ['toc-item', `toc-level-${item.level}`] }, [
        h('div', {
          class: ['toc-item-header', { active: isActive, 'ancestor-active': isAncestorOfActive && !isActive }]
        }, [
          // 折叠箭头
          hasChildren
            ? h('span', {
                class: 'toc-arrow',
                onClick: (e) => { e.preventDefault(); e.stopPropagation(); emit('toggle', item.id) }
              }, isCollapsed ? '▶' : '▼')
            : h('span', { class: 'toc-arrow toc-arrow-leaf' }),
          // 链接
          h('a', {
            href: `#${item.id}`,
            class: 'toc-link',
            onClick: (e) => { e.preventDefault(); emit('navigate', item.id) }
          }, item.text)
        ]),
        // 子节点
        hasChildren && !isCollapsed
          ? h('ul', { class: 'toc-children' },
              item.children.map(child =>
                h(TocNode, {
                  key: child.id,
                  item: child,
                  activeHeading,
                  collapsedSet,
                  onNavigate: (id) => emit('navigate', id),
                  onToggle: (id) => emit('toggle', id)
                })
              )
            )
          : null
      ])
    }
  }
})

// 判断某个节点是否是当前活跃标题的祖先
function isAncestor(node, activeId) {
  if (!node.children) return false
  for (const child of node.children) {
    if (child.id === activeId) return true
    if (isAncestor(child, activeId)) return true
  }
  return false
}

const route = useRoute()
const router = useRouter()
const frontmatter = usePageFrontmatter()

// 分类名称映射
const categoryNames = {
  tutorial: '教程', life: '生活', tech: '技术',
  article: '文章', docker: 'Docker', finance: '财经'
}

function getCategoryLabel(category) {
  return categoryNames[category] || category || '技术'
}

// 格式化日期：Date 对象或字符串统一转为 YYYY-MM-DD
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 格式化作者：可能是字符串、数组或逗号分隔字符串
function formatAuthors(authors) {
  if (!authors) return ''
  if (Array.isArray(authors)) return authors.join(', ')
  if (typeof authors === 'string') return authors
  return String(authors)
}

// 解析 tags：frontmatter 中 tags 可能是逗号分隔字符串、数组或 YAML 行内数组
const tagList = computed(() => {
  const tags = frontmatter.value.tags
  if (!tags) return []
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean)
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
  return []
})

// 导航数据
const navData = ref(null)
const rootFiles = ref([])
const subGroups = ref([])
const allFiles = ref([])
const prevNext = ref({ prev: null, next: null })

// 当前文件信息
const navType = computed(() => {
  const path = decodeURIComponent(route.path)
  const match = path.match(/^\/docs\/(.+?)\/[^/]+\.html$/)
  return match ? match[1] : ''
})
const parentType = computed(() => navType.value.split('/')[0])
const currentSubKey = computed(() => {
  return navType.value.includes('/') ? navType.value : ''
})
const currentFile = computed(() => {
  const path = decodeURIComponent(route.path)
  const match = path.match(/\/([^/]+)\.html$/)
  return match ? match[1] + '.md' : ''
})

// 是否显示左侧导航栏：文章详情页没有导航数据，不显示
const hasSidebar = computed(() => {
  return rootFiles.value.length > 0 || subGroups.value.length > 0 || allFiles.value.length > 0
})

// 目录（树形结构）
const tocTree = ref([])
const activeHeading = ref('')
// 折叠状态：记录被手动折叠的节点 id
const collapsedSet = ref(new Set())

function toggleCollapse(id) {
  const newSet = new Set(collapsedSet.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  collapsedSet.value = newSet
}

function getLink(type, file) {
  return `/docs/${type}/${file.replace('.md', '.html')}`
}

// 左侧导航折叠状态
const collapsedGroups = ref(new Set())

function toggleGroup(sub) {
  const newSet = new Set(collapsedGroups.value)
  if (newSet.has(sub.key)) {
    newSet.delete(sub.key)
  } else {
    newSet.add(sub.key)
  }
  collapsedGroups.value = newSet
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 加载导航数据
async function loadNavData() {
  try {
    const resp = await fetch('/data/nav.json')
    navData.value = await resp.json()
    buildSidebar()
    buildPrevNext()
  } catch (e) {
    console.warn('加载导航数据失败:', e)
  }
}

function buildSidebar() {
  if (!navData.value) return
  const leftnav = navData.value.leftnav || {}
  const displayNames = navData.value.displayNames || {}
  const subCategories = navData.value.subCategories || {}
  const type = navType.value
  const parent = parentType.value
  const subs = subCategories[parent] || []

  if (subs.length > 0) {
    rootFiles.value = leftnav[parent] || []
    subGroups.value = subs.map(sub => ({
      key: `${parent}/${sub}`,
      displayName: displayNames[`${parent}/${sub}`] || sub,
      files: leftnav[`${parent}/${sub}`] || []
    }))
    allFiles.value = []
  } else {
    rootFiles.value = []
    subGroups.value = []
    allFiles.value = leftnav[type] || []
  }
}

function buildPrevNext() {
  if (!navData.value) return
  const leftnav = navData.value.leftnav || {}
  const type = navType.value
  const files = leftnav[type] || []
  const idx = files.findIndex(f => f.file === currentFile.value)
  if (idx === -1) {
    prevNext.value = { prev: null, next: null }
    return
  }
  prevNext.value = {
    prev: idx > 0 ? { name: files[idx - 1].name, url: getLink(type, files[idx - 1].file) } : null,
    next: idx < files.length - 1 ? { name: files[idx + 1].name, url: getLink(type, files[idx + 1].file) } : null
  }
}

// 提取页面标题生成树形目录（跳过第一个 h1，因为它已在 meta header 中显示）
function extractToc() {
  const container = document.querySelector('.content-container')
  if (!container) return
  const headings = container.querySelectorAll('h1, h2, h3, h4')
  if (!headings.length) { tocTree.value = []; return }

  // 隐藏 Content 中第一个 h1（与 meta header 重复）
  const contentDiv = container.querySelector(':scope > div:not(.article-meta-header):not(.prev-next-nav)')
  const firstH1 = contentDiv?.querySelector(':scope > h1')
  if (firstH1 && frontmatter.value.title) {
    firstH1.style.display = 'none'
  }

  // 先收集平铺列表
  const flatItems = []
  let skippedFirstH1 = false
  headings.forEach((h, i) => {
    if (h.tagName === 'H1' && !skippedFirstH1) {
      skippedFirstH1 = true
      return
    }
    const id = h.id || `heading-${i}`
    if (!h.id) h.id = id
    flatItems.push({
      id,
      text: h.textContent,
      level: parseInt(h.tagName.toLowerCase().replace('h', '')),
      children: []
    })
  })

  // 平铺列表转树：级别相同是兄弟，级别小是父级，级别大是子级
  const tree = []
  const stack = [] // 栈顶是当前父节点
  for (const item of flatItems) {
    // 弹出栈中级别 >= 当前项的节点，找到最近的父级
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      tree.push(item)
    } else {
      stack[stack.length - 1].children.push(item)
    }
    stack.push(item)
  }

  tocTree.value = tree
  collapsedSet.value = new Set() // 重置折叠状态
}

// 递归收集树中所有节点的 id
function collectAllIds(nodes) {
  const ids = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children) ids.push(...collectAllIds(node.children))
  }
  return ids
}

// 滚动监听（rAF 节流 + passive，避免阻塞主线程）
let rafId = null
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const allIds = collectAllIds(tocTree.value)
    const headings = allIds.map(id => ({ id, el: document.getElementById(id) })).filter(h => h.el)

    let current = null
    let minDist = Infinity
    headings.forEach(({ id, el }) => {
      const dist = Math.abs(el.getBoundingClientRect().top - 100)
      if (dist < minDist) { minDist = dist; current = id }
    })
    if (current) {
      activeHeading.value = current
      // 自动展开当前活跃标题的祖先节点
      autoExpandAncestors(current)
    }
  })
}

// 递归查找并展开活跃标题的所有祖先
function autoExpandAncestors(activeId) {
  const idsToExpand = new Set()
  function findPath(nodes) {
    for (const node of nodes) {
      if (node.id === activeId) return true
      if (node.children && findPath(node.children)) {
        idsToExpand.add(node.id)
        return true
      }
    }
    return false
  }
  findPath(tocTree.value)
  if (idsToExpand.size > 0) {
    const newSet = new Set(collapsedSet.value)
    for (const id of idsToExpand) {
      newSet.delete(id)
    }
    collapsedSet.value = newSet
  }
}

let scrollHandler = null

onMounted(async () => {
  await loadNavData()
  setTimeout(() => {
    extractToc()
    scrollHandler = onScroll
    // passive: true 告诉浏览器不会在回调中调用 preventDefault，允许滚动不等待 JS
    window.addEventListener('scroll', onScroll, { passive: true })
  }, 500)
})

onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
  if (rafId) cancelAnimationFrame(rafId)
})

watch(() => route.path, () => {
  buildSidebar()
  buildPrevNext()
  setTimeout(extractToc, 500)
})
</script>

<style scoped>
.tutorial-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  flex: 1;
}

.sidebar {
  width: 350px;
  background-color: #f8fafc;
  padding: 1.5rem 0;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  will-change: transform;
  transform: translateZ(0);
}

.sidebar.has-nav {
  padding-left: 5px;
}

.sidebar h3 {
  margin: 0 1rem 0.75rem;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.4rem;
}

.sidebar ul { list-style: none; padding: 0; margin: 0; }
.sidebar ul li { list-style: none; margin: 0; padding: 0; }

.sidebar a {
  color: #475569;
  text-decoration: none;
  display: block;
  padding: 12px 16px;
  transition: background-color 0.2s ease, color 0.2s ease, border-left-color 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
  border-left: 3px solid transparent;
}

.sidebar a:hover { background-color: #f1f5f9; color: #1e293b; }
.sidebar a.active { background-color: #eff6ff; color: #2563eb; font-weight: 600; border-left-color: #2563eb; }

.sidebar-empty {
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem 1rem;
  margin: 0;
}

.nav-group { list-style: none; margin: 0; padding: 0; }

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  cursor: pointer;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  border-left: 3px solid transparent;
  transition: background-color 0.2s ease;
  user-select: none;
}

.nav-group-header:hover { background-color: #f1f5f9; }

.nav-group-arrow {
  font-size: 0.7rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
  width: 14px;
  text-align: center;
}

.nav-group-title { flex: 1; }

.sidebar .nav-group-items {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 3rem;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.sidebar .nav-group.collapsed .nav-group-items { max-height: 0 !important; }
.sidebar .nav-group:not(.collapsed) .nav-group-items { max-height: 1000px; }

.content-area {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.content-container {
  background-color: white;
  padding: 2rem 2.5rem;
}

/* 文章 meta 数据头部 */
.article-meta-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.article-meta-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.article-meta-summary {
  font-size: 1.05rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.7;
}

.article-meta-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-info-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #6b7280;
  font-size: 0.85rem;
  white-space: nowrap;
}

.meta-info-item svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.meta-info-divider {
  color: #d1d5db;
  font-size: 0.85rem;
}

.meta-info-tags {
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

/* Element Plus 风格标签 */
.el-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 0.75rem;
  line-height: 1.6;
  border-radius: 4px;
  border: 1px solid #d9ecff;
  background-color: #ecf5ff;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.el-tag:hover {
  background-color: #d9ecff;
  color: #337ecc;
  border-color: #b3d8ff;
}

.right-nav {
  position: sticky !important;
  top: 64px !important;
  width: 400px;
  flex-shrink: 0;
  background-color: #fafafa;
  border-left: 1px solid #e2e8f0;
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  height: calc(100vh - 64px);
  max-height: none;
  overflow-y: auto;
  z-index: 1;
  will-change: transform;
  transform: translateZ(0);
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: 4rem;
}

@media (max-width: 1200px) {
  .right-nav { display: none !important; }
  .sidebar { width: 200px; }
  .sidebar.has-nav { padding-left: 40px; }
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .content-container { padding: 1.5rem; }
  .article-meta-title { font-size: 1.5rem; }
  .article-meta-info { gap: 0.6rem; }
}
</style>

<!-- 非 scoped 样式，确保穿透到 TocNode 子组件 -->
<style>
/* 树形目录样式——与左侧导航统一风格 */
.toc-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-tree .toc-item {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-tree .toc-children {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 1.5rem;
  overflow: hidden;
}

.toc-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  cursor: pointer;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  border-left: 3px solid transparent;
  transition: background-color 0.2s ease, color 0.2s ease, border-left-color 0.2s ease;
  user-select: none;
}

.toc-item-header:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.toc-item-header.active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
  border-left-color: #2563eb;
}

.toc-item-header.ancestor-active {
  color: #1e293b;
  font-weight: 600;
}

.toc-arrow {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  width: 14px;
  text-align: center;
  transition: transform 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.toc-arrow:hover {
  color: #475569;
}

.toc-arrow-leaf {
  cursor: default;
  visibility: hidden;
}

.toc-link {
  color: inherit;
  text-decoration: none;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-link:visited {
  color: inherit;
}

.toc-link:hover {
  color: inherit;
  text-decoration: none;
}

/* 右侧目录标题 */
.right-nav-title {
  margin: 0 0 0.75rem;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.4rem;
}

.toc-level-1 > .toc-item-header { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
.toc-level-2 > .toc-item-header { font-size: 0.9rem; font-weight: 500; }
.toc-level-3 > .toc-item-header { font-size: 0.85rem; }
.toc-level-4 > .toc-item-header { font-size: 0.8rem; color: #94a3b8; }
</style>
