import React, { useEffect, useRef } from "react";

/**
 * Paleta de fondos por secciones.
 * Si tenías una importación tipo `PALETTE_HOME` la puedes mantener,
 * pero aquí la inlinéo para que funcione tal cual.
 *
 * IMPORTANTE: añadimos un color 0 NEGRO para que el primer blend
 * sea negro -> azul (sección 1) con el MISMO motor que el resto.
 */
const PALETTE_HOME = [
    // === color 0: NEGRO (nuevo) ===
    { start: "#000000", end: "#000000" },

    // === color 1..6: tus colores por secciones (ejemplo tomado de tus capturas) ===
    // Sección 1 (azules)
    { start: "#3D7CC8", end: "#183E83" },
    // Sección 2 (verde teal)
    { start: "#2B958F", end: "#1E7470" },
    // Sección 3 (verde)
    { start: "#3E9B49", end: "#2E7B38" },
    // Sección 4 (morado)
    { start: "#4D3EC0", end: "#2E279A" },
    // Sección 5 (rojo)
    { start: "#C64549", end: "#A23338" },
    // Sección 6 (mostaza)
    { start: "#A5A01A", end: "#6F6C10" },
];

// Utilidades de mezcla de color
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hexToRgb = (hex) => {
    const s = hex.replace("#", "");
    const n = parseInt(s.length === 3 ? s.split("").map(c => c + c).join("") : s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToHex = ({ r, g, b }) =>
    "#" +
    [r, g, b]
        .map((v) => {
            const s = Math.round(v).toString(16);
            return s.length === 1 ? "0" + s : s;
        })
        .join("");

const mixHex = (a, b, t) => {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    return rgbToHex({
        r: ca.r + (cb.r - ca.r) * t,
        g: ca.g + (cb.g - ca.g) * t,
        b: ca.b + (cb.b - ca.b) * t,
    });
};

export default function ColorStage({ children }) {
    const rootRef = useRef(null);
    const bgRef = useRef(null);

    useEffect(() => {
        const root = rootRef.current;
        const bg = bgRef.current;
        if (!root || !bg) return;

        const palette = PALETTE_HOME; // ya incluye negro en [0]
        const steps = palette.length - 1; // nº de transiciones

        let raf = 0;

        const update = () => {
            const rect = root.getBoundingClientRect();
            const vh = window.innerHeight;

            // progreso vertical del tramo ColorStage en [0..1]
            // 0 cuando su borde superior toca la parte inferior del viewport (sale del hero),
            // 1 cuando está completamente recorrido.
            const total = rect.height - vh;
            const localY = clamp((vh - rect.top) / Math.max(1, vh + total)); // robusto
            const p = clamp(localY);

            // mapeamos progreso global [0..1] a “pasos” de paleta
            const g = p * steps;
            const i = Math.floor(g);
            const t = clamp(g - i);

            const from = palette[i] ?? palette[0];
            const to = palette[i + 1] ?? palette[i];

            const bgStart = mixHex(from.start, to.start, t);
            const bgEnd = mixHex(from.end, to.end, t);

            // variables CSS que usa tu CSS en .colorStage__bg
            bg.style.setProperty("--bgStart", bgStart);
            bg.style.setProperty("--bgEnd", bgEnd);

            raf = requestAnimationFrame(update);
        };

        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <section className="colorStage" ref={rootRef}>
            <div className="colorStage__bg" ref={bgRef} />
            <div className="colorStage__content">{children}</div>
        </section>
    );
}
