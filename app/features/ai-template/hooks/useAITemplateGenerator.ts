import { useState, useCallback } from "react";
import type { Scene } from "@/app/lib/scene";
import type { AIGenerateStatus, AITemplateConfig } from "../types";
import type { GenerationStage } from "./useGenerationProgress";
import { generateStreamWithAI } from "../services/ai-provider";
import { buildAIPrompt } from "../utils/prompt-builder";
import { parseAIResponse, tryParsePartialStream, validateScene } from "../utils/response-parser";

export function useAITemplateGenerator() {
  const [generateStatus, setGenerateStatus] = useState<AIGenerateStatus>({
    isGenerating: false,
    error: null,
  });
  const [generatedScene, setGeneratedScene] = useState<Scene | null>(null);

  const generateTemplate = useCallback(
    async (
      config: AITemplateConfig,
      userPrompt: string,
      currentScene: Scene,
      templateName?: string,
      callbacks?: {
        onStageChange?: (stage: GenerationStage) => void;
      }
    ): Promise<Scene> => {
      const { onStageChange } = callbacks || {};

      if (!config.endpoint || !config.apiKey || !config.model) {
        throw new Error("请先完成 AI 配置");
      }

      if (!userPrompt.trim()) {
        throw new Error("请输入修改要求");
      }

      setGenerateStatus({
        isGenerating: true,
        error: null,
      });

      try {
        // Build prompt
        const prompt = buildAIPrompt(userPrompt, currentScene, templateName);

        // 流式内容累积，用于提前解析
        let streamContent = "";
        let earlyScene: Scene | null = null;
        let hasDetectedJsonStart = false;

        // 网络请求完成，开始 AI 处理
        onStageChange?.("ai-processing");

        // Call AI API with streaming + early parse
        const response = await generateStreamWithAI(config, prompt, (chunk) => {
          streamContent += chunk;

          // 检测开始接收 JSON 内容
          if (!hasDetectedJsonStart && streamContent.includes("```json")) {
            hasDetectedJsonStart = true;
            onStageChange?.("stream-receiving");
          }

          // 流式提前解析：检测到完整 JSON 就提前提取
          if (!earlyScene) {
            const scene = tryParsePartialStream(streamContent);
            if (scene) {
              earlyScene = scene;
            }
          }
        });

        // 解析验证阶段
        onStageChange?.("parsing-rendering");

        // 优先使用提前解析的结果，否则用完整响应解析
        let scene: Scene;
        if (earlyScene) {
          scene = earlyScene;
        } else {
          const parsed = parseAIResponse(response);
          if (!parsed.success || !parsed.scene) {
            throw new Error(parsed.error ?? "解析 AI 响应失败");
          }
          scene = parsed.scene;
        }

        const validation = validateScene(scene);
        if (!validation.valid) {
          throw new Error(`生成的场景数据有问题: ${validation.errors.join(", ")}`);
        }

        setGeneratedScene(scene);
        setGenerateStatus({
          isGenerating: false,
          error: null,
        });

        return scene;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "生成失败";
        setGenerateStatus({
          isGenerating: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    []
  );

  const applyGeneratedScene = useCallback(() => {
    if (!generatedScene) {
      return null;
    }

    const sceneToApply = generatedScene;
    setGeneratedScene(null);
    setGenerateStatus({
      isGenerating: false,
      error: null,
    });

    return sceneToApply;
  }, [generatedScene]);

  const resetGeneratedScene = useCallback(() => {
    setGeneratedScene(null);
    setGenerateStatus({
      isGenerating: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setGenerateStatus((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    generateStatus,
    generatedScene,
    generateTemplate,
    applyGeneratedScene,
    resetGeneratedScene,
    clearError,
  };
}