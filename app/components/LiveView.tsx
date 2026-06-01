"use client";

import { useEffect, useState } from "react";
import type { Scene } from "../lib/scene";
import SceneCanvas from "./SceneCanvas";

type LiveViewProps = {
  templateId?: string;
  slotId?: string;
};

type ErrorInfo = {
  message: string;
};

export default function LiveView({ templateId, slotId }: LiveViewProps) {
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadScene() {
      try {
        const url = templateId && slotId
          ? `/api/scene?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}`
          : `/api/scene`;

        const response = await fetch(url, {
          cache: "no-store",
        });
        
        if (!active) return;
        
        if (!response.ok) {
          if (response.status === 404) {
            const errorData = (await response.json()) as { message?: string };
            setError({ message: errorData.message || "OBS 源不存在" });
            setLoading(false);
          }
          return;
        }

        const nextScene = (await response.json()) as Scene;
        if (active) {
          setScene(nextScene);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (active) {
          setError({ message: "加载场景失败" });
          setLoading(false);
        }
      }
    }

    void loadScene();

    return () => {
      active = false;
    };
  }, [templateId, slotId]);

  if (loading && !scene && !error) {
    return (
      <>
        <style>{`html, body { background: transparent !important; }`}</style>
        <main className="live-shell">
          <div className="live-loading">
            <p>加载中...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`html, body { background: transparent !important; }`}</style>
        <main className="live-shell">
          <div className="live-error">
            <h1>404</h1>
            <p>{error.message}</p>
            <p className="hint">请检查 OBS 源 URL 是否正确，或在编辑器中创建对应的浏览器源</p>
          </div>
        </main>
      </>
    );
  }

  if (!scene) {
    return null;
  }

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <main className="live-shell">
        <SceneCanvas scene={scene} className="live-canvas" idPrefix="live" />
      </main>
    </>
  );
}