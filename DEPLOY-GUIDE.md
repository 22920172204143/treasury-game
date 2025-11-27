# 部署指南 - 网页版和App版

## 🌐 第一部分：让所有人都能访问网页

### 方案一：GitHub Pages（免费，最简单）⭐推荐

1. **创建GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/我的小金库.git
   git push -u origin main
   ```

2. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `main` 分支，`/root` 目录
   - 保存后几分钟，访问：`https://你的用户名.github.io/我的小金库/`

3. **优点**：完全免费，自动HTTPS，全球CDN加速

### 方案二：Netlify（免费，最简单）⭐推荐

1. **访问** https://www.netlify.com
2. **拖拽** `game` 文件夹到Netlify
3. **自动部署**，获得一个 `xxx.netlify.app` 的链接
4. **优点**：免费，自动部署，支持自定义域名

### 方案三：Vercel（免费，快速）

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   cd game
   vercel
   ```

3. **优点**：免费，全球CDN，自动HTTPS

### 方案四：使用云服务器

如果需要服务器端功能（数据库等），可以租用：
- **阿里云**：https://www.aliyun.com
- **腾讯云**：https://cloud.tencent.com
- **AWS**：https://aws.amazon.com

部署步骤：
```bash
# 在服务器上安装nginx
sudo apt install nginx

# 复制文件到nginx目录
sudo cp -r game/* /var/www/html/

# 访问服务器IP即可
```

### 方案五：内网穿透（临时测试）

使用ngrok快速测试：
```bash
# 安装ngrok
# 下载：https://ngrok.com/download

# 启动本地服务器
python -m http.server 8000

# 另一个终端运行
ngrok http 8000

# 会得到一个公网链接，如：https://xxxx.ngrok.io
```

---

## 📱 第二部分：打包成安卓/苹果App

### 方案一：Capacitor（推荐，最简单）⭐

Capacitor可以将网页直接打包成原生App，支持iOS和Android。

#### 安装Capacitor

```bash
cd ~/work/game

# 安装Capacitor CLI
npm install -g @capacitor/cli

# 初始化Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# 安装平台支持
npm install @capacitor/android @capacitor/ios
```

#### 配置Capacitor

创建 `capacitor.config.json`：
```json
{
  "appId": "com.mygameroom.treasury",
  "appName": "我的小金库",
  "webDir": ".",
  "server": {
    "androidScheme": "https"
  }
}
```

#### 添加平台

```bash
# 添加Android平台
npx cap add android

# 添加iOS平台（需要Mac）
npx cap add ios
```

#### 构建和运行

```bash
# 同步文件到原生项目
npx cap sync

# Android - 在Android Studio中打开
npx cap open android

# iOS - 在Xcode中打开（需要Mac）
npx cap open ios
```

#### 打包APK（Android）

```bash
cd android
./gradlew assembleRelease

# APK文件在：android/app/build/outputs/apk/release/
```

#### 打包IPA（iOS）

需要在Mac上使用Xcode：
1. 打开 `ios/App.xcworkspace`
2. Product → Archive
3. 导出IPA文件

### 方案二：Cordova（传统方案）

```bash
# 安装Cordova
npm install -g cordova

# 创建项目
cordova create myapp com.mygameroom.treasury "我的小金库"
cd myapp

# 复制文件
cp -r ../game/* www/

# 添加平台
cordova platform add android
cordova platform add ios

# 构建
cordova build android
cordova build ios
```

### 方案三：PWA（渐进式Web应用）

将网页做成PWA，用户可以"添加到主屏幕"，体验类似App。

需要添加：
- `manifest.json` - 应用清单
- Service Worker - 离线支持
- 图标文件

---

## 🎯 推荐方案总结

### 网页部署：GitHub Pages 或 Netlify
- ✅ 完全免费
- ✅ 设置简单
- ✅ 全球访问

### App打包：Capacitor
- ✅ 代码无需改动
- ✅ 支持iOS和Android
- ✅ 可以访问原生功能（相机、GPS等）

---

## 📝 快速开始

### 网页部署（5分钟）

**使用Netlify：**
1. 访问 https://www.netlify.com
2. 注册账号（可以用GitHub账号）
3. 拖拽 `game` 文件夹
4. 获得链接，分享给所有人！

### App打包（需要Android Studio）

**Android App：**
1. 安装Android Studio
2. 运行上面的Capacitor命令
3. 在Android Studio中打开项目
4. 点击运行，生成APK

**iOS App：**
1. 需要Mac电脑
2. 安装Xcode
3. 运行Capacitor命令
4. 在Xcode中打包

---

## 💡 提示

- **网页版**：最简单，推荐先做这个
- **Android App**：需要Android Studio，免费
- **iOS App**：需要Mac + Xcode，需要Apple开发者账号（$99/年）才能发布到App Store

需要我帮你配置哪个方案？我可以创建具体的配置文件！

