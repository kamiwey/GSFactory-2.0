// src/hooks/useLenis.js
import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Perfil "buttery":
 * - duration + easing en lugar de lerp → movimiento continuo (sin micro-parones por tick de rueda)
 * - normalizeWheel ON → normaliza pasos "duros" de ruedas baratas
 * - smoothWheel ON → integra impulsos en una curva fluida
 * - touch queda nativo (por defecto) para no pelear con iOS
 *
 * Tuning rápido:
 *  - duration: 0.9–1.3 (↑ = más suave y prolongado)
 *  - easing: usa linear para velocidad constante o ease-out para cola elegante
 *  - wheelMultiplier: 0.9–1.1 (↑ = más recorrido por tick)
 */
export default function useLenis({
  // PERFIL SUAVE POR DEFECTO (mejor que lerp para “matar” el click de rueda)
  duration = 1.1, // segundos por impulso (0.9–1.3 recomendado)
  easing = (t) => 1 - Math.pow(1 - t, 2.2), // easeOut "tenso", casi lineal al inicio
  wheelMultiplier = 0.5, // ganancia de rueda (ajusta a gusto)
  // Touch
  enableOnTouch = false, // mantenemos nativo en móvil/tablet
  smoothTouch = false,
  touchMultiplier = 1,
  // Extras
  autoPauseOnBlur = true, // pausa RAF si la pestaña pierde foco
} = {}) {
  const rafId = useRef(0);
  const lenisRef = useRef(null);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) return;

    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;
    if (hasTouch && !enableOnTouch) return;

    // Config: usamos duration/easing (no lerp)
    const lenis = new Lenis({
      duration,
      easing, // <- curva continua que “plancha” los dientes del wheel
      smoothWheel: true,
      normalizeWheel: true, // <- iguala deltas entre hardware distintos
      wheelMultiplier,
      smoothTouch,
      touchMultiplier,
      // autoRaf: false  (mantenemos raf manual para control fino)
    });
    lenisRef.current = lenis;

    // Flag de "estamos scrolleando" para CSS barato durante el movimiento
    let t;
    const onScroll = () => {
      document.body.classList.add("is-scrolling");
      clearTimeout(t);
      t = setTimeout(() => document.body.classList.remove("is-scrolling"), 80);
    };
    lenis.on("scroll", onScroll);

    // RAF manual
    const raf = (time) => {
      lenis.raf(time);
      rafId.current = requestAnimationFrame(raf);
    };
    rafId.current = requestAnimationFrame(raf);

    // Pausa/continúa RAF al perder/recuperar foco (evita saltos y consumo)
    const onVisibility = () => {
      if (!autoPauseOnBlur) return;
      if (document.hidden) {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = 0;
        }
      } else {
        if (!rafId.current) rafId.current = requestAnimationFrame(raf);
      }
    };
    if (autoPauseOnBlur) {
      document.addEventListener("visibilitychange", onVisibility);
    }

    // Limpieza
    return () => {
      lenis.off("scroll", onScroll);
      lenis.destroy();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (autoPauseOnBlur) {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      lenisRef.current = null;
    };
  }, [
    duration,
    easing,
    wheelMultiplier,
    enableOnTouch,
    smoothTouch,
    touchMultiplier,
    autoPauseOnBlur,
  ]);
}
