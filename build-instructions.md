# 打包成EXE可执行程序说明

## 方法一：使用electron-builder（推荐）

### 1. 安装依赖

首先确保你已经安装了Node.js（如果没有，请从 https://nodejs.org/ 下载安装）

然后在game文件夹下打开命令行，运行：

```bash
npm install
```

### 2. 打包成EXE

运行打包命令：

```bash
npm run build
```

打包完成后，会在 `dist` 文件夹下生成：
- `我的小金库 Setup 1.0.0.exe` - 安装程序
- `win-unpacked` 文件夹 - 可以直接运行的文件夹

### 3. 分发

- **安装程序**：双击 `我的小金库 Setup 1.0.0.exe` 安装
- **便携版**：将 `win-unpacked` 文件夹打包，解压后运行 `我的小金库.exe` 即可

## 方法二：使用electron-packager（简单快速）

### 1. 安装electron-packager

```bash
npm install electron-packager -g
```

### 2. 打包

在game文件夹下运行：

```bash
electron-packager . "我的小金库" --platform=win32 --arch=x64 --out=dist --overwrite
```

打包完成后，在 `dist/我的小金库-win32-x64/` 文件夹下会有 `我的小金库.exe`

## 方法三：直接运行（开发模式）

如果想先测试一下，可以直接运行：

```bash
npm start
```

这会打开Electron窗口运行游戏。

## 注意事项

1. **图标文件**：如果需要自定义图标，请准备一个 `icon.ico` 文件放在game文件夹下
2. **文件大小**：打包后的exe文件会比较大（约100-200MB），因为包含了Chromium浏览器内核
3. **首次打包**：第一次打包会下载Electron，可能需要一些时间

## 快速开始（最简单的方法）

如果你只是想快速生成exe，可以：

1. 安装Node.js
2. 在game文件夹打开命令行
3. 运行：`npm install`
4. 运行：`npm run build`
5. 等待打包完成，在dist文件夹找到exe文件

完成！🎉

