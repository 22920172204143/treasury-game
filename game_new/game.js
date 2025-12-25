// ====================================
// 💰 记账可视化小游戏 - 微信小游戏版
// ====================================

console.log('🎮 游戏开始加载...')

// ========== 1. 初始化平台和Three.js ==========
const systemInfo = wx.getSystemInfoSync()
const screenWidth = systemInfo.windowWidth
const screenHeight = systemInfo.windowHeight
console.log('📱 屏幕:', screenWidth, 'x', screenHeight)

const canvas = wx.createCanvas()
const { WechatGamePlatform } = require('./js/libs/WechatGamePlatform-simple.js')
const platform = new WechatGamePlatform(canvas)
const THREE = require('./js/libs/three-platformize.min.js')
if (THREE.PLATFORM && THREE.PLATFORM.set) THREE.PLATFORM.set(platform)

const gl = canvas.getContext('webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0e6d2)

const camera = new THREE.PerspectiveCamera(60, screenWidth / screenHeight, 0.1, 1000)
camera.position.set(0, 12, 18)
camera.lookAt(0, 2, 0)

const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  context: gl, 
  antialias: true,
  powerPreference: 'high-performance'
})
renderer.setPixelRatio(Math.min(systemInfo.pixelRatio, 2))
renderer.setSize(screenWidth, screenHeight)
renderer.shadowMap.enabled = true

console.log('✅ Three.js 初始化完成')

// ========== 2. 添加光照 ==========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.camera.left = -20
directionalLight.shadow.camera.right = 20
directionalLight.shadow.camera.top = 20
directionalLight.shadow.camera.bottom = -20
scene.add(directionalLight)

// ========== 3. 创建房间 ==========
// 地板
const floorGeometry = new THREE.PlaneGeometry(20, 20)
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d5b7 })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// 墙壁
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf5e9 })

const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 0.2), wallMaterial)
backWall.position.set(0, 5, -10)
backWall.receiveShadow = true
scene.add(backWall)

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 20), wallMaterial)
leftWall.position.set(-10, 5, 0)
leftWall.receiveShadow = true
scene.add(leftWall)

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 20), wallMaterial)
rightWall.position.set(10, 5, 0)
rightWall.receiveShadow = true
scene.add(rightWall)

console.log('✅ 房间创建完成')

// ========== 4. 创建角色（哆啦A梦风格 - 带四肢）==========
const character = new THREE.Group()

// 身体
const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 16)
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffc0cb })
const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
body.position.y = 1.5
body.castShadow = true
character.add(body)

// 头部
const headGeometry = new THREE.SphereGeometry(0.5, 16, 16)
const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffd4a3 })
const head = new THREE.Mesh(headGeometry, headMaterial)
head.position.y = 2.7
head.castShadow = true
character.add(head)

// 眼睛
const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8)
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
leftEye.position.set(-0.15, 2.8, 0.4)
character.add(leftEye)
const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
rightEye.position.set(0.15, 2.8, 0.4)
character.add(rightEye)

// 头发
const hairGeometry = new THREE.SphereGeometry(0.52, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
const hair = new THREE.Mesh(hairGeometry, hairMaterial)
hair.position.y = 2.9
hair.castShadow = true
character.add(hair)

// 左手臂
const leftArm = new THREE.Group()
const leftArmBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8),
  new THREE.MeshStandardMaterial({ color: 0xffc0cb })
)
leftArmBody.position.y = 0.4
leftArmBody.castShadow = true
leftArm.add(leftArmBody)
// 左手掌（球体）
const leftHand = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffd4a3 })
)
leftHand.position.y = 0
leftHand.castShadow = true
leftArm.add(leftHand)
leftArm.position.set(-0.65, 1.8, 0)
character.add(leftArm)

// 右手臂
const rightArm = new THREE.Group()
const rightArmBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8),
  new THREE.MeshStandardMaterial({ color: 0xffc0cb })
)
rightArmBody.position.y = 0.4
rightArmBody.castShadow = true
rightArm.add(rightArmBody)
// 右手掌（球体）
const rightHand = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffd4a3 })
)
rightHand.position.y = 0
rightHand.castShadow = true
rightArm.add(rightHand)
rightArm.position.set(0.65, 1.8, 0)
character.add(rightArm)

// 左腿
const leftLeg = new THREE.Group()
const leftLegBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.15, 0.9, 8),
  new THREE.MeshStandardMaterial({ color: 0xffc0cb })
)
leftLegBody.position.y = 0.45
leftLegBody.castShadow = true
leftLeg.add(leftLegBody)
// 左脚掌（球体）
const leftFoot = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xff6b9d })
)
leftFoot.position.y = 0
leftFoot.castShadow = true
leftLeg.add(leftFoot)
leftLeg.position.set(-0.3, 0.45, 0)
character.add(leftLeg)

// 右腿
const rightLeg = new THREE.Group()
const rightLegBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.15, 0.9, 8),
  new THREE.MeshStandardMaterial({ color: 0xffc0cb })
)
rightLegBody.position.y = 0.45
rightLegBody.castShadow = true
rightLeg.add(rightLegBody)
// 右脚掌（球体）
const rightFoot = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xff6b9d })
)
rightFoot.position.y = 0
rightFoot.castShadow = true
rightLeg.add(rightFoot)
rightLeg.position.set(0.3, 0.45, 0)
character.add(rightLeg)

character.position.set(0, 0, 0)
scene.add(character)

console.log('✅ 角色创建完成（带四肢）')

// ========== 5. 创建现金盒子 ==========
const cashBoxGroup = new THREE.Group()

// 盒子
const boxGeometry = new THREE.BoxGeometry(2, 1.5, 1.5)
const boxMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x8B4513,
  transparent: true,
  opacity: 0.3
})
const cashBox = new THREE.Mesh(boxGeometry, boxMaterial)
cashBox.castShadow = true
cashBoxGroup.add(cashBox)

// 盒子边框
const edgesGeometry = new THREE.EdgesGeometry(boxGeometry)
const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x654321 })
const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
cashBoxGroup.add(edges)

cashBoxGroup.position.set(5, 0.75, -5)
scene.add(cashBoxGroup)

// 现金堆
const cashBills = []
function addCashToCashBox(amount) {
  const billGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.4)
  const billMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 })
  const bill = new THREE.Mesh(billGeometry, billMaterial)
  
  const index = cashBills.length
  bill.position.set(
    5 + (Math.random() - 0.5) * 0.5,
    0.3 + index * 0.06,
    -5 + (Math.random() - 0.5) * 0.5
  )
  bill.rotation.y = Math.random() * Math.PI / 4
  bill.castShadow = true
  
  cashBills.push(bill)
  scene.add(bill)
}

console.log('✅ 现金盒子创建完成')

// ========== 6. 游戏数据管理 ==========
let totalMoney = wx.getStorageSync('totalMoney') || 0
let records = wx.getStorageSync('records') || []

function saveMoney(amount, type, note) {
  if (type === 'income') {
    totalMoney += amount
    addCashToCashBox(amount)
  } else {
    totalMoney -= amount
  }
  
  records.push({
    amount,
    type,
    note,
    time: new Date().toLocaleString()
  })
  
  wx.setStorageSync('totalMoney', totalMoney)
  wx.setStorageSync('records', records)
  
  console.log(`💰 ${type === 'income' ? '收入' : '支出'}: ${amount}元, 余额: ${totalMoney}元`)
}

// 初始化现金显示
const initialBills = Math.min(Math.floor(totalMoney / 100), 50)
for (let i = 0; i < initialBills; i++) {
  addCashToCashBox(100)
}

console.log(`💰 当前余额: ${totalMoney}元`)

// ========== 7. 触摸控制 ==========
let touchStartX = 0
let touchStartY = 0
let isTouchingLeft = false
let isTouchingRight = false
let cameraAngle = 0
let cameraDistance = 18
let cameraHeight = 12

// 虚拟摇杆变量
let joystickActive = false
let joystickStartX = 0
let joystickStartY = 0
let joystickCurrentX = 0
let joystickCurrentY = 0
const joystickRadius = 60
const joystickMaxDistance = 40

// 多点触控变量
let lastTouchDistance = 0
let touches = {}

// 使用微信 API 监听触摸事件
wx.onTouchStart((e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    
    // 左下角区域：虚拟摇杆
    if (touch.clientX < screenWidth * 0.3 && touch.clientY > screenHeight * 0.5) {
      joystickActive = true
      joystickStartX = touch.clientX
      joystickStartY = touch.clientY
      joystickCurrentX = touch.clientX
      joystickCurrentY = touch.clientY
    } else if (touch.clientX > screenWidth * 0.5) {
      isTouchingRight = true
    }
  } else if (e.touches.length === 2) {
    // 双指缩放
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
  }
})

wx.onTouchMove((e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    
    if (joystickActive) {
      // 更新摇杆位置（限制在最大距离内）
      const dx = touch.clientX - joystickStartX
      const dy = touch.clientY - joystickStartY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > joystickMaxDistance) {
        joystickCurrentX = joystickStartX + (dx / distance) * joystickMaxDistance
        joystickCurrentY = joystickStartY + (dy / distance) * joystickMaxDistance
      } else {
        joystickCurrentX = touch.clientX
        joystickCurrentY = touch.clientY
      }
    } else if (isTouchingRight) {
      // 右侧：旋转相机（提高灵敏度）
      cameraAngle -= deltaX * 0.01
      cameraHeight = Math.max(5, Math.min(20, cameraHeight - deltaY * 0.03))
    }
    
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  } else if (e.touches.length === 2) {
    // 双指缩放相机距离
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const delta = distance - lastTouchDistance
    
    cameraDistance = Math.max(8, Math.min(30, cameraDistance - delta * 0.05))
    lastTouchDistance = distance
  }
})

wx.onTouchEnd((e) => {
  // 检测是否点击了存款按钮
  if (e.changedTouches && e.changedTouches.length > 0 && saveButtonPosition) {
    const touch = e.changedTouches[0]
    const dx = touch.clientX - saveButtonPosition.x
    const dy = touch.clientY - saveButtonPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < saveButtonPosition.radius) {
      // 点击了存款按钮
      showMoneyMenu()
    }
  }
  
  if (e.touches.length === 0) {
    joystickActive = false
    isTouchingLeft = false
    isTouchingRight = false
  } else if (e.touches.length === 1) {
    lastTouchDistance = 0
  }
})

// 创建2D Canvas用于绘制UI
const uiCanvas = wx.createCanvas()
const uiCtx = uiCanvas.getContext('2d')
uiCanvas.width = screenWidth
uiCanvas.height = screenHeight

// 绘制UI层（摇杆、FPS、存款按钮）
function drawJoystick() {
  uiCtx.clearRect(0, 0, screenWidth, screenHeight)
  
  // 始终显示摇杆提示区域（半透明）
  const hintX = screenWidth * 0.15
  const hintY = screenHeight * 0.75
  
  if (joystickActive) {
    // 绘制活动状态的摇杆
    // 外圈
    uiCtx.beginPath()
    uiCtx.arc(joystickStartX, joystickStartY, joystickRadius, 0, Math.PI * 2)
    uiCtx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
    uiCtx.lineWidth = 4
    uiCtx.stroke()
    
    // 填充背景
    uiCtx.fillStyle = 'rgba(100, 200, 255, 0.1)'
    uiCtx.fill()
    
    // 内圈（摇杆）
    uiCtx.beginPath()
    uiCtx.arc(joystickCurrentX, joystickCurrentY, 25, 0, Math.PI * 2)
    uiCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    uiCtx.fill()
    uiCtx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
    uiCtx.lineWidth = 3
    uiCtx.stroke()
  } else {
    // 提示摇杆位置（始终可见）
    uiCtx.beginPath()
    uiCtx.arc(hintX, hintY, 50, 0, Math.PI * 2)
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    uiCtx.lineWidth = 3
    uiCtx.stroke()
    
    // 内部小圆点
    uiCtx.beginPath()
    uiCtx.arc(hintX, hintY, 15, 0, Math.PI * 2)
    uiCtx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    uiCtx.fill()
    
    // 添加文字提示
    uiCtx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    uiCtx.font = 'bold 14px Arial'
    uiCtx.textAlign = 'center'
    uiCtx.fillText('移动', hintX, hintY + 80)
  }
  
  // 显示FPS和控制提示
  uiCtx.textAlign = 'left'
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  uiCtx.font = 'bold 18px Arial'
  uiCtx.fillText('FPS: ' + fps, 15, 35)
  
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  uiCtx.font = '14px Arial'
  uiCtx.fillText('🔍 双指缩放', 15, 60)
  uiCtx.fillText('🔄 右侧旋转', 15, 80)
  
  // 靠近箱子时显示存款按钮
  const nearBox = isNearCashBox()
  if (nearBox) {
    const btnX = screenWidth - 100
    const btnY = screenHeight - 100
    const btnRadius = 40
    
    // 绘制存款按钮
    uiCtx.beginPath()
    uiCtx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2)
    uiCtx.fillStyle = 'rgba(76, 175, 80, 0.8)'
    uiCtx.fill()
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    uiCtx.lineWidth = 3
    uiCtx.stroke()
    
    // 按钮文字
    uiCtx.fillStyle = 'white'
    uiCtx.font = 'bold 16px Arial'
    uiCtx.textAlign = 'center'
    uiCtx.fillText('💰', btnX, btnY - 5)
    uiCtx.font = '12px Arial'
    uiCtx.fillText('存取款', btnX, btnY + 15)
    
    // 保存按钮位置供点击检测
    saveButtonPosition = { x: btnX, y: btnY, radius: btnRadius }
  } else {
    saveButtonPosition = null
  }
}

// 存款按钮位置
let saveButtonPosition = null

console.log('✅ 触摸控制初始化完成')
console.log('🕹️ 左下角：虚拟摇杆移动')
console.log('🔄 右侧滑动：旋转视角')
console.log('🔍 双指缩放：调整距离')

// ========== 8. 动画循环 ==========
let lastFrameTime = Date.now()
let fps = 0
let walkCycle = 0
let isWalking = false

// 检测是否靠近箱子
function isNearCashBox() {
  const distance = Math.sqrt(
    Math.pow(character.position.x - 5, 2) + 
    Math.pow(character.position.z + 5, 2)
  )
  return distance < 3
}

function animate() {
  requestAnimationFrame(animate)
  
  drawJoystick()
  
  // 计算帧率
  const currentTime = Date.now()
  const deltaTime = (currentTime - lastFrameTime) / 1000
  lastFrameTime = currentTime
  fps = Math.round(1 / deltaTime)
  
  // 重置行走状态
  isWalking = false
  
  // 根据摇杆移动角色（提高速度）
  if (joystickActive) {
    const dx = joystickCurrentX - joystickStartX
    const dy = joystickCurrentY - joystickStartY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 5) {
      const moveSpeed = 0.15 * (distance / joystickMaxDistance)
      const angle = Math.atan2(dx, dy)
      
      // 相对于相机方向移动
      const moveX = Math.sin(angle + cameraAngle) * moveSpeed
      const moveZ = Math.cos(angle + cameraAngle) * moveSpeed
      
      character.position.x = Math.max(-8, Math.min(8, character.position.x + moveX))
      character.position.z = Math.max(-8, Math.min(8, character.position.z + moveZ))
      
      // 角色朝向移动方向
      character.rotation.y = angle + cameraAngle
      
      // 标记为行走状态
      isWalking = true
    }
  }
  
  // 行走动画（四肢摆动）
  if (isWalking) {
    walkCycle += 0.15
    // 左右手臂摆动（前后）
    leftArm.rotation.x = Math.sin(walkCycle) * 0.5
    rightArm.rotation.x = -Math.sin(walkCycle) * 0.5
    // 左右腿摆动（前后）
    leftLeg.rotation.x = -Math.sin(walkCycle) * 0.6
    rightLeg.rotation.x = Math.sin(walkCycle) * 0.6
  } else {
    // 恢复静止姿势
    leftArm.rotation.x *= 0.9
    rightArm.rotation.x *= 0.9
    leftLeg.rotation.x *= 0.9
    rightLeg.rotation.x *= 0.9
  }
  
  // 更新相机位置
  camera.position.x = character.position.x + cameraDistance * Math.sin(cameraAngle)
  camera.position.z = character.position.z + cameraDistance * Math.cos(cameraAngle)
  camera.position.y = cameraHeight
  camera.lookAt(character.position.x, 2, character.position.z)
  
  // 轻微呼吸动画
  const time = currentTime * 0.001
  body.scale.y = 1 + Math.sin(time * 2) * 0.02
  
  renderer.render(scene, camera)
}

animate()

// ========== 9. 存款菜单（靠近箱子时触发）==========
function showMoneyMenu() {
  wx.showActionSheet({
    itemList: ['💰 记录收入', '💸 记录支出', '📊 查看记录'],
    success: (res) => {
      if (res.tapIndex === 0) {
        showIncomeDialog()
      } else if (res.tapIndex === 1) {
        showExpenseDialog()
      } else if (res.tapIndex === 2) {
        showRecords()
      }
    }
  })
}

// 记录收入
function showIncomeDialog() {
  wx.showModal({
    title: '记录收入',
    editable: true,
    placeholderText: '输入金额',
    success: (res) => {
      if (res.confirm && res.content) {
        const amount = parseFloat(res.content)
        if (!isNaN(amount) && amount > 0) {
          saveMoney(amount, 'income', '收入')
          wx.showToast({ title: `+${amount}元 💰`, icon: 'success' })
        }
      }
    }
  })
}

// 记录支出
function showExpenseDialog() {
  wx.showModal({
    title: '记录支出',
    editable: true,
    placeholderText: '输入金额',
    success: (res) => {
      if (res.confirm && res.content) {
        const amount = parseFloat(res.content)
        if (!isNaN(amount) && amount > 0) {
          saveMoney(amount, 'expense', '支出')
          wx.showToast({ title: `-${amount}元 💸`, icon: 'none' })
        }
      }
    }
  })
}

// 查看记录
function showRecords() {
  const recentRecords = records.slice(-5).reverse()
  let content = `当前余额: ${totalMoney}元\n\n最近记录:\n`
  recentRecords.forEach(r => {
    const sign = r.type === 'income' ? '+' : '-'
    content += `${sign}${r.amount}元 ${r.time}\n`
  })
  
  wx.showModal({
    title: '记账记录',
    content: content || '暂无记录',
    showCancel: false
  })
}

console.log('🎉 游戏加载完成！')
console.log('�️ 左下角圆圈：拖动移动角色')
console.log('🔄 右侧滑动：旋转相机视角')
console.log('🔍 双指捏合：缩放视距')
console.log('💰 走到箱子附近点击绿色按钮存取款')

wx.showToast({
  title: '靠近箱子存取款',
  icon: 'none',
  duration: 3000
})


