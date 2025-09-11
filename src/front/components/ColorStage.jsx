import React, { useEffect, useRef } from "react";

/**
 * ColorStage
 * - Fondo con degradado controlado por scroll.
 * - Sincroniza cambios de color con los centros de paneles del HorizontalStrip.
 * - El tramo negro→azul ocupa la MISMA distancia que los cambios siguientes.
 */
export default function ColorStage({
  // Si se pasa, usar [{top,bottom}, ...] (uno por panel visible)
  colors = null,
  // Alternativa simple con hex; si empieza en negro, se toma como stop inicial.
  palette = ["#000000", "#4586d7ff", "#41a152ff", "#4d44b6ff", "#b28c48ff", "#a39d1fff", "#A3A31E"],
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

    const HOLD = 0.14; // mantiene color pleno alrededor del centro
    const plateau = (t) => {
      if (HOLD <= 0) return t;
      const lo = HOLD;
      const hi = 1 - HOLD;
      if (t <= lo) return 0;
      if (t >= hi) return 1;
      return (t - lo) / (hi - lo);
    };

    const onScroll = () => {
      // Tomamos referencias del tramo horizontal
      const hwrap = el.querySelector?.(".hstrip");
      const hsticky = hwrap?.querySelector?.(".hstrip__sticky");
      const htrack = hwrap?.querySelector?.(".hstrip__track");

      // Construir paradas: añadimos un stop negro virtual al inicio
      let stopsTop = [];
      let stopsBot = [];
      if (Array.isArray(colors) && colors.length && (colors[0]?.top || colors[0]?.bottom)) {
        stopsTop = ["#000000", ...colors.map((c) => c.top ?? c.bottom ?? "#000000")];
        stopsBot = ["#000000", ...colors.map((c) => c.bottom ?? c.top ?? "#000000")];
      } else {
        const eff = Array.isArray(palette) && palette.length ? palette : ["#000000", "#4586d7"]; // azul fallback
        const first = eff[0] || "#000000";
        const addBlack = luminance(first) > 0.02; // si no empieza negro, lo añadimos
        const base = addBlack ? ["#000000", ...eff] : eff;
        stopsTop = base.slice();
        stopsBot = base.map((hex) => shade(hex, 0.78));
      }
      const totalSeg = Math.max(1, stopsTop.length - 1);

      // u en unidades de panel: u=0 centro Panel 1, u=1 centro Panel 2, u=-1 centro virtual previo (negro)
      let u = 0;
      if (hwrap && hsticky && htrack && (hwrap.dataset.mode !== "vertical")) {
        const topPx = parseFloat(getComputedStyle(hsticky).top || "0") || 0; // navbarHeight
        const top = hwrap.getBoundingClientRect().top;
        const panelW = Math.max(1, hsticky.clientWidth);
        const raw = (topPx - top) / panelW; // puede ser negativo antes del pin
        const maxU = totalSeg - 1 - 1e-6; // exclusivo superior
        u = Math.max(-1, Math.min(maxU, raw));
      } else {
        // Fallback si no existe el tramo horizontal (ej. mobile)
        const start = el.offsetTop;
        const end = start + el.scrollHeight - window.innerHeight;
        const p = clamp((window.scrollY - start) / Math.max(1, end - start), 0, 1);
        const maxU = totalSeg - 1 - 1e-6;
        u = Math.max(-1, Math.min(maxU, p * (totalSeg - 1)));
      }

      // Selección de segmento en base a u
      const scaled = u + 1; // [-1..] -> [0..]
      const seg = Math.max(0, Math.min(totalSeg - 1, Math.floor(scaled)));
      const localT = scaled - seg; // 0..1
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

      // Near-black apaga halo
      const nearBlack = luminance(topHex) < 0.02;
      bg.classList.toggle("no-glow", !!nearBlack);
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

