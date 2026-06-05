import { useState, useCallback } from "react";
import type { Scene } from "@/app/lib/scene";
import type { AIGenerateStatus, AITemplateConfig } from "../types";
import { generateWithAI } from "../services/ai-provider";
import { buildAIPrompt } from "../utils/prompt-builder";
import { parseAIResponse, validateScene } from "../utils/response-parser";

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
      templateName?: string
    ) => {
      if (!config.endpoint || !config.apiKey || !config.model) {
        setGenerateStatus({
          isGenerating: false,
          error: "请先完成 AI 配置",
        });
        return;
      }

      if (!userPrompt.trim()) {
        setGenerateStatus({
          isGenerating: false,
          error: "请输入修改要求",
        });
        return;
      }

      setGenerateStatus({
        isGenerating: true,
        error: null,
      });

      try {
        const prompt = buildAIPrompt(userPrompt, currentScene, templateName);
        const response = await generateWithAI(config, prompt);
        const parsed = parseAIResponse(response);

        if (!parsed.success || !parsed.scene) {
          setGenerateStatus({
            isGenerating: false,
            error: parsed.error ?? "解析 AI 响应失败",
          });
          return;
        }

        const validation = validateScene(parsed.scene);
        if (!validation.valid) {
          setGenerateStatus({
            isGenerating: false,
            error: `生成的场景数据有问题: ${validation.errors.join(", ")}`,
          });
          return;
        }

        setGeneratedScene(parsed.scene);
        setGenerateStatus({
          isGenerating: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "生成失败";
        setGenerateStatus({
          isGenerating: false,
          error: errorMessage,
        });
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