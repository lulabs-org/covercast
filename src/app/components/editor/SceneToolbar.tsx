'use client'

import { TemplateToolbarButtons } from '../panels/TemplatePanel'
import type { ExportFormat, EXPORT_FORMAT_OPTIONS } from '../../hooks/useExportScene'
import type { CustomSceneTemplate } from '../../hooks/useTemplateManager'

type SceneToolbarProps = {
  // History
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Add elements
  addTextElement: () => void
  addRectElement: () => void
  addEllipseElement: () => void
  handleAssetInput: (event: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'replace') => void

  // Create blank cover
  onCreateBlankCover: () => void

  // Template
  activeCustomTemplate: CustomSceneTemplate | null
  hasUnsavedCustomTemplateChanges: boolean
  saveActiveCustomTemplate: () => void
  onOpenSaveTemplateDialog: () => void
  importTemplateFile: (file: File) => Promise<void>

  // Export
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  exportScene: (format: ExportFormat) => Promise<void>
  EXPORT_FORMAT_OPTIONS: typeof EXPORT_FORMAT_OPTIONS
}

export function SceneToolbar({
  undo,
  redo,
  canUndo,
  canRedo,
  addTextElement,
  addRectElement,
  addEllipseElement,
  handleAssetInput,
  onCreateBlankCover,
  activeCustomTemplate,
  hasUnsavedCustomTemplateChanges,
  saveActiveCustomTemplate,
  onOpenSaveTemplateDialog,
  importTemplateFile,
  exportFormat,
  setExportFormat,
  exportScene,
  EXPORT_FORMAT_OPTIONS,
}: SceneToolbarProps) {
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
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
        >
          ↷
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onCreateBlankCover}
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
          onOpenSaveTemplateDialog={onOpenSaveTemplateDialog}
          onImport={(file) => void importTemplateFile(file)}
        />
        <div className="export-control" aria-label="导出场景">
          <select
            className="export-format-select"
            value={exportFormat}
            onChange={(event) => setExportFormat(event.currentTarget.value as ExportFormat)}
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
