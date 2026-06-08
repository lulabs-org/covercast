import { useState, useCallback, useEffect, useRef } from "react";

type MenuPosition = {
  x: number;
  y: number;
};

type UseTemplateCardMenuResult = {
  isOpen: boolean;
  position: MenuPosition;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  openMenu: (event: React.MouseEvent) => void;
  closeMenu: () => void;
};

export function useTemplateCardMenu(): UseTemplateCardMenuResult {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const calculatePosition = useCallback((event: React.MouseEvent): MenuPosition => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 140;
    const menuHeight = 120;

    let x = rect.right - menuWidth;
    let y = rect.bottom + 4;

    if (x < 8) {
      x = 8;
    }
    if (x + menuWidth > window.innerWidth - 8) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight - 8) {
      y = rect.top - menuHeight - 4;
    }

    return { x, y };
  }, []);

  const openMenu = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    const newPosition = calculatePosition(event);
    setPosition(newPosition);
    setIsOpen(true);
  }, [calculatePosition]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return {
    isOpen,
    position,
    triggerRef,
    menuRef,
    openMenu,
    closeMenu,
  };
}