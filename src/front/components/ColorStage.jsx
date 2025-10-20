import React, { useEffect, useRef } from "react";
import { PALETTE_HOME } from "../theme/paletteHome";

/**
 * ColorStage
 * - Negro bajo el vídeo hasta que el hero sale por arriba.
 * - Fundido negro→azul hasta que entra el pin del horizontal.
 * - Con pin activo: transiciones por panel alineadas a centro + plateau.
 * - NUEVO: al terminar el horizontal, micro-fade del color del panel 6 → negro
 *          en un pequeño tramo (SMOOTH_PX), luego negro fijo (paneles 7 y 8).
 */
export default function ColorStage({
  colors = null, // [{top,bottom}, ...] opcional
  palette = (Array.isArray(PALETTE_HOME)
    ? PALETTE_HOME.map((c) => c.top ?? c.bottom)
    : ["#000000", "#4586d7ff", "#41a152ff", "#4d44b6ff", "#b28c48ff", "#a39d1fff", "#A3A31E"]),
  hold0 = 0.0,
  children,
}) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    const bg = bgRef.current;
    if (!el || !bg) return;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const hexToRgb = (hex) => {
      const m = hex.replace("#", "");
      const r = parseInt(m.slice(0, 2), 16);
      const g = parseInt(m.slice(2, 4), 16);
      const b = parseInt(m.slice(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = ({ r, g, b }) =>
      "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

    const mix = (a, b, t) => {
      const A = hexToRgb(a);
      const B = hexToRgb(b);
      return rgbToHex({
        r: A.r + (B.r - A.r) * t,
        g: A.g + (B.g - A.g) * t,
        b: A.b + (B.b - A.b) * t,
      });
    };

    const shade = (hex, f) => {
      const { r, g, b } = hexToRgb(hex);
      return rgbToHex({ r: r * f, g: g * f, b: b * f });
    };

    const luminance = (hex) => {
      const { r, g, b } = hexToRgb(hex);
      const norm = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
    };

    const HOLD = 0.14; // plateau alrededor del centro del panel
    const plateau = (t) => {
      if (HOLD <= 0) return t;
      const lo = HOLD, hi = 1 - HOLD;
      if (t <= lo) return 0;
      if (t >= hi) return 1;
      return (t - lo) / (hi - lo);
    };

    const onScroll = () => {
      const hwrap = el.querySelector?.(".hstrip");
      const hsticky = hwrap?.querySelector?.(".hstrip__sticky");
      const htrack = hwrap?.querySelector?.(".hstrip__track");
      const hero = document.querySelector?.(".hero");

      // Color base del primer panel (azul)
      const firstTop = (() => {
        if (Array.isArray(colors) && colors.length) {
          const c = colors[0] || {};
          return c.top ?? c.bottom ?? "#4586d7";
        }
        const eff = Array.isArray(palette) && palette.length ? palette : ["#000000", "#4586d7"];
        return (eff[0] && luminance(eff[0]) < 0.02) ? (eff[1] || "#4586d7") : (eff[0] || "#4586d7");
      })();
      const firstBot = (() => {
        if (Array.isArray(colors) && colors.length) {
          const c = colors[0] || {};
          return c.bottom ?? c.top ?? shade(firstTop, 0.78);
        }
        return shade(firstTop, 0.78);
      })();

      if (hwrap && hsticky && htrack && (hwrap.dataset.mode !== "vertical")) {
        const topPx = parseFloat(getComputedStyle(hsticky).top || "0") || 0; // altura navbar (offset sticky)
        const top = hwrap.getBoundingClientRect().top;
        const beforePin = top > topPx;

        const totalX = Math.max(0, htrack.scrollWidth - hsticky.clientWidth);
        const panelW = Math.max(1, hsticky.clientWidth);

        // 1) Antes del pin: negro hasta que el hero desaparezca; luego fundido negro→azul
        if (beforePin) {
          const heroBottom = hero?.getBoundingClientRect?.().bottom ?? Infinity;
          const heroOut = heroBottom <= topPx + 0.5;
          if (!heroOut) {
            bg.style.setProperty("--bgStart", "#000000");
            bg.style.setProperty("--bgEnd", "#000000");
            bg.classList.add("no-glow");
            return;
          }
          const d1 = Math.max(0, topPx - heroBottom);
          const d2 = Math.max(0, top - topPx);
          const s = (d1 + d2) > 0 ? d1 / (d1 + d2) : 1; // 0 en heroOut, 1 en pin
          const t2 = plateau(clamp(s, 0, 1));
          const eased = t2 * t2 * (3 - 2 * t2);

          const topHex = mix("#000000", firstTop, eased);
          const bottomHex = mix("#000000", firstBot, eased);
          bg.style.setProperty("--bgStart", topHex);
          bg.style.setProperty("--bgEnd", bottomHex);
          bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
          return;
        }

        // 2) Con pin activo o después del pin
        const y = (topPx - top); // "avance" vertical equivalente al desplazamiento horizontal
        const over = y - totalX;  // >0 cuando YA hemos terminado el horizontal

        // Construimos stops de color para los paneles 1..N (sin negro)
        let stopsTop = [];
        let stopsBot = [];
        if (Array.isArray(colors) && colors.length) {
          stopsTop = colors.map((c) => c.top ?? c.bottom ?? firstTop);
          stopsBot = colors.map((c) => c.bottom ?? c.top ?? firstBot);
        } else {
          const eff = Array.isArray(palette) && palette.length ? palette : ["#000000", firstTop];
          const base = (eff[0] && luminance(eff[0]) < 0.02) ? eff.slice(1) : eff.slice();
          stopsTop = base.slice();
          stopsBot = base.map((hex) => shade(hex, 0.78));
        }

        // 2.a) AÚN dentro del horizontal (over <= 0): color por panel
        if (over <= 0.5) {
          const u = y / panelW; // 0 en centro del panel 1
          const totalSeg = Math.max(1, stopsTop.length - 1);
          const seg = Math.max(0, Math.min(totalSeg - 1, Math.floor(u)));
          const localT = clamp(u - seg, 0, 1);
          const t2 = plateau(localT);
          const eased = t2 * t2 * (3 - 2 * t2);

          const fromTop = stopsTop[seg];
          const toTop = stopsTop[seg + 1] ?? stopsTop[seg];
          const fromBot = stopsBot[seg];
          const toBot = stopsBot[seg + 1] ?? stopsBot[seg];

          const topHex = mix(fromTop, toTop, eased);
          const bottomHex = mix(fromBot, toBot, eased);
          bg.style.setProperty("--bgStart", topHex);
          bg.style.setProperty("--bgEnd", bottomHex);
          bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
          return;
        }

        // 2.b) NUEVO: fin del horizontal → micro-fade colorFinal → negro
        // ventana de suavizado proporcional al viewport para que se sienta igual en 1080p/4K
        const SMOOTH_PX = Math.max(160, Math.min(320, window.innerHeight * 0.18));
        const lastTop = stopsTop[stopsTop.length - 1];
        const lastBot = stopsBot[stopsBot.length - 1];

        const s = clamp(over / SMOOTH_PX, 0, 1);
        const ease = s * s * (3 - 2 * s); // ease-in-out
        const topHex = mix(lastTop, "#000000", ease);
        const bottomHex = mix(lastBot, "#000000", ease);

        bg.style.setProperty("--bgStart", topHex);
        bg.style.setProperty("--bgEnd", bottomHex);
        bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
        return;
      }

      // 3) Modo vertical (mobile/apilado): reproducimos la misma lógica de color por panel
      if (hwrap) {
        const navVar = getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '72px';
        const topPx = parseFloat(navVar) || 72;
        const top = hwrap.getBoundingClientRect().top;
        const beforePin = top > topPx;

        // Color base del primer panel (azul) y su sombra
        const firstTopV = firstTop;
        const firstBotV = firstBot;

        if (beforePin) {
          const heroBottom = hero?.getBoundingClientRect?.().bottom ?? Infinity;
          const heroOut = heroBottom <= topPx + 0.5;
          if (!heroOut) {
            bg.style.setProperty("--bgStart", "#000000");
            bg.style.setProperty("--bgEnd", "#000000");
            bg.classList.add("no-glow");
            return;
          }
          const d1 = Math.max(0, topPx - heroBottom);
          const d2 = Math.max(0, top - topPx);
          const s = (d1 + d2) > 0 ? d1 / (d1 + d2) : 1;
          const t2 = plateau(clamp(s, 0, 1));
          const eased = t2 * t2 * (3 - 2 * t2);
          const topHex = mix("#000000", firstTopV, eased);
          const bottomHex = mix("#000000", firstBotV, eased);
          bg.style.setProperty("--bgStart", topHex);
          bg.style.setProperty("--bgEnd", bottomHex);
          bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
          return;
        }

        const panelH = Math.max(1, window.innerHeight - topPx);

        // stops (sin negro)
        let stopsTop = [];
        let stopsBot = [];
        if (Array.isArray(colors) && colors.length) {
          stopsTop = colors.map((c) => c.top ?? c.bottom ?? firstTopV);
          stopsBot = colors.map((c) => c.bottom ?? c.top ?? firstBotV);
        } else {
          const eff = Array.isArray(palette) && palette.length ? palette : ["#000000", firstTopV];
          const base = (eff[0] && luminance(eff[0]) < 0.02) ? eff.slice(1) : eff.slice();
          stopsTop = base.slice();
          stopsBot = base.map((hex) => shade(hex, 0.78));
        }

        const y = (topPx - top);
        const totalY = Math.max(0, panelH * Math.max(0, stopsTop.length - 1));
        const over = y - totalY;

        if (over <= 0.5) {
          const u = y / Math.max(1, panelH);
          const totalSeg = Math.max(1, stopsTop.length - 1);
          const seg = Math.max(0, Math.min(totalSeg - 1, Math.floor(u)));
          const localT = clamp(u - seg, 0, 1);
          const t2 = plateau(localT);
          const eased = t2 * t2 * (3 - 2 * t2);

          const fromTop = stopsTop[seg];
          const toTop = stopsTop[seg + 1] ?? stopsTop[seg];
          const fromBot = stopsBot[seg];
          const toBot = stopsBot[seg + 1] ?? stopsBot[seg];

          const topHex = mix(fromTop, toTop, eased);
          const bottomHex = mix(fromBot, toBot, eased);
          bg.style.setProperty("--bgStart", topHex);
          bg.style.setProperty("--bgEnd", bottomHex);
          bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
          return;
        }

        // micro-fade final a negro al terminar los paneles
        const SMOOTH_PX = Math.max(160, Math.min(320, window.innerHeight * 0.18));
        const lastTop = stopsTop[stopsTop.length - 1];
        const lastBot = stopsBot[stopsBot.length - 1];
        const s = clamp(over / SMOOTH_PX, 0, 1);
        const ease = s * s * (3 - 2 * s);
        const topHex = mix(lastTop, "#000000", ease);
        const bottomHex = mix(lastBot, "#000000", ease);
        bg.style.setProperty("--bgStart", topHex);
        bg.style.setProperty("--bgEnd", bottomHex);
        bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
        return;
      }

      // Fallback extremo: negro
      bg.style.setProperty("--bgStart", "#000000");
      bg.style.setProperty("--bgEnd", "#000000");
      bg.classList.add("no-glow");
    };

    const onResize = () => onScroll();

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [colors, palette, hold0]);

  return (
    <section className="colorStage" ref={sectionRef}>
      <div className="colorStage__bg" ref={bgRef} />
      <div className="colorStage__content">{children}</div>
    </section>
  );
}
