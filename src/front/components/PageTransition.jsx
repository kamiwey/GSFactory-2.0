import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/* IMPORTA TUS LOGOS AQUÍ cuando los tengas
import g1 from "../assets/logos/g-1.svg";
import g2 from "../assets/logos/g-2.svg";
import g3 from "../assets/logos/g-3.svg";
import g4 from "../assets/logos/g-4.svg";
import g5 from "../assets/logos/g-5.svg";
import g6 from "../assets/logos/g-6.svg";
const logos = [g1, g2, g3, g4, g5, g6];
*/
const logos = []; // de momento vacío; fallback "G"

const totalMs = 420 + 260 + 520; // debe casar con --pt-in + --pt-hold + --pt-out

export default function PageTransition() {
    const location = useLocation();
    const [active, setActive] = useState(false);
    const [logoIndex, setLogoIndex] = useState(0);
    const firstMount = useRef(true);
    const lastIndex = useRef(-1);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    useEffect(() => {
        if (firstMount.current) { // sin animación en la primera carga
            firstMount.current = false;
            return;
        }

        // elige un logo distinto al anterior si hay varios
        if (logos.length > 1) {
            let next = Math.floor(Math.random() * logos.length);
            if (next === lastIndex.current) next = (next + 1) % logos.length;
            lastIndex.current = next;
            setLogoIndex(next);
        } else if (logos.length === 1) {
            setLogoIndex(0);
        }

        // dispara animación
        setActive(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setActive(false), totalMs);
    }, [location.key]);

    const hasImages = logos.length > 0;
    const src = hasImages ? logos[logoIndex] : null;

    return (
        <div className={`pt ${active ? "is-active" : ""}`} aria-hidden="true">
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
