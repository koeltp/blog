const fs = require('fs');
const path = require('path');

// 检查文章页面
const articleDir = path.join('dist', 'docs', 'article');
if (fs.existsSync(articleDir)) {
  const files = fs.readdirSync(articleDir);
  const htmlFile = files.find(f => f.endsWith('.html'));
  if (htmlFile) {
    const html = fs.readFileSync(path.join(articleDir, htmlFile), 'utf-8');
    console.log('=== 文章详情页 ===');
    console.log('包含 nav-links (导航栏):', html.includes('nav-links'));
    console.log('包含 sidebar:', html.includes('class="sidebar"'));
    console.log('包含 tutorial-layout:', html.includes('tutorial-layout'));
    console.log('包含 article-layout:', html.includes('article-layout'));
    console.log('包含 right-nav (右侧目录):', html.includes('right-nav'));
  }
}

// 检查文章列表页
const articlesHtml = fs.readFileSync('dist/articles/index.html', 'utf-8');
console.log('\n=== 文章列表页 ===');
console.log('包含 nav-links (导航栏):', articlesHtml.includes('nav-links'));
console.log('包含 NavBar:', articlesHtml.includes('search-btn'));

// 检查教程页面
const flutterDir = path.join('dist', 'docs', 'flutter');
if (fs.existsSync(flutterDir)) {
  const files = fs.readdirSync(flutterDir);
  const htmlFile = files.find(f => f.endsWith('.html'));
  if (htmlFile) {
    const html = fs.readFileSync(path.join(flutterDir, htmlFile), 'utf-8');
    console.log('\n=== 教程详情页 ===');
    console.log('包含 nav-links (导航栏):', html.includes('nav-links'));
    console.log('包含 sidebar:', html.includes('class="sidebar"'));
    console.log('包含 tutorial-layout:', html.includes('tutorial-layout'));
  }
}
