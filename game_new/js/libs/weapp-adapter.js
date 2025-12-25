// 微信小游戏适配器 - 简化版
console.log('🔧 开始加载适配器...')

// 1. 获取屏幕信息
const systemInfo = wx.getSystemInfoSync()
const screenWidth = systemInfo.windowWidth
const screenHeight = systemInfo.windowHeight
const pixelRatio = systemInfo.pixelRatio

// 2. 给 window 对象添加缺失的属性（不重新赋值）
window.innerWidth = screenWidth
window.innerHeight = screenHeight
window.devicePixelRatio = pixelRatio

if (!window.performance) {
  window.performance = {
    now: () => Date.now()
  }
}

// 3. 创建 document 对象
if (!window.document) {
  window.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return wx.createCanvas()
      return {}
    },
    createElementNS: (ns, tag) => window.document.createElement(tag),
    documentElement: { style: {} },
    location: { href: '' }
  }
}

// 4. 其他全局对象
if (!window.navigator) {
  window.navigator = {
    userAgent: 'WechatGame',
    platform: systemInfo.platform
  }
}

if (!window.screen) {
  window.screen = {
    width: screenWidth,
    height: screenHeight
  }
}

// 5. 全局快捷方式
document = window.document
navigator = window.navigator
screen = window.screen
performance = window.performance

console.log('✅ 适配器加载完成')
console.log('📱 屏幕:', screenWidth, 'x', screenHeight, '像素比:', pixelRatio)
