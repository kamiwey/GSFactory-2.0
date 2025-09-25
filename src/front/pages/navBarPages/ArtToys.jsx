import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/art-toys.css";
import ModelViewer from "../../components/ModelViewer";

import toyMono from "../../assets/img/gsf_monkey_transparent.png";
import prototipoGlb from "../../assets/models/prototipo.glb?url";

export const ArtToys = () => {
    const stepsRef = useRef(null);

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff");
    }, []);

    useEffect(() => {
        const root = stepsRef.current;
        if (!root) return;
        const items = root.querySelectorAll(".at-step");
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
            { threshold: 0.2 }
        );
        items.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    const scrollByCard = (dir) => {
        const scroller = document.querySelector(".at-carousel__track");
        if (!scroller) return;
        const card = scroller.querySelector(".at-card");
        const delta = (card?.getBoundingClientRect().width || 320) + 16;
        scroller.scrollBy({ left: dir * delta, behavior: "smooth" });
    };

    return (
        <main className="at">
            {/* ====== SECCIÓN 1: texto IZQ + astronauta DER (como ya tenías) ====== */}
            <section className="at-hero">
                <div className="at-hero__col at-hero__col--text">
                    <h1 className="at-hero__title">Art Toys</h1>
                    <p className="at-hero__lead">
                        Diseñamos y prototipamos figuras con acabados premium.
                        Del boceto al toy de vitrina, sin ruido.
                    </p>
                    <div className="at-hero__cta">
                        <Link to="/projects" className="at-btn" aria-label="Ver proyectos de Art Toys">
                            Ver proyectos
                        </Link>
                    </div>
                </div>

                <div className="at-hero__col at-hero__col--media">
                    <img
                        src={toyMono}
                        alt="Art toy — GS Factory"
                        className="at-hero__img"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </section>

            {/* ====== SECCIÓN 2 (MIRROR): 3D IZQ + texto DER ====== */}
            <section className="at-hero at-hero--mirror">
                {/* ► El orden del markup ya hace el “mirror” sin tocar CSS */}
                <div className="at-hero__col at-hero__col--media at-hero__viewer">
                    <ModelViewer
                        url={prototipoGlb}
                        type="glb"
                        color="#d9d9d9"
                        autorotate={true}
                        rotateSpeed={0.045}
                        rotateAxis="y"
                        up="z"
                        /* Frente cámara (como lo dejamos afinado) */
                        pitch={-Math.PI / 2}
                        yaw={0}
                        roll={0}
                        env="city"
                        height="100%"
                        target={[0, 0, 0]}
                        dracoPath="https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
                    />
                </div>

                <div className="at-hero__col at-hero__col--text">
                    <h2 className="at-hero__title">Prototipo 3D</h2>
                    <p className="at-hero__lead">
                        Mostramos el modelo crudo en tiempo real: rotación suave,
                        materiales neutros y rendimiento optimizado para web.
                    </p>
                    <div className="at-hero__cta">
                        <Link to="/projects" className="at-btn" aria-label="Solicitar prototipo">
                            Solicitar prototipo
                        </Link>
                    </div>
                </div>
            </section>

            {/* ====== SECCIÓN 3: texto IZQ + astronauta DER (sección extra alternada) ====== */}
            <section className="at-hero">
                <div className="at-hero__col at-hero__col--text">
                    <h2 className="at-hero__title">Ediciones & Colabs</h2>
                    <p className="at-hero__lead">
                        Series limitadas, cápsulas y colaboraciones. Mismo estándar
                        de calidad y acabados para piezas listas para vitrina.
                    </p>
                    <div className="at-hero__cta">
                        <Link to="/projects" className="at-btn" aria-label="Ver colaboraciones">
                            Ver colaboraciones
                        </Link>
                    </div>
                </div>

                <div className="at-hero__col at-hero__col--media">
                    <img
                        src={toyMono}
                        alt="Ediciones limitadas — GS Factory"
                        className="at-hero__img"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </section>

            {/* ====== (tu colección/proceso sigue igual debajo si lo tienes en este archivo) ====== */}
            {/* CARRUSEL (sin cambios) */}
            <section className="at-carousel" id="coleccion">
                <header className="at-secHead">
                    <h2 className="at-secTitle">Colección</h2>
                    <div className="at-arrows" aria-hidden="false">
                        <button className="at-arrow" onClick={() => scrollByCard(-1)} aria-label="Anterior">‹</button>
                        <button className="at-arrow" onClick={() => scrollByCard(1)} aria-label="Siguiente">›</button>
                    </div>
                </header>

                <div className="at-carousel__track" role="list">
                    {/* deja aquí tus cards existentes si las tenías; no las repito para no duplicar */}
                </div>

                <div className="at-carousel__overNav" aria-hidden="false">
                    <button className="at-arrow at-arrow--circle at-arrow--left" onClick={() => scrollByCard(-1)} aria-label="Anterior" type="button">‹</button>
                    <button className="at-arrow at-arrow--circle at-arrow--right" onClick={() => scrollByCard(1)} aria-label="Siguiente" type="button">›</button>
                </div>
            </section>

            {/* PROCESO (se mantiene tu lógica de aparición) */}
            <section className="at-process" ref={stepsRef}>
                <header className="at-secHead">
                    <h2 className="at-secTitle">Proceso</h2>
                </header>

                <ol className="at-steps">
                    <li className="at-step">
                        <div className="at-step__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M9 21h6v-2a5 5 0 1 0-6 0v2zM12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.1-3 5.3V16H8v-1.7C6.3 13.1 5 11.5 5 9a7 7 0 0 1 7-7z" /></svg>
                        </div>
                        <h3 className="at-step__title">Idea</h3>
                        <p className="at-step__txt">Concepto y estilo del personaje.</p>
                    </li>
                    <li className="at-step">
                        <div className="at-step__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4" /></svg>
                        </div>
                        <h3 className="at-step__title">Modelado</h3>
                        <p className="at-step__txt">Sculpt & optimización para impresión.</p>
                    </li>
                    <li className="at-step">
                        <div className="at-step__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M7 3h10v4H7zM5 7h14v14H5z" /></svg>
                        </div>
                        <h3 className="at-step__title">Prototipo</h3>
                        <p className="at-step__txt">Impresión, lijado y ensamblaje.</p>
                    </li>
                    <li className="at-step">
                        <div className="at-step__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M7 16c0-3 4-5 5-8 1-3-2-5-4-3-2 2-1 6 2 7M4 20h8l8-8-4-4-8 8v4z" /></svg>
                        </div>
                        <h3 className="at-step__title">Pintura</h3>
                        <p className="at-step__txt">Acabados y control de calidad.</p>
                    </li>
                </ol>

                <div className="at-ctaLine" style={{ padding: "0 clamp(20px, 5vw, 64px)" }}>
                    <Link to="/projects" className="at-link at-link--strong">
                        Solicitar prototipo
                    </Link>
                </div>
            </section>
        </main>
    );
};
