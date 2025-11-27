const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'icon.ico'), // 如果有图标的话
        title: '我的小金库 - 3D探索游戏',
        backgroundColor: '#667eea'
    });

    // 加载index.html
    mainWindow.loadFile('index.html');

    // 打开开发者工具（可选，发布时可以注释掉）
    // mainWindow.webContents.openDevTools();

    // 窗口关闭时
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 窗口准备好后
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

// Electron初始化完成后创建窗口
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // macOS上，当dock图标被点击时重新创建窗口
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 安全设置：阻止新窗口
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});

