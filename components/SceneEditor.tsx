'use client'

import { EditorProviders } from './editor/contexts'
import { useEditorBootstrap } from './editor/contexts/EditorBootstrap'
import { useEditorActions } from './editor/contexts/EditorActionContext'
import { useEditorAsset } from './editor/contexts/EditorAssetContext'
import { SaveTemplateDialog } from './dialogs/SaveTemplateDialog'
import { SceneToolbar } from './editor/SceneToolbar'
import { StagePanel } from './editor/StagePanel'
import { LeftSidebar } from './editor/sidebar/LeftSidebar'
import { RightSidebar } from './editor/sidebar/RightSidebar'
import { CreateBlankCoverModal } from './panels/CreateBlankCoverModal'
import { useScrollVisibility } from '@/hooks/ui/useScrollVisibility'
import { usePanelResize } from '@/hooks/ui/usePanelResize'
import { useDialogState } from '@/hooks/ui/useDialogState'
import styles from './SceneEditor.module.css'

export default function SceneEditor() {
  const { leftPanelRef, rightPanelRef, stageViewportRef } = useScrollVisibility()
  const { panelWidths, resizerLeftRef, resizerRightRef, handleMouseDown } = usePanelResize()
  const dialogState = useDialogState()

  // ── Bootstrap: initialization side effects (no Context dependency) ──
  useEditorBootstrap(stageViewportRef)

  return (
    <EditorProviders>
      <SceneEditorInner
        leftPanelRef={leftPanelRef}
        rightPanelRef={rightPanelRef}
        resizerLeftRef={resizerLeftRef}
        resizerRightRef={resizerRightRef}
        panelWidths={panelWidths}
        handleMouseDown={handleMouseDown}
        dialogState={dialogState}
      />
    </EditorProviders>
  )
}

function SceneEditorInner({
  leftPanelRef,
  rightPanelRef,
  resizerLeftRef,
  resizerRightRef,
  panelWidths,
  handleMouseDown,
  dialogState,
}: {
  leftPanelRef: React.RefObject<HTMLDivElement | null>
  rightPanelRef: React.RefObject<HTMLDivElement | null>
  resizerLeftRef: React.RefObject<HTMLDivElement | null>
  resizerRightRef: React.RefObject<HTMLDivElement | null>
  panelWidths: { leftPanel: number; rightPanel: number }
  handleMouseDown: (side: 'left' | 'right', e: React.MouseEvent) => void
  dialogState: ReturnType<typeof useDialogState>
}) {
  const { addTextElement, addRectElement, addEllipseElement } = useEditorActions()
  const { handleAssetInput } = useEditorAsset()

  return (
    <>
      <CreateBlankCoverModal
        isOpen={dialogState.isCreateBlankCoverModalOpen}
        config={dialogState.createBlankCoverConfig}
        presetOptions={dialogState.createBlankCoverPresetOptions}
        templateOptions={dialogState.createBlankCoverTemplateOptions}
        onCancel={dialogState.closeCreateBlankCoverModal}
        onConfirm={dialogState.createBlankCover}
        onUpdateConfig={dialogState.updateCreateBlankCoverConfig}
      />

      <main className={styles.editorShell}>
        <SceneToolbar
          addTextElement={addTextElement}
          addRectElement={addRectElement}
          addEllipseElement={addEllipseElement}
          handleAssetInput={handleAssetInput}
          openCreateBlankCoverModal={dialogState.openCreateBlankCoverModal}
          exportScene={dialogState.exportScene}
          handleOpenSaveTemplateDialog={dialogState.handleOpenSaveTemplateDialog}
        />

        <SaveTemplateDialog
          show={dialogState.saveTemplateDialog.showDialog}
          title="另存为模板"
          templateName={dialogState.saveTemplateDialog.templateName}
          nameError={dialogState.saveTemplateDialog.nameError}
          onSetName={dialogState.saveTemplateDialog.setTemplateName}
          onSave={dialogState.saveTemplateDialog.handleSave}
          onCancel={dialogState.saveTemplateDialog.closeDialog}
        />

        <section className={styles.editorGrid}>
          <LeftSidebar leftPanelRef={leftPanelRef} leftPanelWidth={panelWidths.leftPanel} />

          <div
            ref={resizerLeftRef}
            className={styles.panelResizer}
            onMouseDown={(e) => handleMouseDown('left', e)}
          />

          <StagePanel />

          <div
            ref={resizerRightRef}
            className={styles.panelResizer}
            onMouseDown={(e) => handleMouseDown('right', e)}
          />

          <RightSidebar rightPanelRef={rightPanelRef} rightPanelWidth={panelWidths.rightPanel} />
        </section>
      </main>
    </>
  )
}
