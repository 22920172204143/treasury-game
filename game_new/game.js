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

// 画面质感增强（兼容不同 Three 版本字段）
if (renderer.shadowMap) {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap || renderer.shadowMap.type
}
if ('physicallyCorrectLights' in renderer) renderer.physicallyCorrectLights = true
if ('toneMapping' in renderer && THREE.ACESFilmicToneMapping) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
}
if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace
} else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
  renderer.outputEncoding = THREE.sRGBEncoding
}

console.log('✅ Three.js 初始化完成')

// ========== 2. 添加光照 ==========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

// 半球光让室内更柔和
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7a6a58, 0.35)
scene.add(hemiLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.camera.left = -20
directionalLight.shadow.camera.right = 20
directionalLight.shadow.camera.top = 20
directionalLight.shadow.camera.bottom = -20
if (directionalLight.shadow && directionalLight.shadow.mapSize) {
  directionalLight.shadow.mapSize.width = 1024
  directionalLight.shadow.mapSize.height = 1024
}
scene.add(directionalLight)

// ========== 3. 创建房间 ==========
// 地板
const floorGeometry = new THREE.PlaneGeometry(20, 20)
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.95, metalness: 0.0 })
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// 墙壁
// 按你的需求：去掉四面墙，让视野更开阔

console.log('✅ 房间创建完成')

// ========== 4. 创建角色（哆啦A梦风格 - 带四肢）==========
const character = new THREE.Group()

// 身体
const doraBlue = 0x1e88e5
const bodyGeometry = new THREE.SphereGeometry(0.65, 18, 18)
const bodyMaterial = new THREE.MeshStandardMaterial({ color: doraBlue, roughness: 0.7, metalness: 0.0 })
const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
// 椭球体更圆润可爱
// 参考图：身体更像“圆润胶囊/胖乎乎”的躯干
body.scale.set(0.98, 1.22, 0.88)
body.position.y = 1.28
body.castShadow = true
character.add(body)

// 白肚皮
const belly = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 })
)
belly.scale.set(1.15, 1.25, 0.72)
belly.position.set(0, 1.12, 0.42)
belly.castShadow = true
character.add(belly)

// 尾巴（小白球）
const tail = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 14, 14),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 })
)
tail.position.set(0, 1.18, -0.55)
tail.castShadow = true
character.add(tail)

// 头部
// 头更大（哆啦A梦头几乎占身体的一半以上视觉比重）
const headGeometry = new THREE.SphereGeometry(0.75, 20, 20)
const headMaterial = new THREE.MeshStandardMaterial({ color: doraBlue, roughness: 0.65, metalness: 0.0 })
const head = new THREE.Mesh(headGeometry, headMaterial)
head.position.y = 2.75
head.castShadow = true
character.add(head)

// 白脸（前脸贴片）
const face = new THREE.Mesh(
  new THREE.SphereGeometry(0.62, 20, 20),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 })
)
face.scale.set(1.0, 0.92, 0.85)
face.position.set(0, 2.62, 0.34)
face.castShadow = true
character.add(face)

// 红鼻子
const nose = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.45, metalness: 0.0 })
)
nose.position.set(0, 2.74, 0.84)
nose.castShadow = true
character.add(nose)

const faceLineMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.7, metalness: 0.0 })

// 嘴巴弧线（更接近原著的 U 形）
const mouthCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.30, 2.56, 0.86),
  new THREE.Vector3(0, 2.36, 0.92),
  new THREE.Vector3(0.30, 2.56, 0.86)
])
const mouth = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 24, 0.018, 8, false), faceLineMaterial)
mouth.castShadow = true
character.add(mouth)

// 鼻子到嘴巴的竖线
const noseLineCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2.68, 0.86),
  new THREE.Vector3(0, 2.60, 0.88),
  new THREE.Vector3(0, 2.50, 0.90)
])
const noseLine = new THREE.Mesh(new THREE.TubeGeometry(noseLineCurve, 16, 0.012, 8, false), faceLineMaterial)
noseLine.castShadow = true
character.add(noseLine)

// 胡须（每侧 3 根）
function addWhisker(points) {
  const curve = new THREE.CatmullRomCurve3(points)
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.010, 6, false), faceLineMaterial)
  mesh.castShadow = true
  character.add(mesh)
}

addWhisker([
  new THREE.Vector3(-0.10, 2.58, 0.86),
  new THREE.Vector3(-0.38, 2.62, 0.78),
  new THREE.Vector3(-0.62, 2.64, 0.70)
])
addWhisker([
  new THREE.Vector3(-0.10, 2.52, 0.86),
  new THREE.Vector3(-0.38, 2.50, 0.78),
  new THREE.Vector3(-0.62, 2.46, 0.70)
])
addWhisker([
  new THREE.Vector3(-0.10, 2.46, 0.86),
  new THREE.Vector3(-0.38, 2.38, 0.78),
  new THREE.Vector3(-0.62, 2.30, 0.70)
])

addWhisker([
  new THREE.Vector3(0.10, 2.58, 0.86),
  new THREE.Vector3(0.38, 2.62, 0.78),
  new THREE.Vector3(0.62, 2.64, 0.70)
])
addWhisker([
  new THREE.Vector3(0.10, 2.52, 0.86),
  new THREE.Vector3(0.38, 2.50, 0.78),
  new THREE.Vector3(0.62, 2.46, 0.70)
])
addWhisker([
  new THREE.Vector3(0.10, 2.46, 0.86),
  new THREE.Vector3(0.38, 2.38, 0.78),
  new THREE.Vector3(0.62, 2.30, 0.70)
])

// 眼睛
const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.0 })
const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.0 })

const leftEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eyeWhiteMaterial)
leftEyeWhite.scale.set(0.75, 1.15, 0.9)
leftEyeWhite.position.set(-0.22, 3.02, 0.58)
leftEyeWhite.castShadow = true
character.add(leftEyeWhite)

const rightEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eyeWhiteMaterial)
rightEyeWhite.scale.set(0.75, 1.15, 0.9)
rightEyeWhite.position.set(0.22, 3.02, 0.58)
rightEyeWhite.castShadow = true
character.add(rightEyeWhite)

const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), pupilMaterial)
leftPupil.position.set(-0.18, 2.98, 0.72)
leftPupil.castShadow = true
character.add(leftPupil)

const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), pupilMaterial)
rightPupil.position.set(0.18, 2.98, 0.72)
rightPupil.castShadow = true
character.add(rightPupil)

// 红项圈 + 铃铛
const collar = new THREE.Mesh(
  new THREE.TorusGeometry(0.42, 0.06, 10, 24),
  new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.55, metalness: 0.0 })
)
collar.rotation.x = Math.PI / 2
collar.position.set(0, 2.05, 0.06)
collar.castShadow = true
character.add(collar)

const bell = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.35, metalness: 0.1 })
)
bell.position.set(0, 2.05, 0.52)
bell.castShadow = true
character.add(bell)

const bellSlot = new THREE.Mesh(
  new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8),
  new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.0 })
)
bellSlot.rotation.x = Math.PI / 2
bellSlot.position.set(0, 2.03, 0.60)
bellSlot.castShadow = true
character.add(bellSlot)

// 左手臂
const leftArm = new THREE.Group()
const leftArmBody = new THREE.Mesh(
  // 从身体处更粗，到手掌更细的“斜柱体”
  new THREE.CylinderGeometry(0.15, 0.07, 0.62, 12),
  new THREE.MeshStandardMaterial({ color: doraBlue, roughness: 0.75, metalness: 0.0 })
)
// 让手臂从身体内部延伸：顶部在原点附近
// 稍微上移，让“肩部”更好地嵌入身体
leftArmBody.position.y = -0.26
leftArmBody.castShadow = true
leftArm.add(leftArmBody)
// 左手掌（球体）
const leftHand = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 14, 14),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.0 })
)
leftHand.position.y = -0.64
leftHand.castShadow = true
leftArm.add(leftHand)
// 手臂源头埋进身体里（更自然、不外挂）
// 手臂更自然：下垂（相对竖直约 30°）并从身体侧面延伸
// 挂点下移并略内收，让手臂更自然粘合在身体上
leftArm.position.set(-0.52, 1.74, 0.03)
// 左侧手臂需要朝 -X 外侧展开，否则会转进身体里
leftArm.rotation.z = -0.55
leftArm.rotation.x = -0.10
character.add(leftArm)

// 右手臂
const rightArm = new THREE.Group()
const rightArmBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.07, 0.62, 12),
  new THREE.MeshStandardMaterial({ color: doraBlue, roughness: 0.75, metalness: 0.0 })
)
rightArmBody.position.y = -0.26
rightArmBody.castShadow = true
rightArm.add(rightArmBody)
// 右手掌（球体）
const rightHand = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 14, 14),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.0 })
)
rightHand.position.y = -0.64
rightHand.castShadow = true
rightArm.add(rightHand)
rightArm.position.set(0.52, 1.74, 0.03)
rightArm.rotation.z = 0.55
rightArm.rotation.x = -0.10
character.add(rightArm)

// 哆啦A梦风格：不做腿，只保留两个悬浮脚掌（靠得很近，中间留一点空隙）
const footMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0.0 })
const footGeometry = new THREE.SphereGeometry(0.20, 16, 16)

const leftFoot = new THREE.Mesh(footGeometry, footMaterial)
leftFoot.scale.set(1.6, 0.55, 2.0)
leftFoot.position.set(-0.34, 0.58, 0.10)
leftFoot.castShadow = true
character.add(leftFoot)

const rightFoot = new THREE.Mesh(footGeometry, footMaterial)
rightFoot.scale.set(1.6, 0.55, 2.0)
rightFoot.position.set(0.34, 0.58, 0.10)
rightFoot.castShadow = true
character.add(rightFoot)

const footBaseY = 0.58
const footBaseZ = 0.10

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

// 摇杆固定在左下角（常驻可见）
const joystickBaseX = Math.round(screenWidth * 0.18)
const joystickBaseY = Math.round(screenHeight * 0.78)

// 多点触控变量
let lastTouchDistance = 0
let touches = {}

// 使用微信 API 监听触摸事件
wx.onTouchStart((e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    
    // 左下角：固定摇杆（点在圆盘附近才激活）
    const jdx = touch.clientX - joystickBaseX
    const jdy = touch.clientY - joystickBaseY
    const jdist = Math.sqrt(jdx * jdx + jdy * jdy)
    if (jdist <= joystickRadius + 30) {
      joystickActive = true
      joystickStartX = joystickBaseX
      joystickStartY = joystickBaseY
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

// 将 UI Canvas 叠加到 3D 画面上（Three.js Overlay）
const uiTexture = THREE.CanvasTexture ? new THREE.CanvasTexture(uiCanvas) : new THREE.Texture(uiCanvas)
uiTexture.minFilter = THREE.LinearFilter
uiTexture.magFilter = THREE.LinearFilter
uiTexture.generateMipmaps = false

const uiMaterial = new THREE.MeshBasicMaterial({ map: uiTexture, transparent: true })
uiMaterial.depthTest = false
uiMaterial.depthWrite = false

const degToRad = (THREE.MathUtils && THREE.MathUtils.degToRad)
  ? THREE.MathUtils.degToRad
  : (THREE.Math && THREE.Math.degToRad)
    ? THREE.Math.degToRad
    : (d) => (d * Math.PI) / 180

const uiDistance = 1
const uiHeight = 2 * uiDistance * Math.tan(degToRad(camera.fov * 0.5))
const uiWidth = uiHeight * (screenWidth / screenHeight)
const uiGeometry = new THREE.PlaneGeometry(uiWidth, uiHeight)
const uiMesh = new THREE.Mesh(uiGeometry, uiMaterial)
uiMesh.position.z = -uiDistance
uiMesh.renderOrder = 999
uiMesh.frustumCulled = false

camera.add(uiMesh)
scene.add(camera)

// 绘制UI层（摇杆、FPS、存款按钮）
function drawJoystick() {
  uiCtx.clearRect(0, 0, screenWidth, screenHeight)

  // 常驻摇杆圆盘（更醒目）
  const baseX = joystickBaseX
  const baseY = joystickBaseY
  const knobX = joystickActive ? joystickCurrentX : baseX
  const knobY = joystickActive ? joystickCurrentY : baseY

  // 外圈
  uiCtx.beginPath()
  uiCtx.arc(baseX, baseY, joystickRadius, 0, Math.PI * 2)
  uiCtx.strokeStyle = joystickActive ? 'rgba(120, 210, 255, 0.75)' : 'rgba(255, 255, 255, 0.55)'
  uiCtx.lineWidth = 5
  uiCtx.stroke()

  // 填充（轻微渐变）
  const g = uiCtx.createRadialGradient(baseX, baseY, 10, baseX, baseY, joystickRadius)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
  g.addColorStop(1, joystickActive ? 'rgba(120, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.10)')
  uiCtx.fillStyle = g
  uiCtx.fill()

  // 内圈（摇杆）
  uiCtx.beginPath()
  uiCtx.arc(knobX, knobY, 26, 0, Math.PI * 2)
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.78)'
  uiCtx.fill()
  uiCtx.strokeStyle = joystickActive ? 'rgba(120, 210, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)'
  uiCtx.lineWidth = 3
  uiCtx.stroke()

  // 文本提示
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  uiCtx.font = 'bold 14px Arial'
  uiCtx.textAlign = 'center'
  uiCtx.fillText('移动', baseX, baseY + joystickRadius + 28)
  
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
  uiTexture.needsUpdate = true
  
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
    walkCycle += 0.18

    // 更自然的“前后摆臂/抬腿”——幅度更小 + 轻微外摆
    const swing = Math.sin(walkCycle)
    const swing2 = Math.sin(walkCycle * 2)

    // 手臂：围绕“下垂约 30°”基础姿势自然摆臂
    // 摆臂幅度加大：峰值接近离垂直约 45° 的感觉
    leftArm.rotation.x = -0.10 + swing * 0.48
    rightArm.rotation.x = -0.10 - swing * 0.48
    leftArm.rotation.z = -0.55 - swing2 * 0.22
    rightArm.rotation.z = 0.55 + swing2 * 0.22

    // 悬浮脚掌：左右交替抬起 + 轻微前后摆动
    const liftL = Math.max(0, swing)
    const liftR = Math.max(0, -swing)
    // 脚步幅度加大：抬脚更高、前后摆动更明显，脚掌翻转更夸张
    leftFoot.position.y = footBaseY + liftL * 0.14
    rightFoot.position.y = footBaseY + liftR * 0.14
    leftFoot.position.z = footBaseZ + swing * 0.14
    rightFoot.position.z = footBaseZ - swing * 0.14
    leftFoot.rotation.x = -swing * 0.70
    rightFoot.rotation.x = swing * 0.70
  } else {
    // 恢复静止姿势
    leftArm.rotation.x *= 0.9
    rightArm.rotation.x *= 0.9
    leftFoot.rotation.x *= 0.9
    rightFoot.rotation.x *= 0.9
    leftFoot.position.y += (footBaseY - leftFoot.position.y) * 0.15
    rightFoot.position.y += (footBaseY - rightFoot.position.y) * 0.15
    leftFoot.position.z += (footBaseZ - leftFoot.position.z) * 0.15
    rightFoot.position.z += (footBaseZ - rightFoot.position.z) * 0.15

    // 手臂回到基础下垂姿势
    leftArm.rotation.z += (-0.55 - leftArm.rotation.z) * 0.1
    rightArm.rotation.z += (0.55 - rightArm.rotation.z) * 0.1
    leftArm.rotation.x += (-0.10 - leftArm.rotation.x) * 0.1
    rightArm.rotation.x += (-0.10 - rightArm.rotation.x) * 0.1
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


