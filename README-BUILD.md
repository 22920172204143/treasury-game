# 打包EXE说明

## 解决网络问题

如果遇到网络超时，请使用国内镜像源：

### 方法一：使用安装脚本（推荐）

```bash
chmod +x install.sh
./install.sh
```

### 方法二：手动设置镜像源

```bash
# 设置npm镜像源
npm config set registry https://registry.npmmirror.com
npm config set electron_mirror https://npmmirror.com/mirrors/electron/

# 验证配置
npm config get registry

# 安装依赖
npm install
```

### 方法三：使用cnpm（淘宝npm客户端）

```bash
# 安装cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用cnpm安装
cnpm install
```

## 打包步骤

安装完依赖后：

```bash
# 开发模式运行（测试）
npm start

# 打包成EXE
npm run build
```

打包完成后，在 `dist` 文件夹下会生成：
- `我的小金库 Setup 1.0.0.exe` - 安装程序
- `win-unpacked/` - 便携版文件夹

## 注意事项

1. **网络问题**：如果下载electron失败，确保：
   - 已配置镜像源（见上方）
   - 网络连接正常
   - 防火墙未阻止

2. **Ubuntu打包Windows EXE**：
   - 在Ubuntu上打包会生成Linux版本
   - 如需Windows EXE，需要在Windows环境下打包
   - 或使用Wine + electron-builder的交叉编译

3. **文件大小**：打包后的exe约100-200MB（包含Chromium内核）

## 如果还是失败

可以尝试：
1. 使用代理
2. 手动下载electron二进制文件
3. 使用yarn代替npm：`yarn install`

