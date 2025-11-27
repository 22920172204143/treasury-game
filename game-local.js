// 游戏配置
const config = {
    roomSize: 20,
    playerSpeed: 0.15,
    playerRadius: 0.5,
    gravity: 0.02,
    jumpStrength: 0.4
};

// 场景、相机、渲染器
let scene, camera, renderer;
let player, playerBody, leftArm, rightArm, leftLeg, rightLeg;
let playerVelocity = { x: 0, y: 0, z: 0 };
let isJumping = false;
let walkAnimation = 0;
let isMoving = false;

// 金钱系统
let totalMoney = 0;
let cashBundles = [];
let looseCashBundle = null; // 散乱现金捆（小于100元）
const CASH_UNIT = 100; // 一捆100元

// 日历系统
let currentDate = new Date(2025, 0, 1); // 2025年1月1日
let selectedDate = new Date();
let moneyRecords = {}; // 存储每天的记录 { "2025-01-01": { income: 100, expense: 50 } }
let currentMonth = new Date();

// 相机控制
let cameraAngle = 0;
let cameraDistance = 12;
let cameraHeight = 8;
let isDragging = false;
let previousMouseX = 0;

// 键盘输入
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// 房间物体（用于碰撞检测）
let obstacles = [];
let boxPosition = { x: -4, y: 0, z: -4 }; // 箱子位置

// 初始化场景
function init() {
    console.log('🎮 游戏初始化开始...');
    console.log('✅ THREE.js 版本:', THREE.REVISION);
    
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

    // 创建相机（第三人称视角）
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    updateCameraPosition();

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    console.log('✅ 渲染器已添加到页面');

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加方向光（产生阴影）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 创建房间
    createRoom();

    // 创建玩家
    createPlayer();

    // 创建桌子
    createTable(5, 0, 3);

    // 创建箱子
    createBox(boxPosition.x, boxPosition.y, boxPosition.z);

    // 鼠标事件监听（用于旋转视角）
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onMouseWheel);

    // 键盘事件监听
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 窗口大小改变
    window.addEventListener('resize', onWindowResize);

    console.log('✅ 游戏初始化完成！');
    console.log('📝 使用 WASD 移动，鼠标拖拽旋转视角');
    
    // 开始动画循环
    animate();
}

// 更新相机位置
function updateCameraPosition() {
    if (!player) {
        // 如果玩家还没创建，使用默认位置
        camera.position.set(0, cameraHeight, cameraDistance);
        camera.lookAt(0, 0, 0);
        return;
    }
    
    const offsetX = Math.sin(cameraAngle) * cameraDistance;
    const offsetZ = Math.cos(cameraAngle) * cameraDistance;
    
    camera.position.set(
        player.position.x + offsetX,
        player.position.y + cameraHeight,
        player.position.z + offsetZ
    );
    camera.lookAt(player.position);
}

// 鼠标按下
function onMouseDown(event) {
    isDragging = true;
    previousMouseX = event.clientX;
}

// 鼠标移动
function onMouseMove(event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMouseX;
        cameraAngle += deltaX * 0.01;
        previousMouseX = event.clientX;
        updateCameraPosition();
    }
}

// 鼠标抬起
function onMouseUp(event) {
    isDragging = false;
}

// 鼠标滚轮
function onMouseWheel(event) {
    event.preventDefault();
    cameraDistance += event.deltaY * 0.01;
    cameraDistance = Math.max(5, Math.min(cameraDistance, 20));
    updateCameraPosition();
}

// 创建房间
function createRoom() {
    const roomSize = config.roomSize;
    
    // 地板（带格子纹理感）
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.7,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // 添加地板格子装饰
    const gridHelper = new THREE.GridHelper(roomSize, 20, 0xbdbdbd, 0xd6d6d6);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 后墙
    const backWall = createWall(roomSize, 5, 0xe8f5e9);
    backWall.position.set(0, 2.5, -roomSize / 2);
    obstacles.push({ mesh: backWall, minX: -roomSize/2, maxX: roomSize/2, minZ: -roomSize/2, maxZ: -roomSize/2 });

    // 前墙（半透明，方便观看）
    const frontWall = createWall(roomSize, 5, 0xe3f2fd);
    frontWall.position.set(0, 2.5, roomSize / 2);
    frontWall.material.transparent = true;
    frontWall.material.opacity = 0.3;
    obstacles.push({ mesh: frontWall, minX: -roomSize/2, maxX: roomSize/2, minZ: roomSize/2, maxZ: roomSize/2 });

    // 左墙
    const leftWall = createWall(roomSize, 5, 0xfff3e0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomSize / 2, 2.5, 0);
    obstacles.push({ mesh: leftWall, minX: -roomSize/2, maxX: -roomSize/2, minZ: -roomSize/2, maxZ: roomSize/2 });

    // 右墙
    const rightWall = createWall(roomSize, 5, 0xfce4ec);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(roomSize / 2, 2.5, 0);
    obstacles.push({ mesh: rightWall, minX: roomSize/2, maxX: roomSize/2, minZ: -roomSize/2, maxZ: roomSize/2 });
    
    console.log('✅ 房间已创建');
}

// 创建墙壁
function createWall(width, height, color) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.receiveShadow = true;
    scene.add(wall);
    return wall;
}

// 创建玩家（可爱卡通风格）
function createPlayer() {
    player = new THREE.Group();
    
    // 身体（圆润的胶囊形）
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 0.7, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x4fc3f7,
        roughness: 0.3,
        metalness: 0.2
    });
    playerBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    playerBody.position.y = 1.0;
    playerBody.castShadow = true;
    player.add(playerBody);
    
    // 头部（球体）
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.4
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    player.add(head);
    
    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.2
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.75, 0.25);
    player.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.75, 0.25);
    player.add(rightEye);
    
    // 微笑（小球组成）
    const smileGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    for (let i = 0; i < 5; i++) {
        const smileDot = new THREE.Mesh(smileGeometry, eyeMaterial);
        const angle = (i - 2) * 0.15;
        smileDot.position.set(angle * 0.5, 1.6, 0.28);
        player.add(smileDot);
    }
    
    // 左臂组
    const leftArmGroup = new THREE.Group();
    // 上臂
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x3ba0c7,
        roughness: 0.4
    });
    const leftArmPart = new THREE.Mesh(armGeometry, armMaterial);
    leftArmPart.position.y = -0.3;
    leftArmPart.castShadow = true;
    leftArmGroup.add(leftArmPart);
    
    // 左手（球体）
    const handGeometry = new THREE.SphereGeometry(0.12, 12, 12);
    const handMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.4
    });
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.position.y = -0.65;
    leftHand.castShadow = true;
    leftArmGroup.add(leftHand);
    
    leftArmGroup.position.set(-0.45, 1.2, 0);
    leftArm = leftArmGroup;
    player.add(leftArmGroup);
    
    // 右臂组
    const rightArmGroup = new THREE.Group();
    const rightArmPart = new THREE.Mesh(armGeometry, armMaterial);
    rightArmPart.position.y = -0.3;
    rightArmPart.castShadow = true;
    rightArmGroup.add(rightArmPart);
    
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.position.y = -0.65;
    rightHand.castShadow = true;
    rightArmGroup.add(rightHand);
    
    rightArmGroup.position.set(0.45, 1.2, 0);
    rightArm = rightArmGroup;
    player.add(rightArmGroup);
    
    // 左腿组
    const leftLegGroup = new THREE.Group();
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x2196f3,
        roughness: 0.5
    });
    const leftLegPart = new THREE.Mesh(legGeometry, legMaterial);
    leftLegPart.position.y = -0.35;
    leftLegPart.castShadow = true;
    leftLegGroup.add(leftLegPart);
    
    // 左脚（球体）
    const footGeometry = new THREE.SphereGeometry(0.14, 12, 12);
    const footMaterial = new THREE.MeshStandardMaterial({
        color: 0x1976d2,
        roughness: 0.6
    });
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.y = -0.72;
    leftFoot.castShadow = true;
    leftLegGroup.add(leftFoot);
    
    leftLegGroup.position.set(-0.18, 0.7, 0);
    leftLeg = leftLegGroup;
    player.add(leftLegGroup);
    
    // 右腿组
    const rightLegGroup = new THREE.Group();
    const rightLegPart = new THREE.Mesh(legGeometry, legMaterial);
    rightLegPart.position.y = -0.35;
    rightLegPart.castShadow = true;
    rightLegGroup.add(rightLegPart);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.y = -0.72;
    rightFoot.castShadow = true;
    rightLegGroup.add(rightFoot);
    
    rightLegGroup.position.set(0.18, 0.7, 0);
    rightLeg = rightLegGroup;
    player.add(rightLegGroup);
    
    player.position.set(0, 0, 0);
    scene.add(player);
    console.log('✅ 可爱的玩家角色已创建（圆润卡通风格）');
}

// 更新行走动画
function updateWalkAnimation() {
    if (isMoving) {
        walkAnimation += 0.15;
        
        // 手臂摆动
        leftArm.rotation.x = Math.sin(walkAnimation) * 0.5;
        rightArm.rotation.x = -Math.sin(walkAnimation) * 0.5;
        
        // 腿部摆动
        leftLeg.rotation.x = Math.sin(walkAnimation) * 0.6;
        rightLeg.rotation.x = -Math.sin(walkAnimation) * 0.6;
        
        // 轻微上下晃动
        playerBody.position.y = 1.0 + Math.abs(Math.sin(walkAnimation * 2)) * 0.05;
    } else {
        // 停止时恢复原位
        leftArm.rotation.x *= 0.9;
        rightArm.rotation.x *= 0.9;
        leftLeg.rotation.x *= 0.9;
        rightLeg.rotation.x *= 0.9;
        playerBody.position.y = 1.0;
    }
}

// 创建桌子（可爱圆润风格）
function createTable(x, y, z) {
    const tableGroup = new THREE.Group();

    // 桌面（圆角）
    const topGeometry = new THREE.BoxGeometry(3, 0.25, 2);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9800,
        roughness: 0.5,
        metalness: 0.1
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.5;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);
    
    // 桌面边缘装饰
    const edgeGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
    const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa726,
        roughness: 0.4
    });
    const corners = [
        [-1.35, 1.5, -0.85],
        [1.35, 1.5, -0.85],
        [-1.35, 1.5, 0.85],
        [1.35, 1.5, 0.85]
    ];
    corners.forEach(pos => {
        const corner = new THREE.Mesh(edgeGeometry, edgeMaterial);
        corner.position.set(...pos);
        corner.rotation.x = Math.PI / 2;
        tableGroup.add(corner);
    });

    // 桌腿（圆柱形，底部有球体）
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0xf57c00,
        roughness: 0.6
    });
    
    const footGeometry = new THREE.SphereGeometry(0.18, 12, 12);
    const footMaterial = new THREE.MeshStandardMaterial({
        color: 0xe65100,
        roughness: 0.7
    });

    const legPositions = [
        [-1.2, 0.7, -0.75],
        [1.2, 0.7, -0.75],
        [-1.2, 0.7, 0.75],
        [1.2, 0.7, 0.75]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        tableGroup.add(leg);
        
        // 桌腿底部的球
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.position.set(pos[0], 0.1, pos[2]);
        foot.castShadow = true;
        tableGroup.add(foot);
    });

    tableGroup.position.set(x, y, z);
    scene.add(tableGroup);

    // 添加到障碍物列表
    obstacles.push({
        mesh: tableGroup,
        minX: x - 1.5,
        maxX: x + 1.5,
        minZ: z - 1,
        maxZ: z + 1
    });
    
    console.log('✅ 可爱的桌子已创建');
}

// 创建宝箱（游戏风格）
function createBox(x, y, z) {
    const boxGroup = new THREE.Group();
    
    // 箱体底部（深棕色）
    const baseGeometry = new THREE.BoxGeometry(1.6, 1.0, 1.2);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8d6e63,
        roughness: 0.8,
        metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    boxGroup.add(base);
    
    // 箱盖（弧形的盖子）
    const lidGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 16, 1, false, 0, Math.PI);
    const lidMaterial = new THREE.MeshStandardMaterial({
        color: 0xa1887f,
        roughness: 0.7
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 1.0, 0);
    lid.rotation.z = Math.PI / 2;
    lid.castShadow = true;
    boxGroup.add(lid);
    
    // 金属装饰条
    const stripGeometry = new THREE.BoxGeometry(1.7, 0.12, 0.12);
    const stripMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8
    });
    
    // 横向金属条
    for (let i = 0; i < 3; i++) {
        const strip = new THREE.Mesh(stripGeometry, stripMaterial);
        strip.position.set(0, 0.3 + i * 0.3, 0.61);
        boxGroup.add(strip);
        
        const stripBack = new THREE.Mesh(stripGeometry, stripMaterial);
        stripBack.position.set(0, 0.3 + i * 0.3, -0.61);
        boxGroup.add(stripBack);
    }
    
    // 竖向金属条
    const vStripGeometry = new THREE.BoxGeometry(0.12, 1.1, 0.12);
    const vStrip1 = new THREE.Mesh(vStripGeometry, stripMaterial);
    vStrip1.position.set(0, 0.5, 0.61);
    boxGroup.add(vStrip1);
    
    const vStrip2 = new THREE.Mesh(vStripGeometry, stripMaterial);
    vStrip2.position.set(0, 0.5, -0.61);
    boxGroup.add(vStrip2);
    
    // 锁（装饰）
    const lockGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.15);
    const lockMaterial = new THREE.MeshStandardMaterial({
        color: 0xffab00,
        roughness: 0.4,
        metalness: 0.7
    });
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.set(0, 0.6, 0.7);
    boxGroup.add(lock);
    
    // 锁孔装饰
    const keyholeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const keyholeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.2
    });
    const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
    keyhole.position.set(0, 0.6, 0.78);
    boxGroup.add(keyhole);
    
    // 底部装饰球
    const cornerGeometry = new THREE.SphereGeometry(0.12, 12, 12);
    const cornerMaterial = new THREE.MeshStandardMaterial({
        color: 0x6d4c41,
        roughness: 0.6
    });
    const corners = [
        [-0.7, 0.1, -0.5],
        [0.7, 0.1, -0.5],
        [-0.7, 0.1, 0.5],
        [0.7, 0.1, 0.5]
    ];
    corners.forEach(pos => {
        const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
        corner.position.set(...pos);
        corner.castShadow = true;
        boxGroup.add(corner);
    });

    boxGroup.position.set(x, y, z);
    scene.add(boxGroup);

    // 添加到障碍物列表
    obstacles.push({
        mesh: boxGroup,
        minX: x - 0.8,
        maxX: x + 0.8,
        minZ: z - 0.6,
        maxZ: z + 0.6
    });
    
    console.log('✅ 精致的宝箱已创建');
}

// 创建完整现金捆（100元，条形扎带）
function createCashBundle(x, y, z) {
    const cashGroup = new THREE.Group();
    
    // 现金捆主体（略微圆润）
    const cashGeometry = new THREE.BoxGeometry(0.35, 0.18, 0.65);
    const cashMaterial = new THREE.MeshStandardMaterial({
        color: 0x66bb6a,
        roughness: 0.3,
        metalness: 0.1
    });
    const cash = new THREE.Mesh(cashGeometry, cashMaterial);
    cash.castShadow = true;
    cash.receiveShadow = true;
    cashGroup.add(cash);
    
    // 顶部和底部纸币边缘效果
    const edgeGeometry = new THREE.BoxGeometry(0.37, 0.025, 0.67);
    const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x81c784
    });
    const topEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    topEdge.position.y = 0.09;
    cashGroup.add(topEdge);
    
    const bottomEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    bottomEdge.position.y = -0.09;
    cashGroup.add(bottomEdge);
    
    // 条形捆钞带（红色，现实世界的绑法）
    const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0xe53935,
        roughness: 0.4
    });
    
    // 横向条形带（中间）
    const horizontalBand = new THREE.BoxGeometry(0.38, 0.06, 0.1);
    const hBand = new THREE.Mesh(horizontalBand, bandMaterial);
    hBand.position.set(0, 0, 0);
    cashGroup.add(hBand);
    
    // 纵向条形带（交叉绑法）
    const verticalBand = new THREE.BoxGeometry(0.1, 0.18, 0.08);
    const vBand = new THREE.Mesh(verticalBand, bandMaterial);
    vBand.position.set(0, 0, 0);
    cashGroup.add(vBand);
    
    // 捆钞带上的装饰（金币图标）
    const coinGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.7
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(0, 0, 0.06);
    coin.rotation.x = Math.PI / 2;
    cashGroup.add(coin);
    
    // 添加发光效果（环境）
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        transparent: true,
        opacity: 0.3,
        emissive: 0xffeb3b,
        emissiveIntensity: 0.5
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.15;
    cashGroup.add(glow);
    
    cashGroup.position.set(x, y, z);
    scene.add(cashGroup);
    
    return cashGroup;
}

// 创建散乱现金捆（小于100元）
function createLooseCashBundle(x, y, z, amount) {
    const looseGroup = new THREE.Group();
    
    // 散乱的纸币（不规则排列，更明显）
    const billCount = Math.min(Math.max(Math.ceil(amount / 10), 3), 15); // 至少3张，最多15张
    
    for (let i = 0; i < billCount; i++) {
        // 纸币更大更明显
        const billGeometry = new THREE.BoxGeometry(0.2, 0.015, 0.35);
        const billMaterial = new THREE.MeshStandardMaterial({
            color: 0x66bb6a,
            roughness: 0.4,
            metalness: 0.1
        });
        const bill = new THREE.Mesh(billGeometry, billMaterial);
        
        // 随机位置和旋转，模拟散乱（范围更大）
        const angle = (i / billCount) * Math.PI * 2;
        const radius = 0.15 + Math.random() * 0.15;
        bill.position.set(
            Math.cos(angle) * radius + (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.08,
            Math.sin(angle) * radius + (Math.random() - 0.5) * 0.15
        );
        bill.rotation.set(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );
        bill.castShadow = true;
        bill.receiveShadow = true;
        looseGroup.add(bill);
    }
    
    // 添加一些零散的硬币效果（更大更明显）
    const coinCount = Math.min(Math.ceil(amount / 20), 5);
    for (let i = 0; i < coinCount; i++) {
        const coinGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12);
        const coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0xffd700,
            emissiveIntensity: 0.3
        });
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.position.set(
            (Math.random() - 0.5) * 0.25,
            -0.08 + Math.random() * 0.08,
            (Math.random() - 0.5) * 0.25
        );
        coin.rotation.x = Math.PI / 2;
        coin.rotation.z = Math.random() * Math.PI * 2;
        coin.castShadow = true;
        looseGroup.add(coin);
    }
    
    // 添加一个半透明的底座，让散钱更明显
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x4caf50,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.1;
    base.rotation.x = Math.PI / 2;
    looseGroup.add(base);
    
    looseGroup.position.set(x, y, z);
    scene.add(looseGroup);
    
    console.log(`💵 创建散乱现金捆: ${amount}元, ${billCount}张纸币, ${coinCount}个硬币`);
    
    return looseGroup;
}

// 更新金钱显示
function updateMoneyDisplay() {
    document.getElementById('totalMoney').textContent = totalMoney;
    const fullBundles = Math.floor(totalMoney / CASH_UNIT);
    const looseMoney = totalMoney % CASH_UNIT;
    document.getElementById('cashCount').textContent = fullBundles;
    document.getElementById('looseMoney').textContent = looseMoney;
}

// 更新金钱（全局函数，供HTML调用）
window.updateMoney = function() {
    const income = parseFloat(document.getElementById('income').value) || 0;
    const expense = parseFloat(document.getElementById('expense').value) || 0;
    const dateStr = document.getElementById('selectedDate').value;
    
    if (!dateStr) {
        alert('请选择日期！');
        return;
    }
    
    // 记录到对应日期
    if (!moneyRecords[dateStr]) {
        moneyRecords[dateStr] = { income: 0, expense: 0 };
    }
    moneyRecords[dateStr].income += income;
    moneyRecords[dateStr].expense += expense;
    
    // 保存到localStorage
    saveMoneyRecords();
    
    // 计算变化（精确到1元）
    const change = income - expense;
    const newTotal = Math.max(0, totalMoney + change);
    
    console.log(`💰 ${dateStr} - 收入: ${income}元, 支出: ${expense}元, 变化: ${change}元`);
    
    // 更新现金捆
    updateCashBundles(newTotal);
    
    // 清空输入框
    document.getElementById('income').value = '';
    document.getElementById('expense').value = '';
    
    totalMoney = newTotal;
    updateMoneyDisplay();
    updateCalendar();
};

// 设置当前存款（全局函数）
window.setCurrentMoney = function() {
    const currentTotal = parseFloat(prompt('请输入当前总存款（元）：', totalMoney)) || 0;
    if (currentTotal >= 0) {
        totalMoney = currentTotal;
        updateCashBundles(totalMoney);
        updateMoneyDisplay();
        console.log(`💾 当前存款设置为: ${totalMoney}元`);
    }
};

// 更新现金捆显示
function updateCashBundles(newTotal) {
    const oldCount = cashBundles.length;
    const newCount = Math.floor(newTotal / CASH_UNIT);
    const looseMoney = newTotal % CASH_UNIT;
    
    // 处理完整现金捆
    if (newCount > oldCount) {
        // 增加现金捆
        for (let i = oldCount; i < newCount; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = boxPosition.x + col * 0.35 - 0.7;
            const z = boxPosition.z + row * 0.35 + 1.2;
            const y = 0.075;
            
            const bundle = createCashBundle(x, y, z);
            cashBundles.push(bundle);
            
            // 添加出现动画
            bundle.scale.set(0.1, 0.1, 0.1);
            animateScale(bundle, 1.0, 200);
        }
        console.log(`💵 增加了 ${newCount - oldCount} 捆现金`);
    } else if (newCount < oldCount) {
        // 减少现金捆
        for (let i = oldCount - 1; i >= newCount; i--) {
            const bundle = cashBundles.pop();
            // 添加消失动画
            animateScale(bundle, 0, 200, () => {
                scene.remove(bundle);
            });
        }
        console.log(`💸 减少了 ${oldCount - newCount} 捆现金`);
    }
    
    // 处理散乱现金
    if (looseMoney > 0) {
        const x = boxPosition.x - 0.7;
        const z = boxPosition.z + 1.2 + Math.floor(newCount / 5) * 0.35;
        const y = 0.1; // 稍微高一点，避免被遮挡
        
        if (!looseCashBundle) {
            // 创建散乱现金捆
            looseCashBundle = createLooseCashBundle(x, y, z, looseMoney);
            looseCashBundle.scale.set(0.1, 0.1, 0.1);
            animateScale(looseCashBundle, 1.0, 200);
            console.log(`💵 创建散乱现金: ${looseMoney}元`);
        } else {
            // 更新散乱现金位置和金额
            looseCashBundle.position.set(x, y, z);
            // 如果金额变化，重新创建
            const oldAmount = looseCashBundle.userData.amount || 0;
            if (oldAmount !== looseMoney) {
                scene.remove(looseCashBundle);
                looseCashBundle = createLooseCashBundle(x, y, z, looseMoney);
                looseCashBundle.scale.set(0.1, 0.1, 0.1);
                animateScale(looseCashBundle, 1.0, 200);
            }
        }
        looseCashBundle.userData.amount = looseMoney;
    } else {
        // 移除散乱现金
        if (looseCashBundle) {
            animateScale(looseCashBundle, 0, 200, () => {
                scene.remove(looseCashBundle);
                looseCashBundle = null;
            });
        }
    }
}

// 缩放动画
function animateScale(object, targetScale, duration, callback) {
    const startScale = object.scale.x;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const scale = startScale + (targetScale - startScale) * progress;
        object.scale.set(scale, scale, scale);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (callback) {
            callback();
        }
    }
    
    animate();
}

// 键盘按下
function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
    if (key === ' ' && !isJumping) {
        keys.space = true;
        isJumping = true;
        playerVelocity.y = config.jumpStrength;
    }
}

// 键盘抬起
function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
}

// 更新玩家移动
function updatePlayer() {
    // 计算移动方向（相对于相机角度）
    const direction = new THREE.Vector3();
    
    if (keys.w) {
        direction.x -= Math.sin(cameraAngle);
        direction.z -= Math.cos(cameraAngle);
    }
    if (keys.s) {
        direction.x += Math.sin(cameraAngle);
        direction.z += Math.cos(cameraAngle);
    }
    if (keys.a) {
        direction.x -= Math.cos(cameraAngle);
        direction.z += Math.sin(cameraAngle);
    }
    if (keys.d) {
        direction.x += Math.cos(cameraAngle);
        direction.z -= Math.sin(cameraAngle);
    }

    // 检查是否在移动
    isMoving = direction.length() > 0;

    // 归一化方向向量
    if (isMoving) {
        direction.normalize();
        
        // 让角色面向移动方向
        const angle = Math.atan2(direction.x, direction.z);
        player.rotation.y = angle;
    }

    // 计算新位置
    const newX = player.position.x + direction.x * config.playerSpeed;
    const newZ = player.position.z + direction.z * config.playerSpeed;

    // 碰撞检测
    let canMove = true;
    const playerRadius = config.playerRadius;

    for (let obstacle of obstacles) {
        if (checkCollision(newX, newZ, playerRadius, obstacle)) {
            canMove = false;
            break;
        }
    }

    // 如果没有碰撞，移动玩家
    if (canMove) {
        player.position.x = newX;
        player.position.z = newZ;
    }

    // 应用重力和跳跃
    playerVelocity.y -= config.gravity;
    player.position.y += playerVelocity.y;

    // 地面检测
    if (player.position.y <= 0) {
        player.position.y = 0;
        playerVelocity.y = 0;
        isJumping = false;
    }

    // 更新行走动画
    updateWalkAnimation();

    // 相机跟随玩家
    updateCameraPosition();
}

// 简单的AABB碰撞检测
function checkCollision(x, z, radius, obstacle) {
    const closestX = Math.max(obstacle.minX, Math.min(x, obstacle.maxX));
    const closestZ = Math.max(obstacle.minZ, Math.min(z, obstacle.maxZ));

    const distanceX = x - closestX;
    const distanceZ = z - closestZ;

    const distanceSquared = (distanceX * distanceX) + (distanceZ * distanceZ);
    return distanceSquared < (radius * radius);
}

// 窗口大小改变
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    updatePlayer();

    renderer.render(scene, camera);
}

// ========== 日历系统 ==========

// 初始化日历
function initCalendar() {
    // 从localStorage加载记录
    loadMoneyRecords();
    
    // 设置当前日期为今天
    const today = new Date();
    selectedDate = new Date(today);
    currentMonth = new Date(today);
    
    // 设置日期输入框
    const dateInput = document.getElementById('selectedDate');
    dateInput.value = formatDate(selectedDate);
    dateInput.min = '2025-01-01';
    dateInput.max = formatDate(new Date());
    dateInput.addEventListener('change', function() {
        selectedDate = new Date(this.value);
        updateCalendar();
    });
    
    updateCalendar();
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 更新日历显示
function updateCalendar() {
    const calendarEl = document.getElementById('calendar');
    const monthEl = document.getElementById('currentMonth');
    
    // 显示当前月份
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    monthEl.textContent = `${year}年${month + 1}月`;
    
    // 清空日历
    calendarEl.innerHTML = '';
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-weekday';
        dayEl.textContent = day;
        calendarEl.appendChild(dayEl);
    });
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 添加上个月的日期（灰色）
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createCalendarDay(day, true, year, month - 1);
        calendarEl.appendChild(dayEl);
    }
    
    // 添加当月的日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = formatDate(date) === formatDate(today);
        const dayEl = createCalendarDay(day, false, year, month, isToday);
        calendarEl.appendChild(dayEl);
    }
    
    // 添加下个月的日期（灰色）
    const remainingDays = 42 - (firstDayWeek + daysInMonth); // 6行x7天
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createCalendarDay(day, true, year, month + 1);
        calendarEl.appendChild(dayEl);
    }
}

// 创建日历日期元素
function createCalendarDay(day, isOtherMonth, year, month, isToday = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    if (isToday) {
        dayEl.classList.add('today');
    }
    
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    
    // 检查是否有记录
    if (moneyRecords[dateStr]) {
        dayEl.classList.add('has-record');
    }
    
    // 检查是否被选中
    if (formatDate(date) === formatDate(selectedDate)) {
        dayEl.classList.add('selected');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);
    
    // 点击选择日期
    dayEl.addEventListener('click', function() {
        if (!isOtherMonth) {
            selectedDate = new Date(year, month, day);
            document.getElementById('selectedDate').value = dateStr;
            updateCalendar();
        }
    });
    
    return dayEl;
}

// 切换月份
window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    updateCalendar();
};

// 保存记录到localStorage
function saveMoneyRecords() {
    localStorage.setItem('moneyRecords', JSON.stringify(moneyRecords));
    localStorage.setItem('totalMoney', totalMoney.toString());
}

// 从localStorage加载记录
function loadMoneyRecords() {
    const saved = localStorage.getItem('moneyRecords');
    if (saved) {
        moneyRecords = JSON.parse(saved);
    }
    
    const savedMoney = localStorage.getItem('totalMoney');
    if (savedMoney) {
        totalMoney = parseFloat(savedMoney);
        updateMoneyDisplay();
        updateCashBundles(totalMoney);
    }
}

// 页面加载完成后启动游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        init();
        initCalendar();
    });
} else {
    init();
    initCalendar();
}
