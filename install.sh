#!/bin/bash

# 设置npm镜像源（淘宝镜像）
echo "🔧 配置npm镜像源..."
npm config set registry https://registry.npmmirror.com
npm config set electron_mirror https://npmmirror.com/mirrors/electron/

# 验证配置
echo "✅ 当前npm镜像源："
npm config get registry

# 安装依赖
echo "📦 开始安装依赖..."
npm install

echo "✨ 安装完成！"

