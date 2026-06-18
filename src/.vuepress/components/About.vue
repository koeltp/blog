<template>
    <div class="about-page">
        <!-- 个人介绍 Hero -->
        <section class="about-hero">
            <div class="about-hero-content">
                <img :src="avatarUrl" alt="TaiPi" class="about-avatar" />
                <div class="about-intro">
                    <h1 class="about-name">
                        TaiPi
                        <span class="open-badge"><span class="open-dot"></span> Open to Work</span>
                    </h1>
                    <p class="about-tagline">.NET 高级工程师 / 10年+开发经验</p>
                    <p class="about-bio">
                        希望能像鸟一样随着季节迁徙。<br />
                        专注 .NET 后端架构、微服务，兼顾前端与跨端开发。<br />
                        写代码是工作，写教程是乐趣，投资是爱好。<br />
                        <span class="about-looking">🎯 目前正在寻找新机会，深圳 / 远程均可，随时到岗。</span>
                    </p>
                    <div class="about-links">
                        <a href="https://github.com/koeltp" target="_blank" class="about-link">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path
                                    d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                        <a href="https://www.taipi.top" target="_blank" class="about-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"
                                height="18">
                                <circle cx="12" cy="12" r="10" />
                                <path
                                    d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                            TaiPi
                        </a>
                        <a href="https://www.byteepoch.com" target="_blank" class="about-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"
                                height="18">
                                <circle cx="12" cy="12" r="10" />
                                <path
                                    d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                            ByteEpoch
                        </a>
                        <a href="https://sso.taipi.top" target="_blank" class="about-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"
                                height="18">
                                <circle cx="12" cy="12" r="10" />
                                <path
                                    d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                            TP OAuth
                        </a>
                        <a href="mailto:tp@taipi.top" class="about-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18"
                                height="18">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                            </svg>
                            tp@taipi.top
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <main class="about-content">
            <!-- 时间线 -->
            <section class="about-section">
                <h2>经历</h2>
                <div class="timeline">
                    <div v-for="item in timeline" :key="item.year" class="timeline-item">
                        <div class="timeline-year">{{ item.year }}</div>
                        <div class="timeline-body">
                            <h3>{{ item.title }}</h3>
                            <p>{{ item.desc }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 技术栈 -->
            <section class="about-section">
                <h2>技术栈</h2>
                <div class="skill-categories">
                    <div v-for="cat in techGroups" :key="cat.label" class="skill-category">
                        <span class="skill-category-label">{{ cat.label }}</span>
                        <div class="skill-category-tags">
                            <span v-for="skill in cat.items" :key="skill.name" class="skill-tag"
                                :style="{ '--skill-color': skill.color }">
                                <i :class="skill.icon" class="skill-icon"></i>
                                {{ skill.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 项目展示 -->
            <section class="about-section">
                <h2>开源项目</h2>
                <div class="projects-grid">
                    <a v-for="project in projects" :key="project.name" :href="project.url" target="_blank"
                        class="project-card">
                        <div class="project-header">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" class="project-icon">
                                <path
                                    d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span class="project-name">{{ project.name }}</span>
                            <span v-if="project.lang" class="project-lang" :class="langClass(project.lang)">{{
                                project.lang }}</span>
                        </div>
                        <p class="project-desc">{{ project.desc }}</p>
                        <div v-if="project.site" class="project-site">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14"
                                height="14">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                            {{ project.site }}
                        </div>
                    </a>
                </div>
            </section>

            <!-- 网站与产品 -->
            <section class="about-section">
                <h2>网站与产品</h2>
                <div class="sites-grid">
                    <a v-for="site in sites" :key="site.name" :href="site.url" target="_blank" class="site-card">
                        <div class="site-icon" :style="{ background: site.color }">{{ site.emoji }}</div>
                        <div class="site-info">
                            <h3>{{ site.name }}</h3>
                            <p>{{ site.desc }}</p>
                        </div>
                    </a>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
const avatarUrl = 'https://avatars.githubusercontent.com/u/2775276?v=4'

// 经历时间线
const timeline = [
    { year: '2025-如今', title: '自由职业', desc: '专注全栈开发，涵盖 .NET 后端、Flutter 跨端、AI 应用集成' },
    { year: '2019-2025', title: '香港某某公司 · 高级工程师', desc: '负责外汇交易管理系统架构与需求分析，主导微服务设计与第三方对接' },
    { year: '2017-2019', title: '海钜信达 · 高级工程师', desc: '信贷业务管理系统开发，负责三方接口设计与资金账户模块' },
    { year: '2016-2017', title: '有芯电子 · 高级工程师', desc: '电子元器件电商平台开发，日均查询5万次，负责用户中心与支付重构' },
    { year: '2015-2016', title: '横溢科技 · 高级工程师', desc: '参与多个企业级应用开发，积累 .NET 全栈经验' },
    { year: '2013-2015', title: '软商科技 · 软件工程师', desc: 'VC营销平台开发，负责微餐饮、微官网等产品的设计与开发' },
    { year: '2011-2013', title: '经理人传媒 · 软件工程师', desc: '开启编程之路，积累早期开发经验' },
]

// 技术栈分组
const techGroups = [
    {
        label: '后端',
        items: [
            { name: '.NET', icon: 'fab fa-microsoft', color: '#512bd4' },
            { name: 'C#', icon: 'fas fa-code', color: '#68217a' },
            { name: 'ASP.NET Core', icon: 'fas fa-server', color: '#512bd4' },
            { name: 'EF Core', icon: 'fas fa-database', color: '#007acc' },
            { name: 'gRPC', icon: 'fas fa-network-wired', color: '#24a57a' },
            { name: 'Web API', icon: 'fas fa-plug', color: '#0369a1' },
        ]
    },
    {
        label: '数据库',
        items: [
            { name: 'MySQL', icon: 'fas fa-database', color: '#4479a1' },
            { name: 'SQL Server', icon: 'fas fa-database', color: '#cc2927' },
            { name: 'Oracle', icon: 'fas fa-database', color: '#f80000' },
            { name: 'Redis', icon: 'fas fa-bolt', color: '#dc382d' },
        ]
    },
    {
        label: '前端',
        items: [
            { name: 'Vue', icon: 'fab fa-vuejs', color: '#42b883' },
            { name: 'TypeScript', icon: 'fas fa-code', color: '#3178c6' },
            { name: 'JavaScript', icon: 'fab fa-js', color: '#f7df1e' },
            { name: 'Element Plus', icon: 'fas fa-cube', color: '#409eff' },
        ]
    },
    {
        label: '移动端',
        items: [
            { name: 'Flutter', icon: 'fas fa-mobile-alt', color: '#02569b' },
            { name: 'Dart', icon: 'fas fa-dart', color: '#0175c2' },
        ]
    },
    {
        label: 'AI',
        items: [
            { name: 'Python', icon: 'fab fa-python', color: '#3776ab' },
            { name: 'LangChain', icon: 'fas fa-link', color: '#1c3d5a' },
            { name: 'RAG', icon: 'fas fa-search', color: '#059669' },
            { name: 'DeepSeek', icon: 'fas fa-robot', color: '#4f46e5' },
        ]
    },
    {
        label: '工具',
        items: [
            { name: 'Docker', icon: 'fab fa-docker', color: '#2496ed' },
            { name: 'Nginx', icon: 'fas fa-server', color: '#009639' },
            { name: 'RabbitMQ', icon: 'fas fa-envelope', color: '#ff6600' },
            { name: 'Git', icon: 'fab fa-git-alt', color: '#f05032' },
            { name: 'Linux', icon: 'fab fa-linux', color: '#333' },
        ]
    },
]

// 开源项目
const projects = [
    { name: 'blog', desc: '个人技术博客，基于 VuePress 2 构建，涵盖 .NET、Flutter、Dart 等技术教程', lang: 'Vue', url: 'https://github.com/koeltp/blog', site: 'taipi.top' },
    { name: 'tpsso', desc: '基于 OpenIddict 的前后端分离 SSO 单点登录项目', lang: 'C#', url: 'https://github.com/koeltp/tpsso', site: 'admin.taipi.top' },
    { name: 'TPAdminApi', desc: '后台管理系统后端，基于 .NET 的权限管理框架', lang: 'C#', url: 'https://gitlab.com/taipi/tpadminapi' },
    { name: 'TPAdminWeb', desc: '后台管理系统前端，基于 Vue + TypeScript 的管理后台界面', lang: 'Vue', url: 'https://gitlab.com/taipi/tpadminweb' },
    { name: 'tz', desc: '投资周报自动化采集与分析系统', lang: 'JavaScript', url: 'https://github.com/koeltp/tz', site: 'tz.taipi.top' },
    { name: 'TPCore', desc: '.NET 核心类库，通用基础设施与工具集', lang: 'C#', url: 'https://github.com/koeltp/TPCore' }
]

// 网站与产品
const sites = [
    { name: 'TP SSO', desc: '基于 OpenIddict 的前后端分离 SSO 单点登录项目', url: 'https://admin.taipi.top', emoji: 'S', color: '#ffa500' },
    { name: 'TaiPi.Top', desc: '技术博客与教程站', url: 'https://www.taipi.top', emoji: 'T', color: '#4a3b2c' },
    { name: 'TZ.TaiPi.Top', desc: '投资周报与数据分析', url: 'https://tz.taipi.top', emoji: 'Z', color: '#0369a1' },
    { name: '字节时代', desc: '字节时代，技术探索', url: 'https://www.byteepoch.com', emoji: 'B', color: '#7c3aed' },
    { name: 'AI 导航站', desc: 'AI 与编程资源导航站', url: 'https://nav.taipi.top', emoji: 'N', color: '#059669' },
    { name: '开发者工具箱', desc: '开发者在线工具箱', url: 'https://tools.taipi.top', emoji: 'S', color: '#d97706' },
    { name: '结了么', desc: '免注册的真诚交友平台', url: 'https://www.jieleme.top', emoji: 'J', color: '#e11d48' },

]

function langClass(lang) {
    const map = { 'C#': 'lang-csharp', 'Vue': 'lang-vue', 'JavaScript': 'lang-js', 'Python': 'lang-python', 'Dart': 'lang-dart' }
    return map[lang] || ''
}
</script>

<style scoped>
.about-page {
    background: var(--vp-c-bg, #ffffff);
}

/* ===== Hero ===== */
.about-hero {
    background: #fef9e8;
    border-bottom: 1px solid #f0e2c5;
    padding: 5rem 2rem 4rem;
}

.about-hero-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 3rem;
}

.about-avatar {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 4px solid #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.about-intro {
    flex: 1;
}

.about-name {
    font-size: 2.5rem;
    font-weight: 700;
    color: #4a3b2c;
    margin: 0 0 0.5rem;
}

.about-tagline {
    font-size: 1.1rem;
    color: #7a6b55;
    margin: 0 0 1rem;
}

.about-bio {
    font-size: 1rem;
    color: #6b5e4a;
    line-height: 1.8;
    margin: 0 0 1.5rem;
}

.about-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.about-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: rgba(74, 59, 44, 0.06);
    border: 1px solid rgba(74, 59, 44, 0.1);
    color: #4a3b2c;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.25s ease, transform 0.25s ease;
}

.about-link:hover {
    background: rgba(74, 59, 44, 0.12);
    transform: translateY(-2px);
}

/* ===== 求职状态徽章 ===== */
.open-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #166534;
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    border-radius: 20px;
    padding: 0.2rem 0.75rem;
    vertical-align: middle;
    margin-left: 0.5rem;
    letter-spacing: 0.03em;
}

.open-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {

    0%,
    100% {
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    }

    50% {
        opacity: 0.6;
        box-shadow: 0 0 0 5px rgba(34, 197, 94, 0);
    }
}

.about-looking {
    display: inline;
    font-size: 0.9rem;
    color: #166534;
    background: #dcfce7;
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
}

/* ===== 内容区 ===== */
.about-content {
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem 2rem 4rem;
}

.about-section {
    margin-bottom: 3.5rem;
}

.about-section h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 1.5rem;
}

/* ===== 时间线 ===== */
.timeline {
    position: relative;
    padding-left: 2rem;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: #e2e8f0;
}

.timeline-item {
    position: relative;
    padding-bottom: 2rem;
    display: flex;
    gap: 1.5rem;
}

.timeline-item:last-child {
    padding-bottom: 0;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -2rem;
    top: 6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4a3b2c;
    border: 2px solid #fef9e8;
    z-index: 1;
}

.timeline-year {
    font-size: 1rem;
    font-weight: 700;
    color: #4a3b2c;
    min-width: 50px;
    flex-shrink: 0;
    padding-top: 1px;
}

.timeline-body h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.3rem;
}

.timeline-body p {
    font-size: 0.95rem;
    color: #64748b;
    margin: 0;
    line-height: 1.6;
}

/* ===== 技术栈 ===== */
.skill-categories {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.skill-category {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.skill-category-label {
    flex-shrink: 0;
    width: 60px;
    padding-top: 0.45rem;
    text-align: right;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
}

.skill-category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    flex: 1;
}

.skill-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-weight: 500;
    font-size: 0.85rem;
    color: #334155;
    transition: border-color 0.25s ease, color 0.25s ease;
    cursor: default;
    font-family: 'JetBrains Mono', monospace;
}

.skill-icon {
    font-size: 0.95rem;
    color: var(--skill-color, #64748b);
    flex-shrink: 0;
}

.skill-tag:hover {
    border-color: var(--skill-color, #64748b);
    color: var(--skill-color, #334155);
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-3px);
    box-shadow: 0 6px 16px -4px color-mix(in srgb, var(--skill-color) 30%, transparent);
}

/* ===== 项目卡片 ===== */
.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;
}

.project-card {
    display: block;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    text-decoration: none;
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
    background: #fff;
}

.project-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-3px);
    border-color: #cbd5e1;
}

.project-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0.75rem;
}

.project-icon {
    color: #475569;
    flex-shrink: 0;
}

.project-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
}

.project-lang {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.lang-csharp {
    background: #e8d5b7;
    color: #68217a;
}

.lang-vue {
    background: #e7f5e9;
    color: #42b883;
}

.lang-js {
    background: #fff8e1;
    color: #f0db4f;
}

.lang-python {
    background: #e8f0fe;
    color: #306998;
}

.lang-dart {
    background: #e3f2fd;
    color: #0175c2;
}

.project-desc {
    font-size: 0.9rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0;
}

.project-site {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: #3b82f6;
}

/* ===== 网站卡片 ===== */
.sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
}

.site-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    text-decoration: none;
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
    background: #fff;
}

.site-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-3px);
    border-color: #cbd5e1;
}

.site-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}

.site-info h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem;
}

.site-info p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
    .about-hero {
        padding: 3rem 1.25rem 2.5rem;
    }

    .about-hero-content {
        flex-direction: column;
        text-align: center;
        gap: 1.5rem;
    }

    .about-avatar {
        width: 100px;
        height: 100px;
    }

    .about-name {
        font-size: 2rem;
    }

    .about-links {
        justify-content: center;
    }

    .open-badge {
        display: flex;
        margin-left: 0;
        margin-top: 0.5rem;
    }

    .about-content {
        padding: 2rem 1rem 3rem;
    }

    .about-section h2 {
        font-size: 1.5rem;
    }

    .projects-grid {
        grid-template-columns: 1fr;
    }

    .sites-grid {
        grid-template-columns: 1fr;
    }

    .tech-groups {
        grid-template-columns: 1fr;
    }

    .skill-category {
        flex-direction: column;
        gap: 0.5rem;
    }

    .skill-category-label {
        text-align: left;
        width: auto;
        padding-top: 0;
    }
}
</style>
