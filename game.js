// 导入 Three.js 模块
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
let player, playerVelocity = { x: 0, y: 0, z: 0 };
let isJumping = false;

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

// 初始化场景
function init() {
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
    camera.position.set(0, 8, 12);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

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
    createBox(-4, 0, -4);

    // 轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 20;

    // 键盘事件监听
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 窗口大小改变
    window.addEventListener('resize', onWindowResize);

    // 开始动画循环
    animate();
}

// 创建房间
function createRoom() {
    const roomSize = config.roomSize;
    
    // 地板
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 墙壁材质
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8f5e9,
        roughness: 0.9,
        metalness: 0.1
    });

    // 后墙
    const backWall = createWall(roomSize, 5, 0x00000000);
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

// 创建玩家
function createPlayer() {
    const geometry = new THREE.CapsuleGeometry(config.playerRadius, 2, 16, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x4fc3f7,
        roughness: 0.4,
        metalness: 0.6
    });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 1.5, 0);
    player.castShadow = true;
    scene.add(player);
}

// 创建桌子
function createTable(x, y, z) {
    const tableGroup = new THREE.Group();

    // 桌面
    const topGeometry = new THREE.BoxGeometry(3, 0.2, 2);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x8d6e63,
        roughness: 0.7
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.5;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // 桌腿
    const legGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x6d4c41,
        roughness: 0.8
    });

    const legPositions = [
        [-1.3, 0.75, -0.8],
        [1.3, 0.75, -0.8],
        [-1.3, 0.75, 0.8],
        [1.3, 0.75, 0.8]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        tableGroup.add(leg);
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
}

// 创建箱子
function createBox(x, y, z) {
    const boxGroup = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
        color: 0xd84315,
        roughness: 0.9,
        metalness: 0.1
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.y = 0.75;
    box.castShadow = true;
    box.receiveShadow = true;
    boxGroup.add(box);

    // 添加箱子细节（条纹）
    const stripeGeometry = new THREE.BoxGeometry(1.6, 0.1, 1.6);
    const stripeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        roughness: 0.5
    });
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.y = 0.75;
    boxGroup.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.y = 0.75;
    stripe2.rotation.y = Math.PI / 2;
    boxGroup.add(stripe2);

    boxGroup.position.set(x, y, z);
    scene.add(boxGroup);

    // 添加到障碍物列表
    obstacles.push({
        mesh: boxGroup,
        minX: x - 0.75,
        maxX: x + 0.75,
        minZ: z - 0.75,
        maxZ: z + 0.75
    });
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
    // 计算移动方向
    const direction = new THREE.Vector3();
    
    if (keys.w) direction.z -= 1;
    if (keys.s) direction.z += 1;
    if (keys.a) direction.x -= 1;
    if (keys.d) direction.x += 1;

    // 归一化方向向量
    if (direction.length() > 0) {
        direction.normalize();
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
    if (player.position.y <= 1.5) {
        player.position.y = 1.5;
        playerVelocity.y = 0;
        isJumping = false;
    }

    // 相机跟随玩家
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 12;
    camera.lookAt(player.position);
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

// 启动游戏
init();

