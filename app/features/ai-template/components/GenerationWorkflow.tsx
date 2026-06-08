"use client";

import type { GenerationProgress as GenerationProgressType, GenerationStage } from "../hooks/useGenerationProgress";
import { GENERATION_STAGES } from "../hooks/useGenerationProgress";

interface GenerationWorkflowProps {
  progress: GenerationProgressType;
}

export function GenerationWorkflow({ progress }: GenerationWorkflowProps) {
  const getStageStatus = (stageId: GenerationStage): "completed" | "current" | "pending" => {
    if (progress.completedStages.includes(stageId)) {
      return "completed";
    }
    if (progress.currentStage === stageId) {
      return "current";
    }
    return "pending";
  };

  const renderStageIcon = (status: "completed" | "current" | "pending") => {
    if (status === "completed") {
      return (
        <div className="generation-stage-icon completed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    if (status === "current") {
      return (
        <div className="generation-stage-icon current">
          <div className="generation-stage-spinner" />
        </div>
      );
    }
    return (
      <div className="generation-stage-icon pending">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
    );
  };

  if (progress.currentStage === "idle") {
    return null;
  }

  if (progress.currentStage === "failed") {
    return (
      <div className="generation-workflow failed">
        <div className="generation-error">
          <div className="generation-error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="generation-error-content">
            <h3 className="generation-error-title">生成失败</h3>
            <p className="generation-error-message">{progress.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (progress.currentStage === "completed") {
    return (
      <div className="generation-workflow completed">
        {/* 显示四个步骤的完成情况 */}
        <div className="generation-stages">
          {GENERATION_STAGES.map((stage, index) => {
            const status = getStageStatus(stage.id);

            return (
              <div key={stage.id} className={`generation-stage-item ${status}`}>
                <div className="generation-stage-left">
                  {renderStageIcon(status)}
                  {index < GENERATION_STAGES.length - 1 && (
                    <div className={`generation-stage-line ${status === "completed" ? "completed" : ""}`} />
                  )}
                </div>
                <div className="generation-stage-content">
                  <span className="generation-stage-label">{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="generation-success">
          <div className="generation-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="generation-success-content">
            <h3 className="generation-success-title">生成完成</h3>
            <p className="generation-success-time">
              总耗时: {formatTime(progress.elapsedTime)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="generation-workflow">
      <div className="generation-workflow-header">
        <h3 className="generation-workflow-title">
          <div className="generation-workflow-spinner" />
          <span>正在生成...</span>
          <span className="generation-workflow-time">{formatTime(progress.elapsedTime)}</span>
        </h3>
      </div>

      {/* 四个阶段进度 */}
      <div className="generation-stages">
        {GENERATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage.id);

          return (
            <div key={stage.id} className={`generation-stage-item ${status}`}>
              <div className="generation-stage-left">
                {renderStageIcon(status)}
                {index < GENERATION_STAGES.length - 1 && (
                  <div className={`generation-stage-line ${status === "completed" ? "completed" : ""}`} />
                )}
              </div>
              <div className="generation-stage-content">
                <span className="generation-stage-label">{stage.label}</span>
                {status === "current" && (
                  <span className="generation-stage-desc">{stage.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} 分 ${remainingSeconds} 秒`;
}