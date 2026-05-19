"use client";

import { useEffect, useState } from "react";
import { createDefaultScene, type Scene } from "../lib/scene";
import SceneCanvas from "./SceneCanvas";

export default function LiveView() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());

  useEffect(() => {
    let active = true;

    async function refreshScene() {
      try {
        const response = await fetch(`/api/scene?ts=${Date.now()}`, {
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
  }, []);

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <main className="live-shell">
        <SceneCanvas scene={scene} className="live-canvas" idPrefix="live" />
      </main>
    </>
  );
}
