import { useEffect, useRef, useCallback } from "react";

const SCROLL_HIDE_DELAY = 800;

export function useScrollVisibility() {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleScroll = useCallback((element: HTMLElement) => {
    element.classList.add("scrolling");
    
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      element.classList.remove("scrolling");
      scrollTimeoutRef.current = null;
    }, SCROLL_HIDE_DELAY);
  }, []);

  useEffect(() => {
    const elements = [
      leftPanelRef.current,
      rightPanelRef.current,
      stageViewportRef.current,
    ];

    const listeners: Array<{ element: HTMLElement; listener: () => void }> = [];

    elements.forEach((element) => {
      if (element) {
        const listener = () => handleScroll(element);
        element.addEventListener("scroll", listener);
        listeners.push({ element, listener });
      }
    });

    return () => {
      listeners.forEach(({ element, listener }) => {
        element.removeEventListener("scroll", listener);
      });
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  return {
    leftPanelRef,
    rightPanelRef,
    stageViewportRef,
  };
}