import { useEffect, useRef } from "react";

/**
 * ColorStage
 * Fija un fondo sticky detrás del tramo horizontal y
 * va interpolando colores entre paneles mientras haces scroll.
 *
 * Cómo calcula el progreso:
 * - Lee el `left` del PRIMER panel (.hstrip__panel) respecto al viewport
 *   y lo divide por el ancho de la ventana: eso nos da un índice flotante
 *   i..i+1 sin depender de scrollLeft (tu carril usa transform).
 */
export default function ColorStage({ colors, children }) {
    const stageRef = useRef(null);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const hexToRgb = (hex) => {
            const h = hex.replace("#", "");
            const v = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
            return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        };
        const mix = (c1, c2, t) => {
            const [r1, g1, b1] = hexToRgb(c1);
            const [r2, g2, b2] = hexToRgb(c2);
            const lerp = (a, b) => Math.round(a + (b - a) * t);
            return `rgb(${lerp(r1, r2)}, ${lerp(g1, g2)}, ${lerp(b1, b2)})`;
        };

        const getPanels = () => Array.from(stage.querySelectorAll(".hstrip__panel"));

        let raf = 0;
        const update = () => {
            const panels = getPanels();
            if (!panels.length) return;

            const vw = Math.max(1, window.innerWidth);
            const left0 = panels[0].getBoundingClientRect().left; // negativo al avanzar
            const idxFloat = Math.max(0, Math.min(panels.length - 1, -left0 / vw));

            const i = Math.floor(idxFloat);
            const t = Math.min(1, Math.max(0, idxFloat - i));

            const from = colors[i] || colors[colors.length - 1];
            const to = colors[i + 1] || from;

            stage.style.setProperty("--bgStart", mix(from.top, to.top, t));
            stage.style.setProperty("--bgEnd", mix(from.bottom, to.bottom, t));
        };

        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        const ro = new ResizeObserver(onScroll);
        ro.observe(stage);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            ro.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [colors]);

    return (
        <section ref={stageRef} className="colorStage">
            <div className="colorStage__bg" aria-hidden="true" />
            <div className="colorStage__content">{children}</div>
        </section>
    );
}
