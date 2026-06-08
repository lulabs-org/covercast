import { useState, useCallback, useRef, useEffect } from "react";

export type GenerationStage =
  | "idle"
  | "network-request"
  | "ai-processing"
  | "stream-receiving"
  | "parsing-rendering"
  | "completed"
  | "failed";

export interface StageInfo {
  id: GenerationStage;
  label: string;
  description: string;
}

export const GENERATION_STAGES: StageInfo[] = [
  {
    id: "network-request",
    label: "网络请求",
    description: "正在建立连接...",
  },
  {
    id: "ai-processing",
    label: "AI 模型处理",
    description: "正在生成设计方案...",
  },
  {
    id: "stream-receiving",
    label: "流式接收 JSON",
    description: "正在接收生成结果...",
  },
  {
    id: "parsing-rendering",
    label: "解析验证和渲染",
    description: "正在解析并渲染预览...",
  },
];

export interface GenerationProgress {
  currentStage: GenerationStage;
  completedStages: GenerationStage[];
  elapsedTime: number;
  error: string | null;
}

export function useGenerationProgress() {
  const [progress, setProgress] = useState<GenerationProgress>({
    currentStage: "idle",
    completedStages: [],
    elapsedTime: 0,
    error: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProgress((prev) => ({
        ...prev,
        elapsedTime: elapsed,
      }));
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateStage = useCallback((stage: GenerationStage) => {
    setProgress((prev) => {
      // 将当前阶段标记为完成（如果当前阶段不是 idle 且不是新阶段）
      const newCompletedStages = prev.currentStage !== "idle" && 
                                 prev.currentStage !== stage &&
                                 !prev.completedStages.includes(prev.currentStage)
        ? [...prev.completedStages, prev.currentStage]
        : prev.completedStages;

      return {
        ...prev,
        currentStage: stage,
        completedStages: newCompletedStages,
      };
    });
  }, []);

  const setError = useCallback((error: string) => {
    stopTimer();
    setProgress((prev) => ({
      ...prev,
      currentStage: "failed",
      error,
    }));
  }, [stopTimer]);

  const start = useCallback(() => {
    setProgress({
      currentStage: "network-request",
      completedStages: [],
      elapsedTime: 0,
      error: null,
    });
    startTimer();
  }, [startTimer]);

  const complete = useCallback(() => {
    stopTimer();
    setProgress((prev) => ({
      ...prev,
      currentStage: "completed",
      completedStages: [...GENERATION_STAGES.map(s => s.id)],
    }));
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setProgress({
      currentStage: "idle",
      completedStages: [],
      elapsedTime: 0,
      error: null,
    });
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return {
    progress,
    updateStage,
    setError,
    start,
    complete,
    reset,
  };
}