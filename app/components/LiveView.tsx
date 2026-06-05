"use client";

import SceneCanvas from "./SceneCanvas";
import LiveViewError from "./LiveViewError";
import { useLiveScene } from "../hooks/useLiveScene";

type LiveViewProps = {
  templateId?: string;
  slotId?: string;
};

export default function LiveView({ templateId, slotId }: LiveViewProps) {
  const { scene, error, isLoading } = useLiveScene(templateId, slotId);

  if (error) {
    return <LiveViewError title={error.title} message={error.message} />;
  }

  if (isLoading || !scene) {
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
