import { useState, useCallback, useEffect, useRef } from "react";

const LEFT_PANEL_MIN_WIDTH = 200;
const LEFT_PANEL_MAX_WIDTH = 400;
const LEFT_PANEL_DEFAULT_WIDTH = 280;

const RIGHT_PANEL_MIN_WIDTH = 220;
const RIGHT_PANEL_MAX_WIDTH = 450;
const RIGHT_PANEL_DEFAULT_WIDTH = 300;

const STORAGE_KEY = "covercast.panelWidths.v1";

type PanelWidths = {
  leftPanel: number;
  rightPanel: number;
};

const DEFAULT_PANEL_WIDTHS: PanelWidths = {
  leftPanel: LEFT_PANEL_DEFAULT_WIDTH,
  rightPanel: RIGHT_PANEL_DEFAULT_WIDTH,
};

function loadPanelWidths(): PanelWidths | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        leftPanel: Math.max(LEFT_PANEL_MIN_WIDTH, Math.min(LEFT_PANEL_MAX_WIDTH, parsed.leftPanel ?? LEFT_PANEL_DEFAULT_WIDTH)),
        rightPanel: Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(RIGHT_PANEL_MAX_WIDTH, parsed.rightPanel ?? RIGHT_PANEL_DEFAULT_WIDTH)),
      };
    }
  } catch {
  }
  return null;
}

function savePanelWidths(widths: PanelWidths): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
  }
}

type ResizeState = {
  panel: "left" | "right";
  startX: number;
  startWidth: number;
};

export function usePanelResize() {
  const [panelWidths, setPanelWidths] = useState<PanelWidths>(DEFAULT_PANEL_WIDTHS);
  const [isDragging, setIsDragging] = useState(false);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const resizerLeftRef = useRef<HTMLDivElement>(null);
  const resizerRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedWidths = loadPanelWidths();
    if (storedWidths) {
      setPanelWidths(storedWidths);
    }
  }, []);

  const handleMouseDown = useCallback((panel: "left" | "right", event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    
    const startWidth = panel === "left" ? panelWidths.leftPanel : panelWidths.rightPanel;
    resizeStateRef.current = {
      panel,
      startX: event.clientX,
      startWidth,
    };

    const resizerRef = panel === "left" ? resizerLeftRef : resizerRightRef;
    if (resizerRef.current) {
      resizerRef.current.classList.add("dragging");
    }
  }, [panelWidths]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!resizeStateRef.current) return;

    const { panel, startX, startWidth } = resizeStateRef.current;
    const delta = event.clientX - startX;
    
    if (panel === "left") {
      const newWidth = Math.max(LEFT_PANEL_MIN_WIDTH, Math.min(LEFT_PANEL_MAX_WIDTH, startWidth + delta));
      setPanelWidths(prev => ({ ...prev, leftPanel: newWidth }));
    } else {
      const newWidth = Math.max(RIGHT_PANEL_MIN_WIDTH, Math.min(RIGHT_PANEL_MAX_WIDTH, startWidth - delta));
      setPanelWidths(prev => ({ ...prev, rightPanel: newWidth }));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (resizeStateRef.current) {
      const panel = resizeStateRef.current.panel;
      const resizerRef = panel === "left" ? resizerLeftRef : resizerRightRef;
      if (resizerRef.current) {
        resizerRef.current.classList.remove("dragging");
      }
    }
    
    resizeStateRef.current = null;
    setIsDragging(false);
    
    savePanelWidths(panelWidths);
  }, [panelWidths]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    panelWidths,
    resizerLeftRef,
    resizerRightRef,
    handleMouseDown,
    isDragging,
  };
}