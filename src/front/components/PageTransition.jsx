import React, { useEffect, useRef, useState } from "react";

/* IMPORTA TUS LOGOS CUANDO LOS TENGAS
import g1 from "../assets/logos/g-1.svg";
import g2 from "../assets/logos/g-2.svg";
import g3 from "../assets/logos/g-3.svg";
import g4 from "../assets/logos/g-4.svg";
import g5 from "../assets/logos/g-5.svg";
import g6 from "../assets/logos/g-6.svg";
// opcionalmente más: g7, g8...
const logos = [g1, g2, g3, g4, g5, g6];
*/
const logos = []; // fallback tipográfico "G"

// Duraciones en ms: deben casar con stylesGlobal/transitions.css
const FADE_IN = 180, IN = 420, HOLD = 260, OUT = 520;
const TOTAL_MS = FADE_IN + IN + HOLD + OUT;

export default function PageTransition() {
    const [active, setActive] = useState(false);
    const [logoIndex, setLogoIndex] = useState(0);
    const lastIndex = useRef(-1);
    const timer = useRef(null);

    // Pre-carga simple de logos para evitar parpadeos (si hubiera imágenes)
    useEffect(() => {
        logos.forEach(src => { const img = new Image(); img.src = src; });
    }, []);

    // Handler común: activa la transición y rota logo
    const trigger = () => {
        // elige un logo distinto al anterior si hay varios
        if (logos.length > 1) {
            let next = Math.floor(Math.random() * logos.length);
            if (next === lastIndex.current) next = (next + 1) % logos.length;
            lastIndex.current = next;
            setLogoIndex(next);
        } else if (logos.length === 1) {
            setLogoIndex(0);
        }

        setActive(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setActive(false), TOTAL_MS);
    };

    // 1) Escucha navegación iniciada por nuestros enlaces/evento global
    useEffect(() => {
        const onCustom = () => trigger();
        window.addEventListener("gs:transition", onCustom);
        return () => {
            window.removeEventListener("gs:transition", onCustom);
        };
    }, []);

    // 2) “Atrás/Adelante” del navegador: no podemos retrasar la navegación,
    //    pero activamos la cortina inmediatamente para maquillar el cambio.
    useEffect(() => {
        const onPop = () => {
            // dispara ya; el navegador cambiará la ruta igualmente
            trigger();
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    const src = logos.length ? logos[logoIndex] : null;

    return (
        <div className={`pt ${active ? "is-active" : ""}`} aria-hidden="true">
            {/* Orden visual: fade blanco (abajo) → cortina → logo (arriba) */}
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
