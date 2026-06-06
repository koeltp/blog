#!/bin/sh
# Git pre-commit hook：提交前自动运行数据生成脚本
# 安装方式：将此脚本复制到 .git/hooks/pre-commit
#   cp scripts/pre-commit.sh .git/hooks/pre-commit
#   （Windows 下还需确保文件有执行权限）

echo "正在运行数据生成脚本..."

# 运行导航生成
node scripts/generate-nav.js
if [ $? -ne 0 ]; then
    echo "错误: generate-nav.js 执行失败"
    exit 1
fi

# 运行文章列表生成
node scripts/generate-articles.js
if [ $? -ne 0 ]; then
    echo "错误: generate-articles.js 执行失败"
    exit 1
fi

# 运行搜索索引生成
node scripts/generate-search-index.js
if [ $? -ne 0 ]; then
    echo "错误: generate-search-index.js 执行失败"
    exit 1
fi

# 将生成的文件加入暂存区
git add data/nav.json data/articles.json data/search-index.json

echo "数据生成完成，已自动暂存。"
