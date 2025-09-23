import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/colaboraciones.css";

// Imagen hero (puedes sustituir cuando quieras)
import heroImg from "../../assets/img/gsf_monkey_transparent.png?url";
import monkey from "../../assets/img/gsf_monkey_transparent.png?url";

const DATA = [
    {
        id: "eladio",
        title: "Eladio Carrión",
        img: monkey,
        short: "Máscara Oni / edición especial, acabado soft-touch.",
        long:
            "Desarrollo y prototipado de máscara Oni con estética cartoon, ajuste facial y optimización para producción corta. Packaging ilustrado y verificación ergonómica.",
    },
    {
        id: "brandx",
        title: "Brand X",
        img: monkey,
        short: "Drop cápsula NFC x arte urbano.",
        long:
            "Pieza coleccionable con chip NFC integrado, certificados y experiencia digital. Serie numerada, control de calidad y logística.",
    },
    {
        id: "studioy",
        title: "Studio Y",
        img: monkey,
        short: "Tufting + merchandising premium.",
        long:
            "Alfombra tufting + key set merchandising: llavero, sticker holo y tarjeta firmada. Paleta y materiales sincronizados con la marca.",
    },
    {
        id: "eventz",
        title: "Event Z",
        img: monkey,
        short: "Instalación lumínica / home deco custom.",
        long:
            "Iluminación LED personalizada, difusores impresos en 3D y control DMX. Mockups rápidos y validación onsite.",
    },
    {
        id: "artistq",
        title: "Artist Q",
        img: monkey,
        short: "Art toy firmado, 20 cm, resina.",
        long:
            "Sculpt, moldes de silicona, casting, pintado a mano y base numerada. Documentación del proceso para campaña.",
    },
];

export const Colaboraciones = () => {
    const [active, setActive] = useState(null);
    const [flipped, setFlipped] = useState(false);
    const closeTimer = useRef(null);

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff");
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && active && handleClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [active]);

    const items = useMemo(() => DATA, []);
    const trackRef = useRef(null);

    const handleOpen = (item) => {
        setActive(item);
        requestAnimationFrame(() => setFlipped(true));
    };
    const handleClose = () => {
        setFlipped(false);
        closeTimer.current = setTimeout(() => setActive(null), 420);
    };

    const scrollByCard = (dir) => {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector(".cb-card");
        const step = (card?.getBoundingClientRect().width || 360) + 20;
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    return (
        <section className="cb">
            {/* HERO */}
            <header className="cb-hero">
                <div className="cb-hero__text">
                    <h1 className="cb-title">Colaboraciones</h1>
                    <p className="cb-lead">
                        Nos juntamos con artistas y marcas para crear piezas con alma:
                        prototipos rápidos, acabados premium y experiencias que se sienten
                        hechas a mano. Tú pones la chispa, nosotros el taller.
                    </p>
                </div>
                <div className="cb-hero__media" aria-hidden="true">
                    <img src={heroImg} alt="" />
                </div>
            </header>

            {/* CAROUSEL */}
            <section className="cb-carousel">
                <div className="cb-track" ref={trackRef} role="list">
                    {items.map((it) => (
                        <article
                            key={it.id}
                            role="listitem"
                            className="cb-card"
                            onClick={() => handleOpen(it)}
                        >
                            <div className="cb-card__media">
                                <img src={it.img} alt={it.title} loading="lazy" decoding="async" />
                            </div>
                            <div className="cb-card__body">
                                <h3 className="cb-card__title">{it.title}</h3>
                                <p className="cb-card__short">{it.short}</p>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Flechas – desktop (arriba-derecha) */}
                <div className="cb-navBtns cb-navBtns--desktop" aria-hidden="true">
                    <button className="cb-nav" onClick={() => scrollByCard(-1)} aria-label="Anterior">‹</button>
                    <button className="cb-nav" onClick={() => scrollByCard(1)} aria-label="Siguiente">›</button>
                </div>

                {/* Flechas – móvil (abajo-derecha) */}
                <div className="cb-navBtns cb-navBtns--mobile" aria-hidden="true">
                    <button className="cb-nav" onClick={() => scrollByCard(-1)} aria-label="Anterior">‹</button>
                    <button className="cb-nav" onClick={() => scrollByCard(1)} aria-label="Siguiente">›</button>
                </div>
            </section>

            {/* OVERLAY FLIP */}
            {active && (
                <div className="cb-overlay" onClick={handleClose}>
                    <div className="cb-dialog" onClick={(e) => e.stopPropagation()}>
                        <button className="cb-close" onClick={handleClose} aria-label="Cerrar">×</button>

                        <div className={`cb-flip ${flipped ? "is-flipped" : ""}`}>
                            <div className="cb-face cb-front" onClick={() => setFlipped(true)}>
                                <img src={active.img} alt={active.title} draggable="false" />
                                <div className="cb-front__caption"><h3>{active.title}</h3></div>
                            </div>

                            <div className="cb-face cb-back" onClick={() => setFlipped(false)}>
                                <div className="cb-back__content">
                                    <h3 className="cb-back__title">{active.title}</h3>
                                    <p className="cb-back__long">{active.long}</p>
                                    <ul className="cb-meta">
                                        <li>Prototipado rápido</li>
                                        <li>Acabados premium</li>
                                        <li>Packaging a medida</li>
                                    </ul>
                                    <div className="cb-actions">
                                        <button className="cb-btn" onClick={handleClose}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cb-hint">clic para girar</div>
                    </div>
                </div>
            )}
        </section>
    );
};
