// Scene domain (聚合根:类型 / 工厂 / 操作 / 选择 / 查询 / 变换 / 拖拽 / 键盘 / 剪贴板 / 模板数据)
export * from './scene'

// Canvas (画布尺寸 + 缩放 SSOT)
export * from './canvas'

// Alignment (smart-guide 吸附引擎 + spatial-index)
export * from './alignment'

// History (撤销/重做纯栈操作)
export * from './history'

// Custom template (类型 / 校验器 / 工厂 / 去重命名)
export * from './template'

// Export (scene → svg / png / jpg / json)
export * from './export'
