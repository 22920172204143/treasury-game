// 微信小游戏 Three.js 平台适配器 - 极简版
// 基于 three-platformize 改写，移除 ES6 import 依赖

function WechatGamePlatform(canvas) {
  const systemInfo = wx.getSystemInfoSync()
  
  this.canvas = canvas
  
  // 为 canvas 添加 addEventListener polyfill
  if (!canvas.addEventListener) {
    canvas.addEventListener = function(type, listener) {
      if (type === 'touchstart') {
        wx.onTouchStart(listener)
      } else if (type === 'touchmove') {
        wx.onTouchMove(listener)
      } else if (type === 'touchend') {
        wx.onTouchEnd(listener)
      } else if (type === 'touchcancel') {
        wx.onTouchCancel(listener)
      }
    }
    canvas.removeEventListener = function() {}
    canvas.dispatchEvent = function() {}
  }
  
  // 创建 document 对象
  this.document = {
    createElementNS: (_, type) => {
      if (type === 'canvas') return canvas
      if (type === 'img') return wx.createImage()
      return {}
    },
    createElement: (type) => {
      if (type === 'canvas') return canvas
      if (type === 'img') return wx.createImage()
      return {}
    }
  }
  
  // 创建 window 对象
  this.window = {
    innerWidth: systemInfo.windowWidth,
    innerHeight: systemInfo.windowHeight,
    devicePixelRatio: systemInfo.pixelRatio,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    AudioContext: function() {},
    addEventListener: function() {},
    removeEventListener: function() {}
  }
  
  // 添加 style 属性
  Object.defineProperty(this.canvas, 'style', {
    get() {
      return {
        width: this.width + 'px',
        height: this.height + 'px'
      }
    }
  })
  
  Object.defineProperty(this.canvas, 'clientHeight', {
    get() {
      return this.height
    }
  })
  
  Object.defineProperty(this.canvas, 'clientWidth', {
    get() {
      return this.width
    }
  })
}

// 返回全局变量
WechatGamePlatform.prototype.getGlobals = function() {
  return {
    window: this.window,
    document: this.document,
    HTMLCanvasElement: undefined,
    XMLHttpRequest: undefined,
    OffscreenCanvas: () => wx.createCanvas(),
    createImageBitmap: undefined,
    atob: undefined,
    Blob: undefined
  }
}

// 释放资源
WechatGamePlatform.prototype.dispose = function() {
  this.canvas.width = 0
  this.canvas.height = 0
  this.canvas = null
  this.document = null
  this.window = null
}

module.exports = { WechatGamePlatform }
