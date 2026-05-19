"use client";

import { useEffect, useState } from "react";
import { createDefaultScene, type Scene } from "../lib/scene";
import SceneCanvas from "./SceneCanvas";

type LiveViewProps = {
  templateId?: string;
  slotId?: string;
};

export default function LiveView({ templateId, slotId }: LiveViewProps) {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());

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
        if (!response.ok) {
          return;
        }

        const nextScene = (await response.json()) as Scene;
        if (active) {
          setScene(nextScene);
        }
      } catch {
        // OBS should keep rendering the last known scene if a refresh fails.
      }
    }

    void refreshScene();
    const interval = window.setInterval(refreshScene, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [templateId, slotId]);

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <main className="live-shell">
        <SceneCanvas scene={scene} className="live-canvas" idPrefix="live" />
      </main>
    </>
  );
}
