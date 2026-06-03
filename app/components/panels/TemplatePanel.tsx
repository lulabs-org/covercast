"use client";

import { type ReactNode } from "react";
import { BUILT_IN_TEMPLATES } from "../../lib/scene";
import { type CustomSceneTemplate } from "../../hooks/useTemplateManager";

function SidebarSection({
  title,
  caption,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  caption: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <small>{caption}</small>
        <b>{collapsed ? "＋" : "－"}</b>
      </button>
      {collapsed ? null : <div className="sidebar-section-body">{children}</div>}
    </section>
  );
}

function TemplateCard({
  name,
  description,
  badge,
  active,
  dirty = false,
  onApply,
  onDelete,
}: {
  name: string;
  description: string;
  badge: string;
  active: boolean;
  dirty?: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={[
      "template-card",
      active ? "active" : "",
      dirty ? "dirty" : "",
    ].filter(Boolean).join(" ")}>
      <button type="button" className="template-card-button" onClick={onApply}>
        <div className="template-card-content">
          <span className="template-card-name">{name}</span>
          <small className="template-card-desc">{description}</small>
        </div>
        <span className="template-card-badge">{badge}</span>
      </button>
      {onDelete ? (
        <button
          type="button"
          className="template-card-delete"
          aria-label={`删除模板 ${name}`}
          onClick={onDelete}
          title="删除模板"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function formatTemplateDate(value: string, prefix = "保存于") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "保存在浏览器缓存";
  }

  return `${prefix} ${date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  })}`;
}

export function TemplatePanel({
  customTemplates,
  activeTemplateId,
  hasUnsavedCustomTemplateChanges,
  collapsed,
  onToggle,
  onApplyBuiltInTemplate,
  onApplyCustomTemplate,
  onDeleteCustomTemplate,
}: {
  customTemplates: CustomSceneTemplate[];
  activeTemplateId: string;
  hasUnsavedCustomTemplateChanges: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onApplyBuiltInTemplate: (templateId: string) => void;
  onApplyCustomTemplate: (template: CustomSceneTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
}) {
  return (
    <SidebarSection
      title="模板"
      caption={`${BUILT_IN_TEMPLATES.length + customTemplates.length} 个`}
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div className="template-library">
        <div className="template-section">
          <div className="template-section-header">
            <span className="template-section-title">内置模板</span>
            <span className="template-section-count">{BUILT_IN_TEMPLATES.length} 个</span>
          </div>
          <div className="template-list">
            {BUILT_IN_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                name={template.name}
                description={template.description}
                badge="内置"
                active={activeTemplateId === template.id}
                onApply={() => onApplyBuiltInTemplate(template.id)}
              />
            ))}
          </div>
        </div>

        {customTemplates.length > 0 && (
          <div className="template-section">
            <div className="template-section-header">
              <span className="template-section-title">自定义模板</span>
              <span className="template-section-count">{customTemplates.length} 个</span>
            </div>
            <div className="template-list">
              {customTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  name={template.name}
                  description={
                    activeTemplateId === template.id && hasUnsavedCustomTemplateChanges
                      ? "有未保存修改"
                      : formatTemplateDate(
                        template.updatedAt ?? template.createdAt,
                        template.updatedAt ? "更新于" : "保存于",
                      )
                  }
                  badge={
                    activeTemplateId === template.id && hasUnsavedCustomTemplateChanges
                      ? "未保存"
                      : "自定义"
                  }
                  active={activeTemplateId === template.id}
                  dirty={activeTemplateId === template.id && hasUnsavedCustomTemplateChanges}
                  onApply={() => onApplyCustomTemplate(template)}
                  onDelete={() => onDeleteCustomTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

export function TemplateSaveForm({
  show,
  activeCustomTemplate,
  customTemplateName,
  onSetName,
  onSave,
  onCancel,
}: {
  show: boolean;
  activeCustomTemplate: CustomSceneTemplate | null;
  customTemplateName: string;
  onSetName: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!show) {
    return null;
  }

  return (
    <section
      className="template-save-panel"
      id="template-save-panel"
      aria-label="保存当前场景为模板"
    >
      <label className="field">
        <span>模板名称</span>
        <input
          type="text"
          placeholder="未命名模板"
          value={customTemplateName}
          onChange={(event) => onSetName(event.currentTarget.value)}
        />
      </label>
      <button
        type="button"
        className="primary-button"
        onClick={onSave}
      >
        确认保存
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
      >
        取消
      </button>
    </section>
  );
}

export function TemplateToolbarButtons({
  showTemplateForm,
  activeCustomTemplate,
  onToggleSaveForm,
  onImport,
}: {
  showTemplateForm: boolean;
  activeCustomTemplate: CustomSceneTemplate | null;
  onToggleSaveForm: () => void;
  onImport: (file: File) => void;
}) {
  return (
    <>
      <button
        type="button"
        className={`secondary-button toolbar-template-button${showTemplateForm ? " active" : ""}`}
        onClick={onToggleSaveForm}
        aria-expanded={showTemplateForm}
        aria-controls="template-save-panel"
      >
        {activeCustomTemplate ? "另存为模板" : "保存为模板"}
      </button>
      <label className="secondary-button file-button">
        导入
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) {
              onImport(file);
            }
          }}
        />
      </label>
    </>
  );
}