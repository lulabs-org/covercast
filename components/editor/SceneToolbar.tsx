'use client'

import { TemplateToolbarButtons } from '../panels/TemplatePanel'
import { EXPORT_FORMAT_OPTIONS } from '@/hooks/ui/useExportScene'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import {
  undoAction,
  redoAction,
  saveActiveCustomTemplateAction,
  importTemplateFileAction,
} from '@/stores/editor-actions'
import styles from '../SceneEditor.module.css'
import ui from '@/styles/ui.module.css'

interface SceneToolbarProps {
  addTextElement: () => void
  addRectElement: () => void
  addEllipseElement: () => void
  handleAssetInput: (event: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'replace') => void
  openCreateBlankCoverModal: () => void
  exportScene: (format: 'png' | 'jpeg' | 'svg' | 'json') => Promise<void>
  handleOpenSaveTemplateDialog: () => void
}

export function SceneToolbar({
  addTextElement,
  addRectElement,
  addEllipseElement,
  handleAssetInput,
  openCreateBlankCoverModal,
  exportScene,
  handleOpenSaveTemplateDialog,
}: SceneToolbarProps) {
  // ── History Store ──
  const history = useHistoryStore((s) => s.history)

  // ── Canvas Store ──
  const exportFormat = useCanvasStore((s) => s.exportFormat)
  const setExportFormat = useCanvasStore((s) => s.setExportFormat)

  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)

  // ── Template Store ──
  const activeCustomTemplate = useTemplateStore((s) => s.getActiveCustomTemplate())
  const hasUnsavedCustomTemplateChanges = useTemplateStore((s) => s.getHasUnsavedChanges(scene))

  return (
    <section className={styles.editorToolbar} aria-label="Covercast editor controls">
      <div>
        <p className={styles.eyebrow}>Covercast</p>
        <h1>封面编辑器</h1>
      </div>
      <div className={ui.toolbarActions}>
        <button
          type="button"
          className={ui.secondaryButton}
          onClick={undoAction}
          disabled={history.past.length === 0}
          title="撤销 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className={ui.secondaryButton}
          onClick={redoAction}
          disabled={history.future.length === 0}
          title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
        >
          ↷
        </button>
        <button
          type="button"
          className={ui.primaryButton}
          onClick={openCreateBlankCoverModal}
          title="新建封面"
        >
          新建封面
        </button>
        <button type="button" className={ui.secondaryButton} onClick={addTextElement}>
          添加文字
        </button>
        <button type="button" className={ui.secondaryButton} onClick={addRectElement}>
          添加矩形
        </button>
        <button type="button" className={ui.secondaryButton} onClick={addEllipseElement}>
          添加椭圆
        </button>
        <label className={`${ui.secondaryButton} ${ui.fileButton}`}>
          添加图片
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => handleAssetInput(event, 'add')}
          />
        </label>
        {activeCustomTemplate ? (
          <button
            type="button"
            className={ui.primaryButton}
            onClick={saveActiveCustomTemplateAction}
            disabled={!hasUnsavedCustomTemplateChanges}
            title={
              hasUnsavedCustomTemplateChanges ? '覆盖保存当前自定义模板' : '当前模板没有未保存修改'
            }
          >
            保存模板
          </button>
        ) : null}
        <TemplateToolbarButtons
          activeCustomTemplate={activeCustomTemplate}
          onOpenSaveTemplateDialog={handleOpenSaveTemplateDialog}
          onImport={(file) => void importTemplateFileAction(file)}
        />
        <div className={ui.exportControl} aria-label="导出场景">
          <select
            className={ui.exportFormatSelect}
            value={exportFormat}
            onChange={(event) => setExportFormat(event.currentTarget.value as typeof exportFormat)}
            title="选择导出格式"
          >
            {EXPORT_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={ui.primaryButtonMuted}
            onClick={() => void exportScene(exportFormat)}
          >
            导出
          </button>
        </div>
      </div>
    </section>
  )
}
