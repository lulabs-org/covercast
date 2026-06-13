'use client'

import { useEditorBridge } from '../hooks/useEditorBridge'

// UI components
import { SaveTemplateDialog } from './dialogs/SaveTemplateDialog'
import { SceneToolbar } from './editor/SceneToolbar'
import { StagePanel } from './editor/StagePanel'
import { LeftSidebar } from './editor/sidebar/LeftSidebar'
import { RightSidebar } from './editor/sidebar/RightSidebar'
import { CreateBlankCoverModal } from './panels/CreateBlankCoverModal'

export default function SceneEditor() {
  const {
    // Layout
    leftPanelRef,
    rightPanelRef,
    stageViewportRef,
    panelWidths,
    resizerLeftRef,
    resizerRightRef,
    handleMouseDown,
    // Refs & assets
    svgRef,
    resolveSrc,
    localFontManager,
    // Scene actions
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
    patchSelected,
    // Asset
    handleAssetInput,
    // Clipboard
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
    // Blank cover
    isCreateBlankCoverModalOpen,
    createBlankCoverConfig,
    openCreateBlankCoverModal,
    closeCreateBlankCoverModal,
    updateCreateBlankCoverConfig,
    createBlankCover,
    createBlankCoverPresetOptions,
    createBlankCoverTemplateOptions,
    // Save template dialog
    saveTemplateDialog,
    // Export & template
    exportScene,
    handleOpenSaveTemplateDialog,
    // Stage handlers
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
  } = useEditorBridge()

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
        <SceneToolbar
          addTextElement={addTextElement}
          addRectElement={addRectElement}
          addEllipseElement={addEllipseElement}
          handleAssetInput={handleAssetInput}
          onCreateBlankCover={openCreateBlankCoverModal}
          exportScene={exportScene}
          onOpenSaveTemplateDialog={handleOpenSaveTemplateDialog}
        />

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
          <LeftSidebar
            leftPanelRef={leftPanelRef}
            leftPanelWidth={panelWidths.leftPanel}
            toggleElementHidden={toggleElementHidden}
            toggleElementLocked={toggleElementLocked}
            moveElementLayer={moveElementLayer}
          />

          <div
            ref={resizerLeftRef}
            className="panel-resizer"
            onMouseDown={(e) => handleMouseDown('left', e)}
          />

          <StagePanel
            svgRef={svgRef}
            stageViewportRef={stageViewportRef}
            resolveSrc={resolveSrc}
            onCanvasPointerDown={handleCanvasPointerDown}
            onElementPointerDown={handleElementPointerDown}
            onResizePointerDown={handleResizePointerDown}
            onGroupDragPointerDown={handleGroupDragPointerDown}
            onGroupResizePointerDown={handleGroupResizePointerDown}
            onTextElementDoubleClick={handleTextElementDoubleClick}
          />

          <div
            ref={resizerRightRef}
            className="panel-resizer"
            onMouseDown={(e) => handleMouseDown('right', e)}
          />

          <RightSidebar
            rightPanelRef={rightPanelRef}
            rightPanelWidth={panelWidths.rightPanel}
            patchSelected={patchSelected}
            copySelectedElements={copySelectedElements}
            pasteCopiedElements={pasteCopiedElements}
            canPasteElement={canPasteElement}
            deleteSelected={deleteSelected}
            handleAssetInput={handleAssetInput}
            localFontManager={localFontManager}
          />
        </section>
      </main>
    </>
  )
}
