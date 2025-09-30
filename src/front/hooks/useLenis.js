// src/hooks/useLenis.js
import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function useLenis({
  lerp = 0.16, // antes 0.12 → más “tenso”, menos cola
  wheelMultiplier = 1.1, // un pelín más de ganancia
  touchMultiplier = 1,
  smoothTouch = false,
  enableOnTouch = false,
} = {}) {
  const rafId = useRef(0);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) return;

    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;
    if (hasTouch && !enableOnTouch) return;

    const lenis = new Lenis({
      lerp,
      wheelMultiplier,
      smoothWheel: true,
      smoothTouch,
      touchMultiplier,
      normalizeWheel: true,
    });

    let t;
    const onScroll = () => {
      document.body.classList.add("is-scrolling");
      clearTimeout(t);
      t = setTimeout(() => document.body.classList.remove("is-scrolling"), 80);
    };
    lenis.on("scroll", onScroll);

    const raf = (time) => {
      lenis.raf(time);
      rafId.current = requestAnimationFrame(raf);
    };
    rafId.current = requestAnimationFrame(raf);

    return () => {
      lenis.off("scroll", onScroll);
      lenis.destroy();
      cancelAnimationFrame(rafId.current);
    };
  }, [lerp, wheelMultiplier, touchMultiplier, smoothTouch, enableOnTouch]);
}
