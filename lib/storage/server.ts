/**
 * 服务端存储 — 仅可在 Route Handlers / Server Components / Server Actions 中导入。
 * 使用 Node.js fs API，客户端导入会导致构建失败或运行时崩溃。
 */
export {
  readStoredScene,
  writeStoredScene,
  readSceneBySlot,
  writeSceneBySlot,
  deleteSceneSlot,
  listTemplateSlots,
  listAllSlots,
  saveAssetFile,
  readAssetFile,
} from './server-storage'
