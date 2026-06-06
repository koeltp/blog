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
    }
};

// 加载并渲染教程卡片
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
        
        let html = '';
        
        // 按 displayNames 的顺序遍历
        Object.keys(displayNames).forEach(type => {
            // 排除 article 目录
            if (type === 'article') return;
            
            const files = leftnav[type] || [];
            const displayName = displayNames[type];
            const config = tutorialConfig[type] || { icon: '📚', desc: '点击查看更多教程内容' };
            
            html += `
                <a href="tutorial.html?type=${type}" class="tutorial-card" data-type="${type}">
                    <div class="tutorial-card-icon">${config.icon}</div>
                    <div class="tutorial-card-title">${displayName}</div>
                    <div class="tutorial-card-desc">${config.desc}</div>
                    <div class="tutorial-card-meta">
                        <span class="tutorial-card-count">${files.length} 篇文章</span>
                        <span class="tutorial-card-arrow">→</span>
                    </div>
                </a>
            `;
        });
        
        gridDiv.innerHTML = html;
    } catch (error) {
        gridDiv.innerHTML = `<div style="text-align: center; padding: 4rem; color: red;">加载失败：${error.message}</div>`;
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', async () => {
    await loadNavigation();
    await loadTutorials();
});
