<template>
  <div class="home-page">
    <!-- 星空 Hero 区域 -->
    <div class="hero">
      <div class="stars">
        <span v-for="i in 10" :key="i" class="star"></span>
      </div>
      <div class="hero-content">
        <h1>欢迎来到太皮</h1>
        <p>这里分享各种技术教程和生活点滴，皮一下很开心！</p>
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="content-section">
      <!-- 关于 -->
      <div class="section about-section">
        <h2>关于太皮</h2>
        <p>嗨，我是太皮，一个热爱技术和生活的开发者。这里分享技术教程、编程心得、生活感悟，希望能给你带来一些启发和帮助。</p>
        <div class="social-links">
          <a href="#" class="social-link">GitHub</a>
          <a href="#" class="social-link">Twitter</a>
          <a href="#" class="social-link">Email</a>
        </div>
      </div>

      <!-- 最近更新 -->
      <div class="section latest-section">
        <h2>最近更新</h2>
        <div class="latest-items">
          <div v-for="article in latestArticles" :key="article.filename" class="latest-item">
            <div class="article-meta">
              <span :class="['article-category', article.category || 'tech']">{{ getCategoryLabel(article.category) }}</span>
              <span class="article-date">{{ formatDate(article.date) }}</span>
            </div>
            <h3>{{ article.title }}</h3>
            <p>{{ article.summary || '' }}</p>
            <div class="article-tags">
              <span v-for="tag in (article.tags || []).slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              <RouterLink :to="`/docs/article/${article.filename.replace('.md', '.html')}`" class="read-more">阅读更多 →</RouterLink>
            </div>
          </div>
          <div v-if="latestArticles.length === 0" class="latest-item"><p>暂无文章</p></div>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="section skills-section">
        <h2>技术栈</h2>
        <div class="skills">
          <span v-for="skill in skills" :key="skill" class="skill-tag">{{ skill }}</span>
        </div>
      </div>
    </main>
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

const skills = ['Python', 'JavaScript', 'Flutter', 'Dart', 'LangChain', 'React', 'Node.js', 'Docker']
const latestArticles = ref([])

onMounted(async () => {
  try {
    const resp = await fetch('/data/articles.json')
    const articles = await resp.json()
    latestArticles.value = articles
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
  } catch (e) {
    console.warn('加载最新文章失败:', e)
  }
})
</script>

<style scoped>
.hero {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  color: white;
  padding: 0 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: none;
  border-radius: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 补偿固定导航栏的高度 */
  margin-top: -64px;
  padding-top: 64px;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 0;
}

.hero::after {
  content: '';
  position: absolute;
  top: 20%; left: 20%;
  width: 60%; height: 60%;
  background: radial-gradient(circle, rgba(100,149,237,0.4) 0%, rgba(0,0,0,0) 70%);
  animation: float 15s ease-in-out infinite;
  z-index: 0;
  filter: blur(30px);
}

@keyframes float {
  0%   { transform: translate(0,0) scale(1); opacity: 0.3; }
  25%  { transform: translate(20%,20%) scale(1.1); opacity: 0.5; }
  50%  { transform: translate(0,40%) scale(1); opacity: 0.3; }
  75%  { transform: translate(-20%,20%) scale(0.9); opacity: 0.4; }
  100% { transform: translate(0,0) scale(1); opacity: 0.3; }
}

.stars {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1;
}

.star {
  position: absolute;
  width: 2px; height: 2px;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

.star:nth-child(1)  { top: 10%; left: 20%; animation-delay: 0s; }
.star:nth-child(2)  { top: 30%; left: 70%; animation-delay: 0.5s; }
.star:nth-child(3)  { top: 50%; left: 30%; animation-delay: 1s; }
.star:nth-child(4)  { top: 70%; left: 80%; animation-delay: 1.5s; }
.star:nth-child(5)  { top: 20%; left: 50%; animation-delay: 2s; }
.star:nth-child(6)  { top: 60%; left: 10%; animation-delay: 2.5s; }
.star:nth-child(7)  { top: 80%; left: 40%; animation-delay: 0.2s; }
.star:nth-child(8)  { top: 40%; left: 90%; animation-delay: 0.7s; }
.star:nth-child(9)  { top: 90%; left: 60%; animation-delay: 1.2s; }
.star:nth-child(10) { top: 15%; left: 85%; animation-delay: 1.7s; }

@keyframes twinkle {
  0%, 100% { transform: scale(0); opacity: 0; }
  50%      { transform: scale(1); opacity: 1; }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.hero p {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.8);
  max-width: 800px;
  margin: 0 auto;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.content-section .section {
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin-bottom: 2.5rem;
  box-shadow: none;
  border: none;
}

.section h2 {
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: -8px; left: 0;
  width: 60px; height: 4px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  border-radius: 2px;
}

.about-section p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #495057;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.social-link:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.latest-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.latest-item {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.latest-item:hover {
  border-color: #ff6b35;
  box-shadow: 0 8px 20px rgba(255,107,53,0.1);
  transform: translateY(-5px);
}

.latest-item h3 {
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.latest-item p {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
}

.read-more {
  color: #ff6b35;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
}

.read-more:hover {
  transform: translateX(5px);
  color: #f7931e;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0369a1;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border: 1px solid #bae6fd;
}

.skill-tag:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14,165,233,0.3);
}

@media (max-width: 768px) {
  .hero { padding: 64px 1rem 0; }
  .hero h1 { font-size: 2.5rem; }
  .hero p { font-size: 1.2rem; }
  .content-section { padding: 1rem; }
  .section h2 { font-size: 1.5rem; }
  .latest-items { grid-template-columns: 1fr; }
  .social-links { flex-direction: column; }
  .social-link { text-align: center; }
}
</style>
