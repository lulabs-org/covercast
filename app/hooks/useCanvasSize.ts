import { useState, useCallback, useMemo } from "react";

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasSizePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
};

export const DEFAULT_CANVAS_WIDTH = 941;
export const DEFAULT_CANVAS_HEIGHT = 1672;

export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: "default", label: "941 × 1672", width: 941, height: 1672, ratio: "默认" },
  { id: "9:16", label: "1080 × 1920", width: 1080, height: 1920, ratio: "9:16" },
  { id: "3:4", label: "1080 × 1440", width: 1080, height: 1440, ratio: "3:4" },
  { id: "1:1", label: "1080 × 1080", width: 1080, height: 1080, ratio: "1:1" },
  { id: "4:3", label: "1440 × 1080", width: 1440, height: 1080, ratio: "4:3" },
  { id: "16:9", label: "1920 × 1080", width: 1920, height: 1080, ratio: "16:9" },
  { id: "2.35:1", label: "1080 × 460", width: 1080, height: 460, ratio: "2.35:1" },
];

const STORAGE_KEY = "covercast.canvasSize.v1";

function loadSavedCanvasSize(): CanvasSize | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CanvasSize;
      if (
        typeof parsed.width === "number" &&
        typeof parsed.height === "number" &&
        parsed.width > 0 &&
        parsed.height > 0
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

function saveCanvasSize(size: CanvasSize): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
  } catch {
    // Ignore storage errors
  }
}

export type UseCanvasSizeOptions = {
  defaultWidth?: number;
  defaultHeight?: number;
};

export function useCanvasSize(options: UseCanvasSizeOptions = {}) {
  const { defaultWidth = DEFAULT_CANVAS_WIDTH, defaultHeight = DEFAULT_CANVAS_HEIGHT } = options;

  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>(() => {
    const saved = loadSavedCanvasSize();
    if (saved) {
      return saved;
    }
    return { width: defaultWidth, height: defaultHeight };
  });

  const [isCustomSize, setIsCustomSize] = useState(() => {
    const saved = loadSavedCanvasSize();
    if (!saved) {
      return false;
    }
    return !CANVAS_SIZE_PRESETS.some(
      (preset) => preset.width === saved.width && preset.height === saved.height
    );
  });

  const setCanvasSize = useCallback((size: CanvasSize) => {
    setCanvasSizeState(size);
    saveCanvasSize(size);

    const isPreset = CANVAS_SIZE_PRESETS.some(
      (preset) => preset.width === size.width && preset.height === size.height
    );
    setIsCustomSize(!isPreset);
  }, []);

  const setPresetSize = useCallback((preset: CanvasSizePreset) => {
    const size = { width: preset.width, height: preset.height };
    setCanvasSizeState(size);
    saveCanvasSize(size);
    setIsCustomSize(false);
  }, []);

  const setCustomSize = useCallback((width: number, height: number) => {
    const size = { width: Math.max(100, Math.round(width)), height: Math.max(100, Math.round(height)) };
    setCanvasSizeState(size);
    saveCanvasSize(size);
    setIsCustomSize(true);
  }, []);

  const resetToDefault = useCallback(() => {
    const size = { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
    setCanvasSizeState(size);
    saveCanvasSize(size);
    setIsCustomSize(false);
  }, []);

  const currentPreset = useMemo(() => {
    return CANVAS_SIZE_PRESETS.find(
      (preset) => preset.width === canvasSize.width && preset.height === canvasSize.height
    );
  }, [canvasSize]);

  const aspectRatio = useMemo(() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(canvasSize.width, canvasSize.height);
    return `${canvasSize.width / divisor}:${canvasSize.height / divisor}`;
  }, [canvasSize]);

  return {
    canvasSize,
    setCanvasSize,
    setPresetSize,
    setCustomSize,
    resetToDefault,
    isCustomSize,
    currentPreset,
    aspectRatio,
    presets: CANVAS_SIZE_PRESETS,
  };
}