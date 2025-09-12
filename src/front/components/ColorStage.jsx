import React, { useEffect, useRef } from "react";

/**
 * ColorStage
 * - Fondo con degradado controlado por scroll.
 * - Mantiene negro debajo del video hasta que el hero sale por arriba.
 * - Desde ese punto hasta el pin, mezcla negro -> azul para que el Panel 1 llegue azul completo.
 * - Con el pin activo, sincroniza cada transicion con el centro de los paneles.
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
      const hwrap = el.querySelector?.(".hstrip");
      const hsticky = hwrap?.querySelector?.(".hstrip__sticky");
      const htrack = hwrap?.querySelector?.(".hstrip__track");
      const hero = document.querySelector?.(".hero");

      // Determinar el color del Panel 1 (azul) y su bottom sombreado
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
        const topPx = parseFloat(getComputedStyle(hsticky).top || "0") || 0; // navbarHeight
        const top = hwrap.getBoundingClientRect().top;
        const beforePin = top > topPx;
        const totalX = Math.max(0, htrack.scrollWidth - hsticky.clientWidth);

        // 1) Antes del pin: mantener NEGRO hasta que el hero desaparezca por arriba
        if (beforePin) {
          const heroBottom = hero?.getBoundingClientRect?.().bottom ?? Infinity;
          const heroOut = heroBottom <= topPx + 0.5; // letras han desaparecido
          if (!heroOut) {
            bg.style.setProperty("--bgStart", "#000000");
            bg.style.setProperty("--bgEnd", "#000000");
            bg.classList.add("no-glow");
            return;
          }

          // 2) Entre heroOut y pin: mezclar NEGRO -> AZUL para llegar con azul completo al pin
          const d1 = Math.max(0, topPx - heroBottom); // progreso desde que el hero salio
          const d2 = Math.max(0, top - topPx);        // distancia restante hasta pin
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

        // Si ya pasamos el final del wrap horizontal, continuar la transición en la parte vertical
        if (!beforePin && (topPx - top) > totalX + 0.5) {
          const vstack = el.querySelector?.('.vstack');
          if (vstack) {
            const startY = window.scrollY + vstack.getBoundingClientRect().top;
            const endY = startY + vstack.scrollHeight - window.innerHeight;
            const p = clamp((window.scrollY - startY) / Math.max(1, endY - startY), 0, 1);

            // partimos del último color y oscurecemos sutilmente hacia el final
            let baseTop = [];
            let baseBot = [];
            if (Array.isArray(colors) && colors.length) {
              baseTop = colors.map((c) => c.top ?? c.bottom ?? firstTop);
              baseBot = colors.map((c) => c.bottom ?? c.top ?? firstBot);
            } else {
              const eff = Array.isArray(palette) && palette.length ? palette : ["#000000", firstTop];
              const base = (eff[0] && luminance(eff[0]) < 0.02) ? eff.slice(1) : eff.slice();
              baseTop = base.slice();
              baseBot = base.map((hex) => shade(hex, 0.78));
            }
            const lastTop = baseTop[baseTop.length - 1] ?? firstTop;
            const lastBot = baseBot[baseBot.length - 1] ?? firstBot;
            const extTop = [lastTop, shade(lastTop, 0.9), shade(lastTop, 0.8)];
            const extBot = [lastBot, shade(lastBot, 0.92), shade(lastBot, 0.84)];

            const totalSeg = Math.max(1, extTop.length - 1); // 2 segmentos (paneles 7 y 8)
            const scaled = p * totalSeg;
            const seg = Math.max(0, Math.min(totalSeg - 1, Math.floor(scaled)));
            const localT = scaled - seg;
            const t2v = plateau(localT);
            const eased = t2v * t2v * (3 - 2 * t2v);

            const fromTop = extTop[seg];
            const toTop = extTop[seg + 1] ?? extTop[seg];
            const fromBot = extBot[seg];
            const toBot = extBot[seg + 1] ?? extBot[seg];
            const topHex = mix(fromTop, toTop, eased);
            const bottomHex = mix(fromBot, toBot, eased);
            bg.style.setProperty("--bgStart", topHex);
            bg.style.setProperty("--bgEnd", bottomHex);
            bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
            return;
          }
        }

        // 3) Con pin activo: transiciones por panel (desde AZUL hacia los siguientes)
        const panelW = Math.max(1, hsticky.clientWidth);
        const u = (topPx - top) / panelW; // 0 en centro del Panel 1

        // Construye stops a partir del Panel 1 (sin negro)
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

      // 4) Fallback (vertical): replica la logica de desktop (mantener negro bajo hero y mezclar hasta tocar navbar)
      const getNavH = () => {
        const v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "0";
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };
      const topPx = getNavH();

      const hwrapTop = hwrap?.getBoundingClientRect?.().top ?? Infinity;
      const heroBottom = hero?.getBoundingClientRect?.().bottom ?? Infinity;

      // 4.a) Hero aun visible: negro
      if (heroBottom > topPx + 0.5) {
        bg.style.setProperty("--bgStart", "#000000");
        bg.style.setProperty("--bgEnd", "#000000");
        bg.classList.add("no-glow");
        return;
      }

      // 4.b) Hero salio pero el tramo aun no llego a la navbar: mezcla negro -> azul
      if (hwrapTop > topPx + 0.5) {
        const d1 = Math.max(0, topPx - heroBottom);
        const d2 = Math.max(0, hwrapTop - topPx);
        const s = (d1 + d2) > 0 ? d1 / (d1 + d2) : 1;
        const t2 = plateau(clamp(s, 0, 1));
        const eased = t2 * t2 * (3 - 2 * t2);

        const topHex = mix("#000000", firstTop, eased);
        const bottomHex = mix("#000000", firstBot, eased);
        bg.style.setProperty("--bgStart", topHex);
        bg.style.setProperty("--bgEnd", bottomHex);
        bg.classList.toggle("no-glow", luminance(topHex) < 0.02);
        return;
      }

      // 4.c) Progreso normal por la seccion completa (desde azul hacia siguientes colores)
      const start = el.offsetTop;
      const end = start + el.scrollHeight - window.innerHeight;
      const p = clamp((window.scrollY - start) / Math.max(1, end - start), 0, 1);

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

      const totalSeg = Math.max(1, stopsTop.length - 1);
      const scaled = p * totalSeg;
      const seg = Math.max(0, Math.min(totalSeg - 1, Math.floor(scaled)));
      const localT = scaled - seg;
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
