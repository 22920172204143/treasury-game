class AssetManager {
  constructor({ THREE, wx, assets }) {
    this.THREE = THREE
    this.wx = wx
    this.assets = assets
    this._textureCache = new Map()
  }

  resolveFile(file) {
    // 统一相对路径解析：从 game.js 所在根目录开始
    // 例如：assets/textures/xxx.png
    return `./${file}`
  }

  getModelSpec(group, id) {
    const spec = this.assets?.models?.[group]?.[id]
    if (!spec) throw new Error(`Unknown model: models.${group}.${id}`)
    return spec
  }

  getTextureSpec(group, id) {
    const spec = this.assets?.textures?.[group]?.[id]
    if (!spec) throw new Error(`Unknown texture: textures.${group}.${id}`)
    return spec
  }

  async loadTexture(group, id) {
    const cacheKey = `tex:${group}:${id}`
    if (this._textureCache.has(cacheKey)) return this._textureCache.get(cacheKey)

    const THREE = this.THREE
    const spec = this.getTextureSpec(group, id)

    let tex
    if (spec.type === 'procedural') {
      if (spec.prefab === 'wood_planks') {
        tex = this._createWoodPlankTexture()
      } else {
        throw new Error(`Unknown procedural texture prefab: ${spec.prefab}`)
      }
    } else if (spec.type === 'image') {
      // 依赖 three-platformize 的图片加载适配
      tex = await new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader()
        loader.load(
          this.resolveFile(spec.file),
          (t) => resolve(t),
          undefined,
          (e) => reject(e)
        )
      })
    } else {
      throw new Error(`Unsupported texture type: ${spec.type}`)
    }

    if (tex) {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      if (spec.repeat && tex.repeat) tex.repeat.set(spec.repeat[0], spec.repeat[1])
      tex.needsUpdate = true
    }

    this._textureCache.set(cacheKey, tex)
    return tex
  }

  // 同步获取纹理：仅支持 procedural（用于不想引入 async/await 的初始化阶段）
  // 如果你切到 image 贴图，建议改用 loadTexture(...).then(...) 异步设置材质 map。
  getTextureSync(group, id) {
    const cacheKey = `tex:${group}:${id}`
    if (this._textureCache.has(cacheKey)) return this._textureCache.get(cacheKey)

    const THREE = this.THREE
    const spec = this.getTextureSpec(group, id)
    if (spec.type !== 'procedural') return null

    let tex
    if (spec.prefab === 'wood_planks') {
      tex = this._createWoodPlankTexture()
    } else {
      return null
    }

    if (tex) {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      if (spec.repeat && tex.repeat) tex.repeat.set(spec.repeat[0], spec.repeat[1])
      tex.needsUpdate = true
    }

    this._textureCache.set(cacheKey, tex)
    return tex
  }

  // 说明：小游戏里 glTF 导入需要 GLTFLoader。
  // 你可以把 GLTFLoader 放到 js/libs 并挂到 THREE 上，或改造成 require 引入。
  // 这里先做“架构预留”，没 loader 时会抛出明确错误。
  async loadGLTF(modelSpec) {
    const THREE = this.THREE
    if (!THREE.GLTFLoader) {
      throw new Error('GLTFLoader not found on THREE. Add GLTFLoader and then use .glb/.gltf models.')
    }

    const loader = new THREE.GLTFLoader()
    const url = this.resolveFile(modelSpec.file)
    return await new Promise((resolve, reject) => {
      loader.load(url, (gltf) => resolve(gltf), undefined, (e) => reject(e))
    })
  }

  _createWoodPlankTexture() {
    const THREE = this.THREE
    const c = this.wx.createCanvas()
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')

    ctx.fillStyle = '#b98a5c'
    ctx.fillRect(0, 0, c.width, c.height)

    const plankCount = 8
    const plankW = c.width / plankCount
    for (let i = 0; i < plankCount; i++) {
      const x = Math.floor(i * plankW)
      const w = Math.ceil(plankW)
      const light = i % 2 === 0
      ctx.fillStyle = light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
      ctx.fillRect(x, 0, w, c.height)

      ctx.fillStyle = 'rgba(40,25,15,0.35)'
      ctx.fillRect(x, 0, 2, c.height)

      ctx.strokeStyle = light ? 'rgba(70,40,20,0.12)' : 'rgba(70,40,20,0.18)'
      ctx.lineWidth = 1
      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        const y = Math.floor((k + 1) * (c.height / 4) + (Math.random() - 0.5) * 10)
        ctx.moveTo(x + 6, y)
        ctx.bezierCurveTo(x + w * 0.3, y - 6, x + w * 0.7, y + 6, x + w - 6, y)
        ctx.stroke()
      }
    }

    const tex = THREE.CanvasTexture ? new THREE.CanvasTexture(c) : new THREE.Texture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3, 2)
    tex.needsUpdate = true
    return tex
  }
}

module.exports = { AssetManager }
