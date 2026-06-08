/**
 * 构建数据脚本 - 从 Markdown frontmatter 自动生成 JSON 数据文件
 *
 * 运行方式：node scripts/generate-data.js
 *
 * 生成文件：
 *   - src/.vuepress/public/data/articles.json   文章列表
 *   - src/.vuepress/public/data/search-index.json 搜索索引
 *   - src/.vuepress/public/data/nav.json         导航配置
 *
 * 约定：
 *   - src/docs/article/ 下的 md → 文章（type=article）
 *   - src/docs/其他目录 下的 md → 教程（type=tutorial）
 *   - 教程目录下 index.md 的 title 作为该分类的显示名
 *   - 子目录（如 dotnet/auth）自动识别为父目录的子分类
 */

const fs = require('fs')
const path = require('path')

// 项目根目录
const ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(ROOT, 'src', 'docs')
const OUTPUT_DIR = path.join(ROOT, 'src', '.vuepress', 'public', 'data')

// 需要排除的目录（不出现在教程导航中）
const EXCLUDE_DIRS = ['article']

// nav.json 中需要手动维护的静态部分
const TOPNAV = [
  { name: '首页', url: '/' },
  { name: '文章', url: '/articles/' },
  { name: '教程', url: '/tutorials/' }
]

// 分类显示名映射（兜底：目录名首字母大写）
const DISPLAY_NAMES = {
  zhouyi: '周易预测',
  langchain: 'LangChain教程',
  flutter: 'Flutter教程',
  dart: 'Dart教程',
  freport: '财报',
  md: 'Markdown语法指南',
  openiddict: 'OpenIddict教程',
  aspire: 'Aspire教程',
  dotnet: '.NET教程',
  article: '文章'
}

// 子分类显示名映射
const SUB_DISPLAY_NAMES = {
  'dotnet/auth': '认证与授权'
}

/**
 * 解析 Markdown 文件的 frontmatter
 */
function parseFrontmatter(content) {
  // 去掉 BOM
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const fm = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()

    // 处理引号包裹的值
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }

    // 处理数组格式的 tags
    if (key === 'tags') {
      if (val.startsWith('[')) {
        // YAML 数组行内写法: [a, b, c]
        fm[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
      } else if (val === '') {
        // YAML 多行数组，需要从后续行读取
        fm._tagsPending = true
      } else {
        fm[key] = val.split(',').map(s => s.trim())
      }
      continue
    }

    fm[key] = val
  }
  return fm
}

/**
 * 解析多行 tags（YAML 格式）
 */
function parseMultilineTags(content) {
  const lines = content.split('\n')
  const tags = []
  let inTags = false

  for (const line of lines) {
    if (/^tags\s*:/.test(line)) {
      const val = line.replace(/^tags\s*:/, '').trim()
      if (val.startsWith('[')) {
        return val.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
      }
      if (val === '') {
        inTags = true
        continue
      }
    }
    if (inTags) {
      const m = line.match(/^\s*-\s*(.+)/)
      if (m) {
        tags.push(m[1].trim().replace(/['"]/g, ''))
      } else if (!/^\s*$/.test(line)) {
        break
      }
    }
  }
  return tags
}

/**
 * 提取 Markdown 纯文本（去除标记语法，用于搜索索引）
 */
function extractPlainText(content) {
  // 去掉 BOM
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  // 去掉 frontmatter
  let text = content.replace(/^---[\s\S]*?---\r?\n*/, '')
  // 去掉代码块
  text = text.replace(/```[\s\S]*?```/g, '')
  // 去掉行内代码
  text = text.replace(/`[^`]+`/g, '')
  // 去掉图片
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  // 去掉链接，保留文字
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // 去掉 HTML 标签
  text = text.replace(/<[^>]+>/g, '')
  // 去掉 Markdown 标记
  text = text.replace(/^[#>*\-+|]+\s*/gm, '')
  // 合并空白
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

/**
 * 递归扫描目录，收集所有 md 文件信息
 */
function scanDocs() {
  const articles = []  // article/ 下的文章
  const tutorials = [] // 其他目录下的教程
  const dirMap = {}    // 目录 → 文件列表（用于生成 nav.json）

  function walk(dir, relativeDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.relative(DOCS_DIR, fullPath)

      if (entry.isDirectory()) {
        walk(fullPath, relPath)
        continue
      }

      if (!entry.name.endsWith('.md')) continue

      const content = fs.readFileSync(fullPath, 'utf-8')
      const fm = parseFrontmatter(content)

      // 解析 tags
      let tags = fm.tags || []
      if (fm._tagsPending) {
        tags = parseMultilineTags(content)
      }
      if (typeof tags === 'string') {
        tags = tags.split(',').map(s => s.trim())
      }

      // 确定目录层级
      const parts = relPath.replace(/\\/g, '/').split('/')
      const fileName = parts.pop() // 最后一个是文件名
      const dirParts = parts       // 剩余的是目录层级

      // 计算相对于 docs 的目录
      const docDir = dirParts.join('/')
      const isArticle = dirParts[0] === 'article'

      const plainText = extractPlainText(content)
      const summary = fm.summary || plainText.slice(0, 200)

      // 标题：优先 frontmatter，否则从正文 # 提取，最后用文件名
      let title = fm.title
      if (!title) {
        const headingMatch = content.match(/^#\s+(.+)$/m)
        title = headingMatch ? headingMatch[1].trim() : fileName.replace('.md', '')
      }

      const item = {
        title: title,
        date: fm.date || '',
        category: fm.category || '',
        tags,
        summary,
        authors: fm.authors || '',
        filename: fileName,
        // 用于 search-index 的额外字段
        _type: isArticle ? 'article' : 'tutorial',
        _dir: docDir,
        _content: plainText,
        _url: `/docs/${docDir}/${fileName.replace('.md', '.html')}`
      }

      if (isArticle) {
        articles.push(item)
      } else {
        tutorials.push(item)
      }

      // 记录目录结构（用于 nav.json）
      const navDir = docDir
      if (!dirMap[navDir]) dirMap[navDir] = []
      dirMap[navDir].push({
        name: item.title,
        file: fileName
      })
    }
  }

  walk(DOCS_DIR, '')
  return { articles, tutorials, dirMap }
}

/**
 * 生成 articles.json
 */
function generateArticles(articles) {
  return articles.map(a => ({
    title: a.title,
    date: a.date,
    category: a.category,
    tags: a.tags,
    summary: a.summary,
    authors: a.authors,
    filename: a.filename
  })).sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 生成 search-index.json
 */
function generateSearchIndex(articles, tutorials) {
  const allItems = [...articles, ...tutorials]

  return allItems.map(item => ({
    title: item.title,
    type: item._type,
    dir: item._dir,
    file: item.filename,
    url: item._url,
    category: item.category,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
    summary: item.summary.slice(0, 200),
    content: item._content.slice(0, 2000),
    date: item.date,
    authors: item.authors
  }))
}

/**
 * 生成 nav.json
 */
function generateNav(dirMap) {
  // 收集所有教程目录（排除 article）
  const tutorialDirs = Object.keys(dirMap)
    .filter(d => !EXCLUDE_DIRS.includes(d.split('/')[0]))
    .sort()

  // 识别子分类关系
  const subCategories = {}
  const parentDirs = new Set()

  for (const dir of tutorialDirs) {
    const parts = dir.split('/')
    if (parts.length > 1) {
      const parent = parts[0]
      const child = parts.slice(1).join('/')
      if (!subCategories[parent]) subCategories[parent] = []
      subCategories[parent].push(child)
      parentDirs.add(parent)
    }
  }

  // 为每个目录获取显示名
  const displayNames = {}

  // 优先从 index.md 的 title 获取，否则用预设映射兜底
  for (const dir of tutorialDirs) {
    const files = dirMap[dir] || []
    const indexFile = files.find(f => f.file === 'index.md')
    if (indexFile && indexFile.name !== 'index' && indexFile.name !== path.basename(dir)) {
      displayNames[dir] = indexFile.name
    } else {
      displayNames[dir] = DISPLAY_NAMES[dir] || SUB_DISPLAY_NAMES[dir] || dir
    }
  }

  // 生成左侧导航
  const leftnav = {}
  const processedParents = new Set()

  for (const dir of tutorialDirs) {
    const parts = dir.split('/')
    const topDir = parts[0]

    // 跳过子分类目录，它们会被合并到父目录下
    if (parts.length > 1) continue

    // 顶级目录
    const files = (dirMap[dir] || [])
      .sort((a, b) => {
        // 按文件名排序（数字前缀会自然排序）
        return a.file.localeCompare(b.file, 'zh-CN', { numeric: true })
      })

    leftnav[dir] = files

    // 处理子分类
    if (subCategories[dir]) {
      for (const sub of subCategories[dir]) {
        const subDir = `${dir}/${sub}`
        const subFiles = (dirMap[subDir] || [])
          .sort((a, b) => a.file.localeCompare(b.file, 'zh-CN', { numeric: true }))

        leftnav[subDir] = subFiles
      }
    }

    processedParents.add(topDir)
  }

  return {
    displayNames,
    subCategories,
    excludeDirs: EXCLUDE_DIRS,
    topnavBase: TOPNAV,
    topnav: TOPNAV,
    leftnav
  }
}

// ===== 主流程 =====
function main() {
  console.log('扫描 Markdown 文件...')
  const { articles, tutorials, dirMap } = scanDocs()

  console.log(`找到 ${articles.length} 篇文章, ${tutorials.length} 篇教程`)

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // 生成 articles.json
  const articlesData = generateArticles(articles)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'articles.json'),
    JSON.stringify(articlesData, null, 2),
    'utf-8'
  )
  console.log('✓ articles.json 已生成')

  // 生成 search-index.json
  const searchData = generateSearchIndex(articles, tutorials)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'search-index.json'),
    JSON.stringify(searchData, null, 2),
    'utf-8'
  )
  console.log('✓ search-index.json 已生成')

  // 生成 nav.json
  const navData = generateNav(dirMap)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'nav.json'),
    JSON.stringify(navData, null, 2),
    'utf-8'
  )
  console.log('✓ nav.json 已生成')

  console.log('数据生成完成！')
}

main()
