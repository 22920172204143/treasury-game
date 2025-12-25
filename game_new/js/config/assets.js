// 资源清单（逻辑名 -> 文件路径/类型/参数）
//
// 约定：
// - 真实资源文件放在 /assets 下
// - 代码只引用逻辑名（id），通过 AssetManager 解析到路径
// - 你要新增物品：1) 放文件到 assets/... 2) 在这里加一条配置

module.exports = {
  scene: {
    // 当前使用的角色（可切换为 glb 等）
    character: 'doraemon_procedural',
    // 当前地板材质
    floor: 'wood_planks_procedural'
  },

  models: {
    characters: {
      // 现阶段：程序生成（你已有的“哆啦A梦”几何体）
      doraemon_procedural: {
        type: 'procedural',
        prefab: 'doraemon'
      },

      // 示例：如果你未来放一个 glb
      // 把文件放到：assets/models/characters/doraemon/model.glb
      // 然后把 scene.character 改成 'doraemon_glb'
      doraemon_glb: {
        type: 'gltf',
        file: 'assets/models/characters/doraemon/model.glb',
        scale: 1,
        y: 0
      }
    },

    money: {
      // 示例：未来你也可以用真实模型替换纸币/钱捆
      bill_100_glb: {
        type: 'gltf',
        file: 'assets/models/money/bill_100.glb',
        scale: 1
      },
      bundle_10k_glb: {
        type: 'gltf',
        file: 'assets/models/money/bundle_10k.glb',
        scale: 1
      }
    }
  },

  textures: {
    floors: {
      // 现阶段：程序生成木板条纹
      wood_planks_procedural: {
        type: 'procedural',
        prefab: 'wood_planks',
        repeat: [3, 2]
      },

      // 示例：未来换真实贴图
      // 把图片放到：assets/textures/floors/wood_planks.png
      // 然后把 scene.floor 改成 'wood_planks_png'
      wood_planks_png: {
        type: 'image',
        file: 'assets/textures/floors/wood_planks.png',
        repeat: [3, 2]
      }
    }
  }
}
