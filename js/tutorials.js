// 教程卡片配置（图标和描述）
const tutorialConfig = {
    'langchain': {
        icon: '🦜',
        desc: '学习 LangChain 框架，构建强大的 AI 应用与智能代理'
    },
    'flutter': {
        icon: '📱',
        desc: '使用 Flutter 开发跨平台移动应用，一套代码多端运行'
    },
    'dart': {
        icon: '🎯',
        desc: '掌握 Dart 编程语言，为 Flutter 开发打下坚实基础'
    },
    'freport': {
        icon: '📊',
        desc: '学会阅读财务报表，看懂企业经营的真实状况'
    },
    'md': {
        icon: '📝',
        desc: '掌握 Markdown 语法，高效编写技术文档与笔记'
    },
    'openiddict': {
        icon: '🔐',
        desc: '深入理解 OpenIddict，搭建企业级 OAuth2/OpenID Connect 认证中心'
    },
    'dotnet': {
        icon: '💻',
        desc: '深入 .NET 技术栈，从认证授权到微服务架构全面掌握'
    }
};

// 加载并渲染教程卡片（支持二级目录）
async function loadTutorials() {
    const gridDiv = document.getElementById('tutorials-grid');
    
    try {
        const response = await fetch('data/nav.json');
        if (!response.ok) {
            throw new Error('导航数据加载失败');
        }
        
        const data = await response.json();
        const leftnav = data.leftnav || {};
        const displayNames = data.displayNames || {};
        const subCategories = data.subCategories || {};
        
        let html = '';
        
        // 按 displayNames 的 key 顺序遍历
        Object.keys(displayNames).forEach(type => {
            // 排除 article 目录和二级 key（二级 key 在一级卡片中展示）
            if (type === 'article' || type.includes('/')) return;
            
            const displayName = displayNames[type];
            const config = tutorialConfig[type] || { icon: '📚', desc: '点击查看更多教程内容' };
            
            // 计算文章总数（包含二级目录）
            let totalFiles = 0;
            const subs = subCategories[type];
            if (subs && subs.length > 0) {
                // 有二级目录的教程
                subs.forEach(sub => {
                    const subKey = `${type}/${sub}`;
                    const subFiles = leftnav[subKey] || [];
                    totalFiles += subFiles.length;
                });
            } else {
                totalFiles = (leftnav[type] || []).length;
            }
            
            // 卡片链接：有二级目录时跳转到第一个子目录的第一篇文章
            let cardUrl;
            if (subs && subs.length > 0) {
                const firstSubKey = `${type}/${subs[0]}`;
                const firstSubFiles = leftnav[firstSubKey] || [];
                const firstFile = firstSubFiles.length > 0 ? firstSubFiles[0].file : 'index.md';
                cardUrl = `tutorial.html?type=${encodeURIComponent(firstSubKey)}&file=${firstFile}`;
            } else {
                cardUrl = `tutorial.html?type=${type}`;
            }
            
            html += `
                <a href="${cardUrl}" class="tutorial-card" data-type="${type}">
                    <div class="tutorial-card-icon">${config.icon}</div>
                    <div class="tutorial-card-title">${displayName}</div>
                    <div class="tutorial-card-desc">${config.desc}</div>
                    <div class="tutorial-card-meta">
                        <span class="tutorial-card-count">${totalFiles} 篇文章</span>
                        <span class="tutorial-card-arrow">→</span>
                    </div>
                </a>
            `;
        });
        
        gridDiv.innerHTML = html;
    } catch (error) {
        gridDiv.innerHTML = `<div class="msg-load-error">加载失败：${error.message}</div>`;
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async () => {
    await loadNavigation();
    await loadTutorials();
});
