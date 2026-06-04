"use client";

import { type PointerEvent as ReactPointerEvent, useRef, useState, useEffect } from "react";
import {
  clearMarquee,
  createMarqueeState,
  getMarqueeRect,
  hasMarqueeSize,
  hitTestElements,
  isMarqueeActive,
  startMarquee,
  updateMarquee,
  type HitTestStrategy,
  type MarqueeState,
} from "../lib/marquee";
import {
  clearSelection,
  selectMultiple,
  type SelectionState,
} from "../lib/selection";
import { type SceneElement } from "../lib/scene";

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();

  if (!matrix) {
    return { x: 0, y: 0 };
  }

  const nextPoint = point.matrixTransform(matrix.inverse());
  return { x: nextPoint.x, y: nextPoint.y };
}

export function useMarqueeSelection({
  svgRef,
  sceneElementsRef,
  hitTestStrategy,
  editingTextId,
  setSelection,
  setEditingTextId,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  sceneElementsRef: React.MutableRefObject<SceneElement[]>;
  hitTestStrategy: HitTestStrategy;
  editingTextId: string | null;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [marquee, setMarquee] = useState<MarqueeState>(() => createMarqueeState());
  const marqueeRafRef = useRef<number>(0);
  const latestMarqueeRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isMarqueeActive(marquee)) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY);
      latestMarqueeRef.current = { x: point.x, y: point.y };

      if (marqueeRafRef.current === 0) {
        marqueeRafRef.current = requestAnimationFrame(processMarqueeFrame);
      }
    }

    function processMarqueeFrame() {
      marqueeRafRef.current = 0;

      const latest = latestMarqueeRef.current;
      if (!latest) {
        return;
      }

      setMarquee((prev) => updateMarquee(prev, latest.x, latest.y));
    }

    function handlePointerUp(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        setMarquee((prev) => clearMarquee(prev));
        return;
      }

      const isShiftPressed = event.shiftKey;

      setMarquee((prevMarquee) => {
        if (hasMarqueeSize(prevMarquee, 5)) {
          const rect = getMarqueeRect(prevMarquee);
          const hitIds = hitTestElements(rect, sceneElementsRef.current, hitTestStrategy);

          if (hitIds.length > 0) {
            setSelection((prevSelection) => selectMultiple(prevSelection, hitIds, isShiftPressed));
          } else if (!isShiftPressed) {
            setSelection((prevSelection) => clearSelection(prevSelection));
          }
        }

        return clearMarquee(prevMarquee);
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      if (marqueeRafRef.current !== 0) {
        cancelAnimationFrame(marqueeRafRef.current);
        marqueeRafRef.current = 0;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [marquee, hitTestStrategy, svgRef, sceneElementsRef, setSelection]);

  const handleCanvasPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    const isShiftPressed = event.shiftKey;

    if (!isShiftPressed) {
      setSelection((prev) => clearSelection(prev));
    }

    if (editingTextId) {
      setEditingTextId(null);
    }

    setMarquee((prev) => startMarquee(prev, point.x, point.y));
  };

  return {
    marquee,
    setMarquee,
    handleCanvasPointerDown,
  };
}