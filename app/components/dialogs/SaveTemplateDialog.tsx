"use client";

import { useEffect, useRef } from "react";

export function SaveTemplateDialog({
  show,
  title,
  templateName,
  nameError,
  onSetName,
  onSave,
  onCancel,
  backdropClassName,
}: {
  show: boolean;
  title: string;
  templateName: string;
  nameError: string | undefined;
  onSetName: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  backdropClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onCancel();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [show, onCancel]);

  if (!show) {
    return null;
  }

  const handleSave = () => {
    if (nameError) {
      return;
    }
    onSave();
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className={`dialog-backdrop${backdropClassName ? ` ${backdropClassName}` : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-dialog-title"
    >
      <div className="dialog-content">
        <h3 id="save-template-dialog-title" className="dialog-title">
          {title}
        </h3>
        <label className={`field${nameError ? " field-error" : ""}`}>
          <span>模板名称</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="未命名模板"
            value={templateName}
            onChange={(event) => onSetName(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          {nameError ? <span className="field-error-message">{nameError}</span> : null}
        </label>
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={!!nameError}
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  );
}