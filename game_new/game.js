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

// ========== 0. 资源清单与资源管理 ==========
const assets = require('./js/config/assets.js')
const { AssetManager } = require('./js/assetManager.js')
const assetManager = new AssetManager({ THREE, wx, assets })

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

// ========== 模式切换状态 ==========
const MODES = {
  CHARACTER: 'character',
  DEPOSIT: 'deposit'
}
let currentMode = MODES.CHARACTER
let modeButtonPosition = null

// 记录角色模式相机参数，方便切回
const characterCameraState = {
  angle: 0,
  distance: 18,
  height: 12
}

function setMode(nextMode) {
  if (nextMode === currentMode) return

  // 切走角色模式：保存相机参数
  if (currentMode === MODES.CHARACTER) {
    characterCameraState.angle = cameraAngle
    characterCameraState.distance = cameraDistance
    characterCameraState.height = cameraHeight
  }

  currentMode = nextMode

  // 切换时避免遗留输入状态
  joystickActive = false
  isTouchingLeft = false
  isTouchingRight = false

  if (currentMode === MODES.DEPOSIT) {
    // 隐藏角色玩法相关物体，显示存款模式场景
    character.visible = false
    cashDisplayGroup.visible = false
    floor.visible = false
    woodFloor.visible = false
    depositModeGroup.visible = true

    // 存款模式：固定看桌子
    cameraAngle = -0.18
    cameraDistance = 12
    cameraHeight = 6.5
  } else {
    // 回到角色模式
    depositModeGroup.visible = false
    character.visible = true
    cashDisplayGroup.visible = true
    floor.visible = true
    woodFloor.visible = true

    cameraAngle = characterCameraState.angle
    cameraDistance = characterCameraState.distance
    cameraHeight = characterCameraState.height

    updateMoneyVisualization()
  }
}

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

// ========== 5. 存钱区域 + 现金可视化 ==========
// 存钱区域占房间一半（画面上半部分：更远处的半区）
const depositArea = {
  minX: -10,
  maxX: 10,
  minZ: -10,
  maxZ: 0
}

// 上半部分铺木地板（覆盖后半区，避免与原地板 z-fighting）
const woodTexture = assetManager.getTextureSync('floors', assets.scene.floor)
const woodFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 10),
  new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.9, metalness: 0.0 })
)
woodFloor.rotation.x = -Math.PI / 2
woodFloor.position.set(0, 0.01, -5)
woodFloor.receiveShadow = true
scene.add(woodFloor)

// 存钱展示台（用于摆放 100 元纸币与 1 万元钱捆/百万量级钱捆）
const cashDisplayGroup = new THREE.Group()
cashDisplayGroup.position.set(0, 1.0, -6.5)
scene.add(cashDisplayGroup)

// 单一透明展示箱（所有现金都放在同一个箱子里）
const displayBoxGeometry = new THREE.BoxGeometry(9.0, 2.0, 6.0)
const displayBoxMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b,
  transparent: true,
  opacity: 0.18
})
const displayBox = new THREE.Mesh(displayBoxGeometry, displayBoxMaterial)
displayBox.castShadow = true
cashDisplayGroup.add(displayBox)
const displayEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(displayBoxGeometry),
  new THREE.LineBasicMaterial({ color: 0x5d3a1a })
)
cashDisplayGroup.add(displayEdges)

// 现金可视化容器
const cashVisualGroup = new THREE.Group()
cashDisplayGroup.add(cashVisualGroup)

function clearGroup(group) {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i]
    group.remove(child)
  }
}

const redBillMaterial = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.65, metalness: 0.0 })
const redBundleMaterial = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.65, metalness: 0.0 })
const bundleBandMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7, metalness: 0.0 })

function createRedBill() {
  // 每 100 元：一张红色纸币
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.03, 0.32), redBillMaterial)
  bill.castShadow = true
  return bill
}

function createRedBundle() {
  // 每 1 万元：一捆红色的钱（带白色绑带）
  const g = new THREE.Group()
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.34), redBundleMaterial)
  pack.castShadow = true
  g.add(pack)
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.165, 0.36), bundleBandMaterial)
  band.position.x = 0
  band.castShadow = true
  g.add(band)
  return g
}

// 百元纸币与万元捆的摆放区域（在展示箱内部）
function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

function updateMoneyVisualization() {
  clearGroup(cashVisualGroup)

  const safeTotal = Math.max(0, totalMoney)
  const bundleTotal = Math.floor(safeTotal / 10000) // 以“1万/捆”为单位
  const billCount = Math.floor((safeTotal % 10000) / 100) // 以“100/张”为单位（0~99）

  // 1) 钱捆：10x10 网格，捆与捆之间留明显间隙（数量对比更直观）
  const cols = 10
  const rows = 10
  const xStep = 0.78
  const zStep = 0.52
  const baseX = -((cols - 1) * xStep) / 2
  const baseZ = -((rows - 1) * zStep) / 2
  const baseY = -0.75
  const layerStepY = 0.20

  const maxBundles = 200
  const showBundles = Math.min(bundleTotal, maxBundles)
  for (let i = 0; i < showBundles; i++) {
    const layer = Math.floor(i / (cols * rows))
    const idx = i % (cols * rows)
    const r = Math.floor(idx / cols)
    const c = idx % cols

    const bundle = createRedBundle()
    bundle.position.set(baseX + c * xStep, baseY + layer * layerStepY, baseZ + r * zStep)
    bundle.rotation.y = Math.PI / 2
    cashVisualGroup.add(bundle)
  }

  // 2) 红色纸币：单独堆在箱子前侧角落，叠放整齐且能看到“多/少”
  const maxBills = 99
  const showBills = Math.min(billCount, maxBills)
  const billCols = 6
  const billRows = 4
  const billStacksPerLayer = billCols * billRows
  const billXStep = 0.55
  const billZStep = 0.45
  const billBaseX = 2.4
  const billBaseZ = 1.3

  for (let i = 0; i < showBills; i++) {
    const layer = Math.floor(i / billStacksPerLayer)
    const idx = i % billStacksPerLayer
    const r = Math.floor(idx / billCols)
    const c = idx % billCols
    const bill = createRedBill()
    bill.position.set(
      billBaseX + c * billXStep,
      -0.85 + layer * 0.05,
      billBaseZ - r * billZStep
    )
    bill.rotation.y = Math.PI / 2
    cashVisualGroup.add(bill)
  }
}

function isInDepositArea() {
  const x = character.position.x
  const z = character.position.z
  return x >= depositArea.minX && x <= depositArea.maxX && z >= depositArea.minZ && z <= depositArea.maxZ
}

// ========== 存款模式场景（无人物：三面墙 + 窗户 + 阳光 + 桌子 + 掉落动画）==========
const depositModeGroup = new THREE.Group()
depositModeGroup.visible = false
scene.add(depositModeGroup)

// 存款模式地面
const depositFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.95, metalness: 0.0 })
)
depositFloor.rotation.x = -Math.PI / 2
depositFloor.position.y = 0.005
depositFloor.receiveShadow = true
depositModeGroup.add(depositFloor)

// 三面墙（带窗户）
const depositWallMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf5e9, roughness: 0.9, metalness: 0.0 })
const wallH = 10
const wallT = 0.25
const wallW = 20
const wallD = 20

const depositBackWall = new THREE.Mesh(new THREE.BoxGeometry(wallW, wallH, wallT), depositWallMaterial)
depositBackWall.position.set(0, wallH / 2, -10)
depositBackWall.receiveShadow = true
depositBackWall.castShadow = true
depositModeGroup.add(depositBackWall)

const depositLeftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, wallD), depositWallMaterial)
depositLeftWall.position.set(-10, wallH / 2, 0)
depositLeftWall.receiveShadow = true
depositLeftWall.castShadow = true
depositModeGroup.add(depositLeftWall)

const depositRightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, wallD), depositWallMaterial)
depositRightWall.position.set(10, wallH / 2, 0)
depositRightWall.receiveShadow = true
depositRightWall.castShadow = true
depositModeGroup.add(depositRightWall)

function addWindow(group, { x, y, z, w, h, face }) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xc7b8a6, roughness: 0.85, metalness: 0.0 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9fd0ff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.25,
    metalness: 0.0,
    emissive: 0x1a2a3a,
    emissiveIntensity: 0.35
  })

  const frameT = 0.12
  const depth = 0.03

  const top = new THREE.Mesh(new THREE.BoxGeometry(w, frameT, depth), frameMat)
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, frameT, depth), frameMat)
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, depth), frameMat)
  const right = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, depth), frameMat)
  top.position.set(0, h / 2, 0)
  bottom.position.set(0, -h / 2, 0)
  left.position.set(-w / 2, 0, 0)
  right.position.set(w / 2, 0, 0)

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - frameT * 2, h - frameT * 2), glassMat)
  glass.position.z = depth / 2

  const windowGroup = new THREE.Group()
  windowGroup.add(top, bottom, left, right, glass)

  // 放置到指定面
  windowGroup.position.set(x, y, z)
  if (face === 'back') {
    // 背墙朝 +Z
    windowGroup.rotation.y = 0
  } else if (face === 'left') {
    windowGroup.rotation.y = Math.PI / 2
  } else if (face === 'right') {
    windowGroup.rotation.y = -Math.PI / 2
  }

  group.add(windowGroup)
}

// 窗户：背墙一个大窗、右墙一个侧窗
addWindow(depositModeGroup, { x: -3, y: 5.5, z: -9.87, w: 5.8, h: 3.2, face: 'back' })
addWindow(depositModeGroup, { x: 9.87, y: 5.0, z: -2, w: 4.6, h: 2.8, face: 'right' })

// 阳光（暖色方向光）
const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.1)
sunLight.position.set(12, 14, 6)
sunLight.castShadow = true
if (sunLight.shadow && sunLight.shadow.mapSize) {
  sunLight.shadow.mapSize.width = 1024
  sunLight.shadow.mapSize.height = 1024
}
depositModeGroup.add(sunLight)

// 中央桌子
const tableGroup = new THREE.Group()
tableGroup.position.set(0, 0, -4)
depositModeGroup.add(tableGroup)

const tableTop = new THREE.Mesh(
  new THREE.BoxGeometry(6.5, 0.25, 3.6),
  new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.85, metalness: 0.0 })
)
tableTop.position.y = 1.25
tableTop.castShadow = true
tableTop.receiveShadow = true
tableGroup.add(tableTop)

const legMat = new THREE.MeshStandardMaterial({ color: 0x7a4f2c, roughness: 0.9, metalness: 0.0 })
const legGeo = new THREE.BoxGeometry(0.25, 1.25, 0.25)
for (const lx of [-3.05, 3.05]) {
  for (const lz of [-1.55, 1.55]) {
    const leg = new THREE.Mesh(legGeo, legMat)
    leg.position.set(lx, 0.62, lz)
    leg.castShadow = true
    tableGroup.add(leg)
  }
}

// 存款模式的钞票容器
const depositMoneyGroup = new THREE.Group()
depositModeGroup.add(depositMoneyGroup)

// 存款模式特效（能量光圈 + 火花粒子）
const depositFxGroup = new THREE.Group()
depositModeGroup.add(depositFxGroup)

const portal = new THREE.Mesh(
  new THREE.TorusGeometry(1.35, 0.08, 10, 48),
  new THREE.MeshStandardMaterial({
    color: 0xfff3d1,
    emissive: 0xffd39a,
    emissiveIntensity: 1.2,
    roughness: 0.35,
    metalness: 0.0,
    transparent: true,
    opacity: 0.55
  })
)
portal.rotation.x = Math.PI / 2
portal.position.set(tableGroup.position.x, 3.0, tableGroup.position.z)
portal.visible = false
depositFxGroup.add(portal)

let portalPulse = 0

// 连发喷射：将要生成的钞票/钱捆排队，分批次吐出
const depositSpawnQueue = []
let depositSpawnRate = 26 // items / second
let depositSpawnAcc = 0

// 取款吸入：把桌面上的钱吸进光圈
const suckingItems = []

const sparkPool = []
const activeSparks = []
const sparkCount = 140
const sparkGeo = new THREE.PlaneGeometry(0.10, 0.10)
const sparkMat = new THREE.MeshBasicMaterial({
  color: 0xfff1c8,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending !== undefined ? THREE.AdditiveBlending : THREE.NormalBlending
})

for (let i = 0; i < sparkCount; i++) {
  const m = new THREE.Mesh(sparkGeo, sparkMat.clone())
  m.visible = false
  depositFxGroup.add(m)
  sparkPool.push(m)
}

function spawnSparksAt(pos, count, strength) {
  const n = Math.min(count, sparkPool.length)
  for (let i = 0; i < n; i++) {
    const s = sparkPool.pop()
    s.visible = true
    s.position.copy(pos)
    s.position.x += (Math.random() - 0.5) * 0.18
    s.position.y += (Math.random() - 0.5) * 0.18
    s.position.z += (Math.random() - 0.5) * 0.18
    s.rotation.set(0, 0, Math.random() * Math.PI)
    s.material.opacity = 0.95
    s.material.color.setHex(0xfff1c8)

    const v = new THREE.Vector3(
      (Math.random() - 0.5) * strength,
      (0.6 + Math.random() * 0.8) * strength,
      (Math.random() - 0.5) * strength
    )
    activeSparks.push({ mesh: s, vel: v, life: 0.45 + Math.random() * 0.35 })
  }
}

function stepDepositFx(dt) {
  // 光圈脉冲
  if (portalPulse > 0) {
    portalPulse = Math.max(0, portalPulse - dt)
    portal.visible = true
    const t = 1 - portalPulse / 0.75
    const s = 0.65 + t * 0.65
    portal.scale.set(s, s, s)
    portal.material.opacity = 0.58 * (1 - t * 0.55)
    portal.material.emissiveIntensity = 1.35 + Math.sin(t * Math.PI) * 1.25
    portal.rotation.z += dt * 1.6
  } else {
    portal.visible = false
  }

  // 粒子
  for (let i = activeSparks.length - 1; i >= 0; i--) {
    const p = activeSparks[i]
    p.life -= dt
    const m = p.mesh
    if (p.life <= 0 || !m) {
      if (m) {
        m.visible = false
        m.material.opacity = 0
        sparkPool.push(m)
      }
      activeSparks.splice(i, 1)
      continue
    }
    p.vel.y += -6.2 * dt
    m.position.x += p.vel.x * dt
    m.position.y += p.vel.y * dt
    m.position.z += p.vel.z * dt
    m.rotation.z += dt * 8
    m.material.opacity = Math.min(0.95, p.life * 1.35)
  }
}

function stepDepositSpawner(dt) {
  if (depositSpawnQueue.length === 0) return
  depositSpawnAcc += dt * depositSpawnRate
  const spawnNow = Math.min(depositSpawnQueue.length, Math.floor(depositSpawnAcc))
  if (spawnNow <= 0) return
  depositSpawnAcc -= spawnNow

  // 动态调整：队列越大越快一点
  if (depositSpawnQueue.length > 120) depositSpawnRate = 42
  else if (depositSpawnQueue.length > 60) depositSpawnRate = 34
  else depositSpawnRate = 26

  const spawnBase = new THREE.Vector3(tableGroup.position.x, 3.6, tableGroup.position.z)
  const tableTopY = tableGroup.position.y + 1.25
  const tableHalfX = 6.5 / 2
  const tableHalfZ = 3.6 / 2

  for (let i = 0; i < spawnNow; i++) {
    const factory = depositSpawnQueue.shift()
    if (!factory) continue
    const mesh = factory()
    mesh.position.set(
      spawnBase.x + rand(-0.42, 0.42),
      spawnBase.y + rand(-0.15, 0.25),
      spawnBase.z + rand(-0.42, 0.42)
    )
    mesh.rotation.set(rand(-0.8, 0.8), rand(-Math.PI, Math.PI), rand(-0.8, 0.8))
    depositMoneyGroup.add(mesh)
    fallingItems.push({
      mesh,
      vel: new THREE.Vector3(rand(-1.35, 1.35), rand(2.6, 4.2), rand(-1.35, 1.35)),
      ang: new THREE.Vector3(rand(-3.2, 3.2), rand(-4.2, 4.2), rand(-3.2, 3.2)),
      tableTopY,
      tableHalfX,
      tableHalfZ
    })
  }

  // 每一波都加一点点火花，视觉更“热闹”
  spawnSparksAt(new THREE.Vector3(tableGroup.position.x, 2.55, tableGroup.position.z), 2 + Math.floor(Math.random() * 4), 1.6)
}

function triggerWithdrawFx(amount) {
  // 起手光圈
  portal.position.set(tableGroup.position.x, 3.0, tableGroup.position.z)
  portalPulse = 0.75
  spawnSparksAt(new THREE.Vector3(tableGroup.position.x, 2.4, tableGroup.position.z), 34, 3.2)

  // 如果没有现成的钱，就生成少量“幻影钞票”再吸走
  const needGhost = depositMoneyGroup.children.length === 0
  if (needGhost) {
    const ghostCount = Math.min(10, Math.max(4, Math.floor((amount || 100) / 50)))
    for (let i = 0; i < ghostCount; i++) {
      const denom = [100, 50, 20, 10, 5, 1][Math.floor(Math.random() * 6)]
      const b = createBillMesh(denom)
      b.position.set(
        tableGroup.position.x + rand(-1.8, 1.8),
        tableGroup.position.y + 1.35 + rand(0.02, 0.08),
        tableGroup.position.z + rand(-1.0, 1.0)
      )
      b.rotation.set(rand(-0.2, 0.2), rand(-Math.PI, Math.PI), rand(-0.2, 0.2))
      depositMoneyGroup.add(b)
    }
  }

  // 把一部分现有钱吸入
  const maxSuck = 40
  const take = Math.min(maxSuck, depositMoneyGroup.children.length)
  for (let i = 0; i < take; i++) {
    const idx = Math.floor(Math.random() * depositMoneyGroup.children.length)
    const obj = depositMoneyGroup.children[idx]
    if (!obj) continue
    suckingItems.push({
      obj,
      t: 0,
      dur: 0.45 + Math.random() * 0.35,
      start: obj.position.clone(),
      spin: new THREE.Vector3(rand(-4, 4), rand(-6, 6), rand(-4, 4))
    })
  }
}

function stepWithdrawFx(dt) {
  if (suckingItems.length === 0) return
  const target = new THREE.Vector3(portal.position.x, portal.position.y, portal.position.z)

  for (let i = suckingItems.length - 1; i >= 0; i--) {
    const it = suckingItems[i]
    const obj = it.obj
    if (!obj || !obj.parent) {
      suckingItems.splice(i, 1)
      continue
    }

    it.t += dt
    const k = Math.min(1, it.t / it.dur)
    // easeInOut
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2

    // 螺旋吸入：向目标 lerp，同时加一点环绕偏移
    const swirl = 0.55 * (1 - e)
    const a = it.t * 10
    const desired = new THREE.Vector3(
      target.x + Math.cos(a) * swirl,
      target.y + Math.sin(a * 1.2) * swirl * 0.25,
      target.z + Math.sin(a) * swirl
    )

    obj.position.lerpVectors(it.start, desired, e)
    obj.rotation.x += it.spin.x * dt
    obj.rotation.y += it.spin.y * dt
    obj.rotation.z += it.spin.z * dt

    const s = Math.max(0.001, 1 - e)
    obj.scale.set(s, s, s)

    if (k >= 1) {
      spawnSparksAt(target, 3, 1.8)
      obj.parent.remove(obj)
      suckingItems.splice(i, 1)
    }
  }
}

// 面额样式（用不同配色+简单印刷纹理区分）
const denomTextureCache = {}
function createDenomTexture(denom, theme) {
  if (denomTextureCache[denom]) return denomTextureCache[denom]
  const c = wx.createCanvas()
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, c.width, c.height)

  // 边框
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 10
  ctx.strokeRect(10, 10, c.width - 20, c.height - 20)

  // 水印条
  ctx.fillStyle = theme.band
  ctx.globalAlpha = 0.22
  ctx.fillRect(0, c.height * 0.35, c.width, c.height * 0.3)
  ctx.globalAlpha = 1

  // 面额
  ctx.fillStyle = theme.text
  ctx.font = 'bold 72px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(denom), c.width / 2, c.height / 2)

  const tex = THREE.CanvasTexture ? new THREE.CanvasTexture(c) : new THREE.Texture(c)
  tex.needsUpdate = true
  denomTextureCache[denom] = tex
  return tex
}

const denomThemes = {
  1: { bg: '#dff1ff', border: '#2b6aa3', band: '#2b6aa3', text: '#1a3555' },
  5: { bg: '#dfffe6', border: '#2c8b52', band: '#2c8b52', text: '#145a33' },
  10: { bg: '#fff2d9', border: '#b06b1a', band: '#b06b1a', text: '#6a3a00' },
  20: { bg: '#ffe1e1', border: '#b23b3b', band: '#b23b3b', text: '#6a1a1a' },
  50: { bg: '#e9e1ff', border: '#5b3bb2', band: '#5b3bb2', text: '#2f1a6a' },
  100: { bg: '#ffe2f0', border: '#b21a57', band: '#b21a57', text: '#6a0030' }
}

function createBillMesh(denom) {
  const theme = denomThemes[denom] || denomThemes[100]
  const tex = createDenomTexture(denom, theme)
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.0 })
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.03, 0.38), mat)
  bill.castShadow = true
  return bill
}

function createRedBundle10k() {
  const g = new THREE.Group()
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.36), new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.65, metalness: 0.0 }))
  pack.castShadow = true
  g.add(pack)
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.185, 0.38), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7, metalness: 0.0 }))
  band.castShadow = true
  g.add(band)
  return g
}

// 掉落动画（简化物理）
const fallingItems = []
function rand(min, max) {
  return min + Math.random() * (max - min)
}

function spawnDepositAnimation(amount) {
  if (!amount || amount <= 0) return

  // 简单回收：避免堆太多导致卡顿
  if (depositMoneyGroup.children.length > 260) {
    while (depositMoneyGroup.children.length) {
      depositMoneyGroup.remove(depositMoneyGroup.children[0])
    }
    fallingItems.length = 0
  }

  // 华丽起手：光圈脉冲 + 粒子喷射
  portal.position.set(tableGroup.position.x, 3.0, tableGroup.position.z)
  portalPulse = 0.75
  spawnSparksAt(new THREE.Vector3(tableGroup.position.x, 2.6, tableGroup.position.z), 40, 3.6)

  // 将金额拆分为：1/5/10/20/50/100 + 10000(捆)
  let remaining = Math.floor(amount)
  const bundle10k = Math.floor(remaining / 10000)
  remaining = remaining % 10000

  const denoms = [100, 50, 20, 10, 5, 1]
  const counts = {}
  for (const d of denoms) {
    counts[d] = Math.floor(remaining / d)
    remaining = remaining % d
  }

  // 控制生成数量，避免性能问题（进入队列，连发喷射）
  const maxBundles = 30
  const maxBillsPerDenom = 18

  // 清空上一波残留的“连发队列”，保证每次点击都立刻开始新的一波
  depositSpawnQueue.length = 0
  depositSpawnAcc = 0

  // 先抛 1 万捆（红色）
  const showBundles = Math.min(bundle10k, maxBundles)
  for (let i = 0; i < showBundles; i++) {
    depositSpawnQueue.push(() => createRedBundle10k())
  }

  // 再抛各面额纸币
  for (const d of denoms) {
    const show = Math.min(counts[d] || 0, maxBillsPerDenom)
    for (let i = 0; i < show; i++) {
      depositSpawnQueue.push(() => createBillMesh(d))
    }
  }

  // 增加一点“华丽补偿”：金额大时额外多喷一些 100/50 的纸币（不影响记账，只影响视觉）
  const extra = Math.min(22, Math.max(0, Math.floor(amount / 800)))
  for (let i = 0; i < extra; i++) {
    depositSpawnQueue.push(() => createBillMesh(i % 2 === 0 ? 100 : 50))
  }
}

function stepFalling(dt) {
  if (fallingItems.length === 0) return
  const g = -9.8
  const floorY = 0.02
  const restitution = 0.22
  const friction = 0.86

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    const it = fallingItems[i]
    const m = it.mesh
    if (!m) {
      fallingItems.splice(i, 1)
      continue
    }

    it.vel.y += g * dt
    m.position.x += it.vel.x * dt
    m.position.y += it.vel.y * dt
    m.position.z += it.vel.z * dt

    m.rotation.x += it.ang.x * dt
    m.rotation.y += it.ang.y * dt
    m.rotation.z += it.ang.z * dt

    // 桌面碰撞（范围内才算）
    const inTable =
      Math.abs(m.position.x - tableGroup.position.x) <= it.tableHalfX &&
      Math.abs(m.position.z - tableGroup.position.z) <= it.tableHalfZ

    const minYTable = it.tableTopY + 0.10
    if (inTable && m.position.y <= minYTable) {
      m.position.y = minYTable
      if (it.vel.y < 0) it.vel.y = -it.vel.y * restitution
      it.vel.x *= friction
      it.vel.z *= friction
      it.ang.x *= 0.75
      it.ang.y *= 0.75
      it.ang.z *= 0.75

      // 碰撞溅射火花（更有“落桌”质感）
      if (currentMode === MODES.DEPOSIT) {
        const p = new THREE.Vector3(m.position.x, m.position.y, m.position.z)
        spawnSparksAt(p, 6, 1.6)
      }
    }

    // 地面碰撞
    if (m.position.y <= floorY) {
      m.position.y = floorY
      if (it.vel.y < 0) it.vel.y = -it.vel.y * restitution
      it.vel.x *= friction
      it.vel.z *= friction
      it.ang.x *= 0.75
      it.ang.y *= 0.75
      it.ang.z *= 0.75

      if (currentMode === MODES.DEPOSIT) {
        const p = new THREE.Vector3(m.position.x, m.position.y, m.position.z)
        spawnSparksAt(p, 4, 1.2)
      }
    }

    // 静止判定
    const speed = Math.abs(it.vel.x) + Math.abs(it.vel.y) + Math.abs(it.vel.z)
    if (speed < 0.12 && (m.position.y <= minYTable + 0.02 || m.position.y <= floorY + 0.02)) {
      it.vel.set(0, 0, 0)
      it.ang.set(0, 0, 0)
      fallingItems.splice(i, 1)
    }
  }
}

console.log('✅ 存钱区域创建完成')

// ========== 6. 游戏数据管理 ==========
let totalMoney = wx.getStorageSync('totalMoney') || 0
let records = wx.getStorageSync('records') || []

function saveMoney(amount, type, note) {
  if (type === 'income') {
    totalMoney += amount
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

  // 刷新现金可视化（角色模式才显示“展示箱余额”）
  if (currentMode === MODES.CHARACTER) updateMoneyVisualization()
  
  console.log(`💰 ${type === 'income' ? '收入' : '支出'}: ${amount}元, 余额: ${totalMoney}元`)
}

// 初始化现金显示
updateMoneyVisualization()

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
    
    // 左下角：固定摇杆（点在圆盘附近才激活）——存款模式禁用
    if (currentMode === MODES.CHARACTER) {
      const jdx = touch.clientX - joystickBaseX
      const jdy = touch.clientY - joystickBaseY
      const jdist = Math.sqrt(jdx * jdx + jdy * jdy)
      if (jdist <= joystickRadius + 30) {
        joystickActive = true
        joystickStartX = joystickBaseX
        joystickStartY = joystickBaseY
        joystickCurrentX = touch.clientX
        joystickCurrentY = touch.clientY
        return
      }
    }

    // 右侧触摸：旋转相机（存款模式禁用）
    if (currentMode === MODES.CHARACTER && touch.clientX > screenWidth * 0.5) {
      isTouchingRight = true
    }
  } else if (e.touches.length === 2) {
    // 双指缩放（存款模式禁用）
    if (currentMode === MODES.CHARACTER) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
    }
  }
})

wx.onTouchMove((e) => {
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    
    if (joystickActive && currentMode === MODES.CHARACTER) {
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
    } else if (isTouchingRight && currentMode === MODES.CHARACTER) {
      // 右侧：旋转相机（提高灵敏度）
      cameraAngle -= deltaX * 0.01
      cameraHeight = Math.max(5, Math.min(20, cameraHeight - deltaY * 0.03))
    }
    
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  } else if (e.touches.length === 2) {
    // 双指缩放相机距离（存款模式禁用）
    if (currentMode === MODES.CHARACTER) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const delta = distance - lastTouchDistance
      
      cameraDistance = Math.max(8, Math.min(30, cameraDistance - delta * 0.05))
      lastTouchDistance = distance
    }
  }
})

wx.onTouchEnd((e) => {
  // 先检测是否点击了左上角模式切换按钮
  if (e.changedTouches && e.changedTouches.length > 0 && modeButtonPosition) {
    const touch = e.changedTouches[0]
    const inBtn =
      touch.clientX >= modeButtonPosition.x &&
      touch.clientX <= modeButtonPosition.x + modeButtonPosition.w &&
      touch.clientY >= modeButtonPosition.y &&
      touch.clientY <= modeButtonPosition.y + modeButtonPosition.h

    if (inBtn) {
      setMode(currentMode === MODES.CHARACTER ? MODES.DEPOSIT : MODES.CHARACTER)
      // 切换模式后不再处理其它点击
      joystickActive = false
      isTouchingLeft = false
      isTouchingRight = false
      return
    }
  }

  // 再检测右上角“明细”按钮
  if (e.changedTouches && e.changedTouches.length > 0 && recordsButtonPosition) {
    const touch = e.changedTouches[0]
    const inBtn =
      touch.clientX >= recordsButtonPosition.x &&
      touch.clientX <= recordsButtonPosition.x + recordsButtonPosition.w &&
      touch.clientY >= recordsButtonPosition.y &&
      touch.clientY <= recordsButtonPosition.y + recordsButtonPosition.h

    if (inBtn) {
      showRecords()
      joystickActive = false
      isTouchingLeft = false
      isTouchingRight = false
      return
    }
  }

  // 检测是否点击了“存款/取款”按钮
  if (e.changedTouches && e.changedTouches.length > 0) {
    const touch = e.changedTouches[0]

    if (depositButtonPosition) {
      const dx = touch.clientX - depositButtonPosition.x
      const dy = touch.clientY - depositButtonPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < depositButtonPosition.radius) {
        showIncomeDialog()
        joystickActive = false
        isTouchingLeft = false
        isTouchingRight = false
        return
      }
    }

    if (withdrawButtonPosition) {
      const dx = touch.clientX - withdrawButtonPosition.x
      const dy = touch.clientY - withdrawButtonPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < withdrawButtonPosition.radius) {
        showExpenseDialog()
        joystickActive = false
        isTouchingLeft = false
        isTouchingRight = false
        return
      }
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

  // 左上角：模式切换按钮
  const modeX = 15
  const modeY = 15
  const modeW = 150
  const modeH = 42

  // rounded rect
  const r = 10
  uiCtx.beginPath()
  uiCtx.moveTo(modeX + r, modeY)
  uiCtx.lineTo(modeX + modeW - r, modeY)
  uiCtx.quadraticCurveTo(modeX + modeW, modeY, modeX + modeW, modeY + r)
  uiCtx.lineTo(modeX + modeW, modeY + modeH - r)
  uiCtx.quadraticCurveTo(modeX + modeW, modeY + modeH, modeX + modeW - r, modeY + modeH)
  uiCtx.lineTo(modeX + r, modeY + modeH)
  uiCtx.quadraticCurveTo(modeX, modeY + modeH, modeX, modeY + modeH - r)
  uiCtx.lineTo(modeX, modeY + r)
  uiCtx.quadraticCurveTo(modeX, modeY, modeX + r, modeY)
  uiCtx.closePath()

  uiCtx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  uiCtx.fill()
  uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
  uiCtx.lineWidth = 2
  uiCtx.stroke()

  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  uiCtx.font = 'bold 14px Arial'
  uiCtx.textAlign = 'center'
  uiCtx.textBaseline = 'middle'
  const modeLabel = currentMode === MODES.CHARACTER ? '切换: 存款模式' : '切换: 角色模式'
  uiCtx.fillText(modeLabel, modeX + modeW / 2, modeY + modeH / 2)
  modeButtonPosition = { x: modeX, y: modeY, w: modeW, h: modeH }

  // 右上角：收支明细按钮
  const recW = 110
  const recH = 42
  const recX = screenWidth - recW - 15
  const recY = 15
  const rr = 10
  uiCtx.beginPath()
  uiCtx.moveTo(recX + rr, recY)
  uiCtx.lineTo(recX + recW - rr, recY)
  uiCtx.quadraticCurveTo(recX + recW, recY, recX + recW, recY + rr)
  uiCtx.lineTo(recX + recW, recY + recH - rr)
  uiCtx.quadraticCurveTo(recX + recW, recY + recH, recX + recW - rr, recY + recH)
  uiCtx.lineTo(recX + rr, recY + recH)
  uiCtx.quadraticCurveTo(recX, recY + recH, recX, recY + recH - rr)
  uiCtx.lineTo(recX, recY + rr)
  uiCtx.quadraticCurveTo(recX, recY, recX + rr, recY)
  uiCtx.closePath()
  uiCtx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  uiCtx.fill()
  uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
  uiCtx.lineWidth = 2
  uiCtx.stroke()
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  uiCtx.font = 'bold 14px Arial'
  uiCtx.textAlign = 'center'
  uiCtx.textBaseline = 'middle'
  uiCtx.fillText('明细', recX + recW / 2, recY + recH / 2)
  recordsButtonPosition = { x: recX, y: recY, w: recW, h: recH }

  // 存款模式：不显示摇杆
  const showJoystick = currentMode === MODES.CHARACTER

  if (showJoystick) {
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
  if (currentMode === MODES.DEPOSIT) {
    uiCtx.fillText('💸 点击存款让钞票掉落', 15, 100)
  }
  
  // 角色模式：进入存钱区域时显示“存款/取款”两个按钮；存款模式：始终显示
  const showMoneyButtons = currentMode === MODES.DEPOSIT ? true : isInDepositArea()
  if (showMoneyButtons) {
    const rBtn = 42
    const gap = 22
    const rightX = screenWidth - 90
    const baseY = screenHeight - 110
    // 让两个圆按钮“中心距离 >= 2*rBtn”，避免重叠显得拥挤
    const leftX = rightX - (rBtn * 2 + gap)

    // 存款按钮（绿色）
    uiCtx.beginPath()
    uiCtx.arc(leftX, baseY, rBtn, 0, Math.PI * 2)
    uiCtx.fillStyle = 'rgba(76, 175, 80, 0.85)'
    uiCtx.fill()
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
    uiCtx.lineWidth = 3
    uiCtx.stroke()
    uiCtx.fillStyle = 'white'
    uiCtx.font = 'bold 16px Arial'
    uiCtx.textAlign = 'center'
    uiCtx.textBaseline = 'middle'
    uiCtx.fillText('💰', leftX, baseY - 8)
    uiCtx.font = '12px Arial'
    uiCtx.fillText('存款', leftX, baseY + 16)
    depositButtonPosition = { x: leftX, y: baseY, radius: rBtn }

    // 取款按钮（红色）
    uiCtx.beginPath()
    uiCtx.arc(rightX, baseY, rBtn, 0, Math.PI * 2)
    uiCtx.fillStyle = 'rgba(229, 57, 53, 0.85)'
    uiCtx.fill()
    uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
    uiCtx.lineWidth = 3
    uiCtx.stroke()
    uiCtx.fillStyle = 'white'
    uiCtx.font = 'bold 16px Arial'
    uiCtx.textAlign = 'center'
    uiCtx.textBaseline = 'middle'
    uiCtx.fillText('🏧', rightX, baseY - 8)
    uiCtx.font = '12px Arial'
    uiCtx.fillText('取款', rightX, baseY + 16)
    withdrawButtonPosition = { x: rightX, y: baseY, radius: rBtn }
  } else {
    depositButtonPosition = null
    withdrawButtonPosition = null
  }
}

// 按钮位置
let depositButtonPosition = null
let withdrawButtonPosition = null
let recordsButtonPosition = null

console.log('✅ 触摸控制初始化完成')
console.log('🕹️ 左下角：虚拟摇杆移动')
console.log('🔄 右侧滑动：旋转视角')
console.log('🔍 双指缩放：调整距离')

// ========== 8. 动画循环 ==========
let lastFrameTime = Date.now()
let fps = 0
let walkCycle = 0
let isWalking = false

// 检测是否进入存钱区域（在“上半部分木地板” Remember: z <= 0）
// 具体判断函数在存钱区域初始化处：isInDepositArea()

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

  if (currentMode === MODES.CHARACTER) {
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
  } else {
    // 存款模式：推进钞票掉落动画
    stepFalling(deltaTime)
    stepDepositFx(deltaTime)
    stepDepositSpawner(deltaTime)
    stepWithdrawFx(deltaTime)
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
  if (currentMode === MODES.DEPOSIT) {
    const tx = 0
    const tz = -4
    camera.position.x = tx + cameraDistance * Math.sin(cameraAngle)
    camera.position.z = tz + cameraDistance * Math.cos(cameraAngle)
    camera.position.y = cameraHeight
    camera.lookAt(tx, 1.2, tz)
  } else {
    camera.position.x = character.position.x + cameraDistance * Math.sin(cameraAngle)
    camera.position.z = character.position.z + cameraDistance * Math.cos(cameraAngle)
    camera.position.y = cameraHeight
    camera.lookAt(character.position.x, 2, character.position.z)

    // 轻微呼吸动画
    const time = currentTime * 0.001
    body.scale.y = 1 + Math.sin(time * 2) * 0.02
  }
  
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
          if (currentMode === MODES.DEPOSIT) {
            spawnDepositAnimation(amount)
          }
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
          if (currentMode === MODES.DEPOSIT) {
            // 取款反向特效：吸入光圈
            triggerWithdrawFx(amount)
          }
          wx.showToast({ title: `-${amount}元 💸`, icon: 'none' })
        }
      }
    }
  })
}

// 查看记录
function showRecords() {
  const maxShow = 15
  const recentRecords = records.slice(-maxShow).reverse()
  let content = `当前余额: ${totalMoney}元\n\n最近${recentRecords.length}条记录:\n`
  recentRecords.forEach((r, idx) => {
    const sign = r.type === 'income' ? '+' : '-'
    const tag = r.type === 'income' ? '收入' : '支出'
    const note = r.note ? `（${r.note}）` : ''
    content += `${idx + 1}. ${tag}${note} ${sign}${r.amount}元\n   ${r.time}\n`
  })
  if (records.length > maxShow) {
    content += `\n... 共${records.length}条（仅展示最近${maxShow}条）`
  }
  
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
console.log('💰 进入木地板区域点击绿色按钮存钱')

wx.showToast({
  title: '进入木地板区域可存钱',
  icon: 'none',
  duration: 3000
})


