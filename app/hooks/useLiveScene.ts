"use client";

import { useEffect, useState } from "react";
import { createDefaultScene, type Scene } from "../lib/scene";

type LiveSceneState = {
  scene: Scene | null;
  error: { title: string; message: string } | null;
  isLoading: boolean;
};

export function useLiveScene(templateId?: string, slotId?: string): LiveSceneState {
  const [state, setState] = useState<LiveSceneState>({
    scene: createDefaultScene(),
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;

    async function refreshScene() {
      try {
        const url = templateId && slotId
          ? `/api/scene?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}&ts=${Date.now()}`
          : `/api/scene?ts=${Date.now()}`;

        const response = await fetch(url, {
          cache: "no-store",
        });

        if (!active) return;

        if (response.status === 404) {
          const errorData = await response.json();
          setState({
            scene: null,
            error: {
              title: "场景不存在",
              message: errorData.message || "指定的 OBS 源未找到",
            },
            isLoading: false,
          });
          return;
        }

        if (!response.ok) {
          setState({
            scene: null,
            error: {
              title: "加载失败",
              message: `服务器错误 (${response.status})`,
            },
            isLoading: false,
          });
          return;
        }

        const nextScene = (await response.json()) as Scene;
        setState({
          scene: nextScene,
          error: null,
          isLoading: false,
        });
      } catch {
        if (!active) return;
        // OBS should keep rendering the last known scene if a refresh fails.
        // Only set error on initial load failure
        if (state.isLoading) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      }
    }

    void refreshScene();
    const interval = window.setInterval(refreshScene, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [templateId, slotId, state.isLoading]);

  return state;
}