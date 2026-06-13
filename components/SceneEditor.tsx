'use client'

import { EditorProvider, useEditor } from './EditorContext'
import { SaveTemplateDialog } from './dialogs/SaveTemplateDialog'
import { SceneToolbar } from './editor/SceneToolbar'
import { StagePanel } from './editor/StagePanel'
import { LeftSidebar } from './editor/sidebar/LeftSidebar'
import { RightSidebar } from './editor/sidebar/RightSidebar'
import { CreateBlankCoverModal } from './panels/CreateBlankCoverModal'

export default function SceneEditor() {
  return (
    <EditorProvider>
      <SceneEditorInner />
    </EditorProvider>
  )
}

function SceneEditorInner() {
  const {
    isCreateBlankCoverModalOpen,
    createBlankCoverConfig,
    openCreateBlankCoverModal,
    closeCreateBlankCoverModal,
    updateCreateBlankCoverConfig,
    createBlankCover,
    createBlankCoverPresetOptions,
    createBlankCoverTemplateOptions,
    saveTemplateDialog,
    resizerLeftRef,
    resizerRightRef,
    handleMouseDown,
  } = useEditor()

  return (
    <>
      <CreateBlankCoverModal
        isOpen={isCreateBlankCoverModalOpen}
        config={createBlankCoverConfig}
        presetOptions={createBlankCoverPresetOptions}
        templateOptions={createBlankCoverTemplateOptions}
        onCancel={closeCreateBlankCoverModal}
        onConfirm={createBlankCover}
        onUpdateConfig={updateCreateBlankCoverConfig}
      />

      <main className="editor-shell">
        <SceneToolbar />

        <SaveTemplateDialog
          show={saveTemplateDialog.showDialog}
          title="另存为模板"
          templateName={saveTemplateDialog.templateName}
          nameError={saveTemplateDialog.nameError}
          onSetName={saveTemplateDialog.setTemplateName}
          onSave={saveTemplateDialog.handleSave}
          onCancel={saveTemplateDialog.closeDialog}
        />

        <section className="editor-grid">
          <LeftSidebar />

          <div
            ref={resizerLeftRef}
            className="panel-resizer"
            onMouseDown={(e) => handleMouseDown('left', e)}
          />

          <StagePanel />

          <div
            ref={resizerRightRef}
            className="panel-resizer"
            onMouseDown={(e) => handleMouseDown('right', e)}
          />

          <RightSidebar />
        </section>
      </main>
    </>
  )
}
