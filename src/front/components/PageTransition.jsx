import React, { useEffect, useRef, useState } from "react";

/* IMPORTA TUS LOGOS CUANDO LOS TENGAS
import g1 from "../assets/logos/g-1.svg";
import g2 from "../assets/logos/g-2.svg";
import g3 from "../assets/logos/g-3.svg";
import g4 from "../assets/logos/g-4.svg";
import g5 from "../assets/logos/g-5.svg";
import g6 from "../assets/logos/g-6.svg";
const logos = [g1, g2, g3, g4, g5, g6];
*/
const logos = []; // fallback tipográfico "G"

// Debe casar con stylesGlobal/transitions.css
const FADE_IN = 180, IN = 420, HOLD = 260, OUT = 520;
// sweep vertical dura IN+HOLD+OUT (=1200ms). Cover real = fade_in + 40% del sweep
const COVER_MS = FADE_IN + Math.round(0.4 * (IN + HOLD + OUT)); // 180 + 480 = 660ms
const TOTAL_MS = FADE_IN + IN + HOLD + OUT; // 1380ms

export default function PageTransition() {
    const [active, setActive] = useState(false);
    const [logoIndex, setLogoIndex] = useState(0);
    const lastIndex = useRef(-1);
    const timers = useRef({ cover: null, end: null, off: null });
    const running = useRef(false); // evita re-disparos

    // Pre-carga de logos (si hay)
    useEffect(() => {
        logos.forEach(src => { const img = new Image(); img.src = src; });
    }, []);

    const trigger = () => {
        if (running.current) return;
        running.current = true;

        // Rotar logo (evitar repetir)
        if (logos.length > 1) {
            let next = Math.floor(Math.random() * logos.length);
            if (next === lastIndex.current) next = (next + 1) % logos.length;
            lastIndex.current = next;
            setLogoIndex(next);
        } else if (logos.length === 1) {
            setLogoIndex(0);
        }

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

    // Disparo por el router (evento global)
    useEffect(() => {
        const onCustom = () => trigger();
        window.addEventListener("gs:transition", onCustom);
        return () => window.removeEventListener("gs:transition", onCustom);
    }, []);

    // Back/forward: maquillamos igual
    useEffect(() => {
        const onPop = () => trigger();
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    // Limpieza
    useEffect(() => () => {
        Object.values(timers.current).forEach(t => clearTimeout(t));
    }, []);

    const src = logos.length ? logos[logoIndex] : null;

    return (
        <div className={`pt ${active ? "is-active" : ""}`} aria-hidden="true">
            {/* orden: fade blanco → cortina → logo */}
            <div className="pt__fade" />
            <div className="pt__track">
                <div className="pt__panel" />
                <div className="pt__panel" />
            </div>
            <div className="pt__logo">
                {src ? <img className="pt__img" src={src} alt="GS logo" /> : <span className="pt__g">G</span>}
            </div>
        </div>
    );
}
