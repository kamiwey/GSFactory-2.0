import React, { useEffect, useRef, useState } from "react";
import gsMono from "../assets/img/logo-color.svg";

// Paleta para las cortinas (rota en cada transición)
const COLORS = [
    "#3E78D1", // azul
    "#2DA57F", // verde
    "#5342D9", // violeta
    "#B5823E", // ocre
    "#D24545", // rojo
    "#A3A31E", // oliva
    "#111111", // casi negro (por si queréis uno oscuro)
];

// Debe casar con transitions.css existente
const FADE_IN = 180, IN = 420, HOLD = 260, OUT = 520;
const COVER_MS = FADE_IN + Math.round(0.4 * (IN + HOLD + OUT));
const TOTAL_MS = FADE_IN + IN + HOLD + OUT;

export default function PageTransition() {
    const [active, setActive] = useState(false);
    const [logoIndex, setLogoIndex] = useState(0); // por si algún día volvéis a rotar logos
    const [colorIdx, setColorIdx] = useState(0);
    const lastColor = useRef(-1);
    const lastIndex = useRef(-1);
    const timers = useRef({ cover: null, end: null, off: null });
    const running = useRef(false);

    // Pre-carga (si añadís más SVGs algún día)
    useEffect(() => {
        const img = new Image();
        img.src = gsMono;
    }, []);

    const pickNextColor = () => {
        if (COLORS.length <= 1) return 0;
        let next = Math.floor(Math.random() * COLORS.length);
        if (next === lastColor.current) next = (next + 1) % COLORS.length;
        lastColor.current = next;
        return next;
    };

    const trigger = () => {
        if (running.current) return;
        running.current = true;

        // Color para ESTA transición
        setColorIdx(pickNextColor());

        // Logo (queda el mono fijo, pero mantenemos el índice por compatibilidad)
        setLogoIndex(0);
        lastIndex.current = 0;

        setActive(true);

        clearTimeout(timers.current.cover);
        timers.current.cover = setTimeout(() => {
            window.dispatchEvent(new CustomEvent("gs:transition:cover"));
        }, COVER_MS);

        clearTimeout(timers.current.end);
        timers.current.end = setTimeout(() => {
            window.dispatchEvent(new CustomEvent("gs:transition:end"));
            clearTimeout(timers.current.off);
            timers.current.off = setTimeout(() => {
                setActive(false);
                running.current = false;
            }, 10);
        }, TOTAL_MS);
    };

    useEffect(() => {
        const onCustom = () => trigger();
        window.addEventListener("gs:transition", onCustom);
        return () => window.removeEventListener("gs:transition", onCustom);
    }, []);

    useEffect(() => {
        const onPop = () => trigger();
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    useEffect(() => () => {
        Object.values(timers.current).forEach((t) => clearTimeout(t));
    }, []);

    const styleVars = { "--pt-accent": COLORS[colorIdx] };

    return (
        <div className={`pt ${active ? "is-active" : ""}`} aria-hidden="true" style={styleVars}>
            {/* orden: fade blanco → cortinas → logo */}
            <div className="pt__fade" />
            <div className="pt__track">
                <div className="pt__panel" />
                <div className="pt__panel" />
            </div>
            <div className="pt__logo">
                <img className="pt__img" src={gsMono} alt="GS Factory" />
            </div>
        </div>
    );
}
