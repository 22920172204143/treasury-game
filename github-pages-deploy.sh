#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法: ./github-pages-deploy.sh

echo "🚀 开始部署到GitHub Pages..."

# 检查git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ 未安装git，正在安装..."
    sudo apt update
    sudo apt install git -y
fi

# 检查是否已初始化git
if [ ! -d ".git" ]; then
    echo "📦 初始化git仓库..."
    git init
    
    echo "📝 请配置git用户信息："
    read -p "请输入你的GitHub用户名: " GIT_USER
    read -p "请输入你的邮箱: " GIT_EMAIL
    
    git config user.name "$GIT_USER"
    git config user.email "$GIT_EMAIL"
fi

# 检查是否有远程仓库
if ! git remote | grep -q "origin"; then
    echo "🔗 添加远程仓库..."
    read -p "请输入你的GitHub仓库地址 (例如: https://github.com/用户名/仓库名.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ 仓库地址不能为空！"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo "✅ 已添加远程仓库: $REPO_URL"
fi

# 添加所有文件
echo "📁 添加文件..."
git add .

# 提交
echo "💾 提交更改..."
read -p "请输入提交信息 (默认: Update): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Update"}

git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo "⬆️  推送到GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 访问你的GitHub仓库页面"
echo "2. 进入 Settings → Pages"
echo "3. Source选择 main 分支，/ (root) 目录"
echo "4. 保存后等待1-2分钟"
echo "5. 访问: https://你的用户名.github.io/你的仓库名/"
echo ""

