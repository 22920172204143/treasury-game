#!/bin/bash

echo "🚀 开始设置App打包环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装Node.js，请先安装：sudo apt install nodejs npm"
    exit 1
fi

# 设置npm镜像源
echo "🔧 配置npm镜像源..."
npm config set registry https://registry.npmmirror.com

# 安装Capacitor
echo "📦 安装Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 初始化Capacitor（如果还没有）
if [ ! -f "capacitor.config.json" ]; then
    echo "⚙️  初始化Capacitor配置..."
    npx cap init "我的小金库" "com.mygameroom.treasury" --web-dir="."
fi

# 添加平台
echo "📱 添加Android平台..."
npx cap add android

echo "✅ 设置完成！"
echo ""
echo "📝 下一步："
echo "1. 安装Android Studio: https://developer.android.com/studio"
echo "2. 运行: npx cap sync"
echo "3. 运行: npx cap open android"
echo "4. 在Android Studio中点击运行，生成APK"

