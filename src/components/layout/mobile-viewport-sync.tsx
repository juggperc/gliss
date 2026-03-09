"use client";

import { useEffect } from "react";

function isFocusableInput(target: EventTarget | null) {
  return target instanceof HTMLElement
    && (target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target.isContentEditable);
}

export function MobileViewportSync() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;

    const updateViewport = () => {
      const visualViewport = window.visualViewport;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportOffsetTop = visualViewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, window.innerHeight - viewportHeight - viewportOffsetTop);

      root.style.setProperty("--visual-viewport-height", `${viewportHeight}px`);
      root.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (isFocusableInput(event.target)) {
        root.dataset.inputFocus = "true";
        window.setTimeout(updateViewport, 80);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (!isFocusableInput(document.activeElement)) {
          delete root.dataset.inputFocus;
        }
        updateViewport();
      }, 80);
    };

    updateViewport();

    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      delete root.dataset.inputFocus;
      root.style.removeProperty("--visual-viewport-height");
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return null;
}
