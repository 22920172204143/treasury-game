# GitHub Pages 部署指南

## 📋 步骤一：安装Git（如果还没有）

```bash
sudo apt update
sudo apt install git -y
git --version
```

## 📋 步骤二：配置Git（首次使用）

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

## 📋 步骤三：在GitHub上创建仓库

1. 访问 https://github.com
2. 登录你的账号（如果没有，先注册）
3. 点击右上角的 **+** → **New repository**
4. 填写信息：
   - Repository name: `my-treasury-game`（或你喜欢的名字）
   - Description: `我的小金库 - 3D探索游戏`
   - 选择 **Public**（公开，才能免费使用GitHub Pages）
   - **不要**勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

## 📋 步骤四：上传代码到GitHub

在Ubuntu终端中，进入game文件夹，执行：

```bash
cd ~/work/game

# 初始化git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 我的小金库游戏"

# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

**注意**：第一次推送可能需要输入GitHub用户名和密码（或Personal Access Token）

## 📋 步骤五：启用GitHub Pages

1. 回到GitHub仓库页面
2. 点击 **Settings**（设置）
3. 左侧菜单找到 **Pages**
4. 在 **Source** 部分：
   - Branch: 选择 `main`
   - Folder: 选择 `/ (root)`
5. 点击 **Save**
6. 等待1-2分钟，GitHub会生成你的网站链接

## 📋 步骤六：访问你的网站

GitHub Pages的链接格式：
```
https://你的用户名.github.io/你的仓库名/
```

例如：
```
https://qin.github.io/my-treasury-game/
```

## 🔄 更新网站

以后修改代码后，只需要：

```bash
cd ~/work/game

# 添加修改的文件
git add .

# 提交
git commit -m "更新说明"

# 推送到GitHub
git push
```

推送后，GitHub Pages会自动更新（可能需要1-2分钟）

## 📝 完整命令示例

```bash
# 1. 安装git（如果还没有）
sudo apt install git -y

# 2. 配置git
git config --global user.name "qin"
git config --global user.email "qin@example.com"

# 3. 进入项目文件夹
cd ~/work/game

# 4. 初始化git
git init

# 5. 添加文件
git add .

# 6. 提交
git commit -m "Initial commit: 我的小金库游戏"

# 7. 添加远程仓库（替换成你的实际仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 8. 推送
git branch -M main
git push -u origin main
```

## ⚠️ 常见问题

### 问题1：推送时要求输入密码

**解决方案**：使用Personal Access Token代替密码

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. 勾选 `repo` 权限
4. 生成后复制token
5. 推送时，用户名填GitHub用户名，密码填token

### 问题2：GitHub Pages显示404

- 检查仓库是否为Public（公开）
- 检查Settings → Pages中的配置
- 确保index.html在根目录
- 等待几分钟，GitHub需要时间部署

### 问题3：网站显示但游戏不运行

- 检查浏览器控制台（F12）看是否有错误
- 确保three.min.js文件已上传
- 检查文件路径是否正确

## 🎉 完成！

部署成功后，你就可以把链接分享给任何人，他们都能访问你的游戏了！

