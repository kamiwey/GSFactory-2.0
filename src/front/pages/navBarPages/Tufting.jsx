import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/tufting.css";

import frontImg from "../../assets/img/Tarjeta-Tecnocasa.png";
import backImg from "../../assets/img/Tarjeta-Tecnocasa-Back.png";

export const Tufting = () => {
    const [pos, setPos] = useState(50); // % del deslizador
    const boxRef = useRef(null);
    const draggingRef = useRef(false);

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff");
    }, []);

    const percentFromEvent = useCallback((e) => {
        const box = boxRef.current;
        if (!box) return 50;
        const rect = box.getBoundingClientRect();
        // soporta mouse y touch/pointer
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        return Math.round((x / rect.width) * 100);
    }, []);

    const onPointerDown = (e) => {
        draggingRef.current = true;
        setPos(percentFromEvent(e));
        // captura para mover fuera del área si el usuario arrastra
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp, { once: true });
    };

    const onPointerMove = (e) => {
        if (!draggingRef.current) return;
        setPos(percentFromEvent(e));
    };

    const onPointerUp = () => {
        draggingRef.current = false;
        window.removeEventListener("pointermove", onPointerMove);
    };

    return (
        <section className="tufting--section">
            <header className="tufting--header">
                <h1 className="tufting--title">TUFTING</h1>
            </header>

            <div
                ref={boxRef}
                className="tufting--compare"
                aria-label="Comparador de imágenes tufting"
                onPointerDown={onPointerDown}
                role="group"
            >
                {/* Base (Back) */}
                <img
                    src={backImg}
                    alt="Tarjeta Tecnocasa - reverso"
                    className="compare__img compare__img--base"
                    draggable="false"
                    loading="eager"
                    decoding="async"
                />

                {/* Overlay (Front) recortado con clip-path */}
                <div className="compare__overlay" style={{ "--pos": `${pos}%` }}>
                    <img
                        src={frontImg}
                        alt="Tarjeta Tecnocasa - frontal"
                        className="compare__img compare__img--top"
                        draggable="false"
                        loading="eager"
                        decoding="async"
                    />
                </div>

                {/* Línea + handler custom */}
                <div className="compare__divider" style={{ left: `${pos}%` }}>
                    <div className="compare__handle" aria-hidden="true" />
                </div>

                {/* Control accesible invisible (para teclado/lectores) */}
                <label className="sr-only" htmlFor="compareRange">
                    Desliza para comparar frontal y reverso
                </label>
                <input
                    id="compareRange"
                    className="compare__range--sr"
                    type="range"
                    min="0"
                    max="100"
                    value={pos}
                    onChange={(e) => setPos(Number(e.target.value))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pos}
                />
            </div>
        </section>
    );
};
