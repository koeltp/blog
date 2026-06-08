// 更新 Markdown 文件中的旧链接格式
// tutorial.html?type=xxx&file=xxx -> /docs/xxx/xxx.html
// articles/detail.html?file=xxx -> /docs/article/xxx.html (去掉.md后缀加.html)
const fs = require('fs')
const path = require('path')

const srcDocs = path.join(__dirname, '..', 'src', 'docs')

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.md')) {
      fixLinks(fullPath)
    }
  }
}

function fixLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // 替换 tutorial.html?type=xxx&file=xxx 格式
  content = content.replace(
    /\[([^\]]*)\]\(tutorial\.html\?type=([^&]+)&file=([^)]+)\)/g,
    (match, text, type, file) => {
      // URL 解码
      type = decodeURIComponent(type)
      file = decodeURIComponent(file)
      // 去掉 .md 后缀加 .html
      const htmlFile = file.replace(/\.md$/, '.html')
      modified = true
      return `[${text}](/docs/${type}/${htmlFile})`
    }
  )

  // 替换 articles/detail.html?file=xxx 格式
  content = content.replace(
    /\[([^\]]*)\]\(articles\/detail\.html\?file=([^)]+)\)/g,
    (match, text, file) => {
      file = decodeURIComponent(file)
      const htmlFile = file.replace(/\.md$/, '.html')
      modified = true
      return `[${text}](/docs/article/${htmlFile})`
    }
  )

  // 替换 ../../article/xxx.md 格式的相对链接
  content = content.replace(
    /\[([^\]]*)\]\(\.\.\/\.\.\/article\/([^)]+)\)/g,
    (match, text, file) => {
      const htmlFile = file.replace(/\.md$/, '.html')
      modified = true
      return `[${text}](/docs/article/${htmlFile})`
    }
  )

  // 替换 ../openiddict/xxx.md 格式的相对链接
  content = content.replace(
    /\[([^\]]*)\]\(\.\.\/([^)]+\.md)\)/g,
    (match, text, file) => {
      const htmlFile = file.replace(/\.md$/, '.html')
      modified = true
      return `[${text}](/docs/${htmlFile})`
    }
  )

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`更新链接: ${filePath}`)
  }
}

processDir(srcDocs)
console.log('链接更新完成！')
