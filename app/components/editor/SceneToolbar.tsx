'use client'

import { useEditor } from '../EditorContext'
import { TemplateToolbarButtons } from '../panels/TemplatePanel'
import { EXPORT_FORMAT_OPTIONS } from '../../../hooks/useExportScene'
import { useHistoryStore } from '../../../stores/useHistoryStore'
import { useCanvasStore } from '../../../stores/useCanvasStore'
import { useTemplateStore } from '../../../stores/useTemplateStore'

export function SceneToolbar() {
  const {
    addTextElement,
    addRectElement,
    addEllipseElement,
    handleAssetInput,
    openCreateBlankCoverModal,
    exportScene,
    handleOpenSaveTemplateDialog,
  } = useEditor()

  // ── History Store ──
  const history = useHistoryStore((s) => s.history)
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)

  // ── Canvas Store ──
  const exportFormat = useCanvasStore((s) => s.exportFormat)
  const setExportFormat = useCanvasStore((s) => s.setExportFormat)

  // ── Template Store ──
  const activeCustomTemplate = useTemplateStore((s) => s.getActiveCustomTemplate())
  const hasUnsavedCustomTemplateChanges = useTemplateStore((s) => s.getHasUnsavedChanges())
  const saveActiveCustomTemplate = useTemplateStore((s) => s.saveActiveCustomTemplate)
  const importTemplateFile = useTemplateStore((s) => s.importTemplateFile)

  return (
    <section className="editor-toolbar" aria-label="Covercast editor controls">
      <div>
        <p className="eyebrow">Covercast</p>
        <h1>封面编辑器</h1>
      </div>
      <div className="toolbar-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={undo}
          disabled={history.past.length === 0}
          title="撤销 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={redo}
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
            onClick={saveActiveCustomTemplate}
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
          onImport={(file) => void importTemplateFile(file)}
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
