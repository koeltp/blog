// 为所有教程和文章 Markdown 文件添加 VuePress front matter
const fs = require('fs')
const path = require('path')

const srcDocs = path.join(__dirname, '..', 'src', 'docs')

// 递归处理所有 .md 文件
function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath)
    } else if (entry.name.endsWith('.md')) {
      addFrontMatter(fullPath, dir)
    }
  }
}

function addFrontMatter(filePath, dir) {
  let content = fs.readFileSync(filePath, 'utf-8')

  // 判断是文章还是教程
  const layout = 'TutorialLayout'

  // 已有 front matter
  if (content.startsWith('---')) {
    // 检查是否已有 layout
    if (content.includes('layout:')) {
      // 确认 layout 值正确
      const currentLayout = content.match(/^layout:\s*(.+)$/m)?.[1]?.trim()
      if (currentLayout === layout) return
      // 修正 layout 值
      content = content.replace(/^layout:\s*.+$/m, `layout: ${layout}`)
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`修正 layout: ${filePath} -> ${layout}`)
      return
    }
    // 在现有 front matter 中添加 layout（兼容 \r\n 和 \n 换行符）
    content = content.replace(/^---\r?\n/, `---\nlayout: ${layout}\n`)
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`更新: ${filePath} -> ${layout}`)
    return
  }

  // 添加 front matter
  content = `---\nlayout: ${layout}\n---\n\n${content}`
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`添加: ${filePath} -> ${layout}`)
}

processDir(srcDocs)
console.log('完成！')
