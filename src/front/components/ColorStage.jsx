import React, { useEffect, useRef } from "react";

/**
 * Fondo de color con mezcla y detección de near-black.
 * Ajustado para retrasar la transición de color y mantener
 * el color fijo cuando los paneles están centrados.
 */
export default function ColorStage({
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
            "#" +
            [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

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

        // Luminancia relativa (WCAG) para detectar casi negro
        const luminance = (hex) => {
            const { r, g, b } = hexToRgb(hex);
            const norm = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
        };

        const onScroll = () => {
            // Progreso alineado con HorizontalStrip (si existe)
            // para que el color quede fijo cuando cada panel está centrado.
            const hwrap = el.querySelector?.('.hstrip');
            const hsticky = hwrap?.querySelector?.('.hstrip__sticky');
            const htrack = hwrap?.querySelector?.('.hstrip__track');

            let p = 0; // progreso 0..1 del tramo horizontal
            if (hwrap && hsticky && htrack && (hwrap.dataset.mode !== 'vertical')) {
                const topPx = parseFloat(getComputedStyle(hsticky).top || '0') || 0; // navbarHeight
                const totalX = Math.max(0, htrack.scrollWidth - hsticky.clientWidth);
                const top = hwrap.getBoundingClientRect().top;
                const scrolledY = Math.min(totalX, Math.max(0, topPx - top));
                p = totalX > 0 ? scrolledY / totalX : 0;
            } else {
                // Fallback: usar el tramo del propio ColorStage
                const start = el.offsetTop;
                const end = start + el.scrollHeight - window.innerHeight;
                p = clamp((window.scrollY - start) / Math.max(1, end - start), 0, 1);
            }

            // Repartimos 0..1 entre (palette.length-1) transiciones
            const segments = Math.max(1, palette.length - 1);
            const scaled = p * segments;
            const seg = clamp(Math.floor(scaled), 0, segments - 1);
            const localT = scaled - seg; // 0..1 dentro del segmento

            // Plateau/hold para retrasar el cambio cerca de centros
            const HOLD = 0.18; // fracción mantenida por extremo del segmento
            const plateau = (t) => {
                if (HOLD <= 0) return t;
                const lo = HOLD;
                const hi = 1 - HOLD;
                if (t <= lo) return 0;
                if (t >= hi) return 1;
                return (t - lo) / (hi - lo);
            };

            const t2 = plateau(localT);
            const eased = t2 * t2 * (3 - 2 * t2); // suavizado leve

            const from = palette[seg];
            const to = palette[seg + 1];
            const base = mix(from, to, eased);

            const top = base;
            const bottom = shade(base, 0.78);

            bg.style.setProperty('--bgStart', top);
            bg.style.setProperty('--bgEnd', bottom);

            // Apaga el halo cuando el color actual es muy oscuro (casi negro)
            const nearBlack = luminance(base) < 0.02 || (seg === 0 && localT < 0.15);
            bg.classList.toggle('no-glow', !!nearBlack);
        };

        const onResize = () => onScroll();

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
        };
    }, [palette, hold0]);

    return (
        <section className="colorStage" ref={sectionRef}>
            <div className="colorStage__bg" ref={bgRef} />
            <div className="colorStage__content">{children}</div>
        </section>
    );
}

