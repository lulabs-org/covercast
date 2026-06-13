'use client'

import { TemplateToolbarButtons } from '../panels/TemplatePanel'
import { EXPORT_FORMAT_OPTIONS } from '@/hooks/ui/useExportScene'
import { useEditorStore } from '@/stores/useEditorStore'
import styles from '../SceneEditor.module.css'

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
  // ── Editor Store ──
  const history = useEditorStore((s) => s.history)
  const undoAction = useEditorStore((s) => s.undoAction)
  const redoAction = useEditorStore((s) => s.redoAction)
  const exportFormat = useEditorStore((s) => s.exportFormat)
  const setExportFormat = useEditorStore((s) => s.setExportFormat)
  const scene = useEditorStore((s) => s.scene)
  const activeCustomTemplate = useEditorStore((s) => s.getActiveCustomTemplate())
  const hasUnsavedCustomTemplateChanges = useEditorStore((s) => s.getHasUnsavedChanges(scene))
  const saveActiveCustomTemplateAction = useEditorStore((s) => s.saveActiveCustomTemplateAction)
  const importTemplateFileAction = useEditorStore((s) => s.importTemplateFileAction)

  return (
    <section className={styles.editorToolbar} aria-label="Covercast editor controls">
      <div>
        <p className={styles.eyebrow}>Covercast</p>
        <h1>封面编辑器</h1>
      </div>
      <div className="toolbar-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={undoAction}
          disabled={history.past.length === 0}
          title="撤销 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={redoAction}
          disabled={history.future.length === 0}
          title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
        >
          ↷
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={openCreateBlankCoverModal}
          title="新建封面"
        >
          新建封面
        </button>
        <button type="button" className="secondary-button" onClick={addTextElement}>
          添加文字
        </button>
        <button type="button" className="secondary-button" onClick={addRectElement}>
          添加矩形
        </button>
        <button type="button" className="secondary-button" onClick={addEllipseElement}>
          添加椭圆
        </button>
        <label className="secondary-button file-button">
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
            className="primary-button"
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
        <div className="export-control" aria-label="导出场景">
          <select
            className="export-format-select"
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
            className="primary-button muted"
            onClick={() => void exportScene(exportFormat)}
          >
            导出
          </button>
        </div>
      </div>
    </section>
  )
}
