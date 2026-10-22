"use client";

import { useEffect, useRef } from "react";

/** Pauses package-owned animation descendants while their region is offscreen or the page is hidden. */
export function useMotionVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let intersectsViewport = true;
    const updatePausedState = () => {
      const paused = document.hidden || !intersectsViewport;
      if (paused === (element.getAttribute("data-eol-motion-paused") === "true")) return;
      if (paused) element.setAttribute("data-eol-motion-paused", "true");
      else element.removeAttribute("data-eol-motion-paused");
    };

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
        intersectsViewport = entry?.isIntersecting ?? false;
        updatePausedState();
      }, { rootMargin: "120px 0px" });

    observer?.observe(element);
    document.addEventListener("visibilitychange", updatePausedState);
    updatePausedState();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updatePausedState);
      element.removeAttribute("data-eol-motion-paused");
    };
  }, []);

  return ref;
}
