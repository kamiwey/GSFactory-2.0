import React, { useMemo, useState } from "react";
import "../styles/colaboraciones.css";
import astronauta from "../../assets/img/gsf_monkey_transparent.png";

const proyectosSeed = [
    { id: "drop-machine", nombre: "THE DROP MACHINE™", descripcion: "Vending de coleccionables sorpresa con NFC. Serie limitada, alto hype y ROI emocional.", img: astronauta },
    { id: "primate-planet", nombre: "PRIMATE PLANET™", descripcion: "Nuestra línea de Art Toys. Personajes con outfits y dioramas. Coleccionable premium.", img: astronauta },
    { id: "nfc-keys", nombre: "Llaveros NFC 3D", descripcion: "Acceso a experiencias digitales y verificación de autenticidad.", img: astronauta },
    { id: "smoke-filter", nombre: "Filtro patentado", descripcion: "Parafernalia con ingeniería propia. Diseño limpio, valor real.", img: astronauta },
    { id: "tufting", nombre: "Alfombras Tufting", descripcion: "Textil con estética urbana. Ediciones limitadas.", img: astronauta },
    { id: "merch-3d", nombre: "Merch 3D", descripcion: "Piezas a medida para marcas y artistas. Producción interna.", img: astronauta },
];

const Colaboraciones = () => {
    const [index, setIndex] = useState(0);
    const step = useMemo(() => 360 / proyectosSeed.length, []);
    // rotación acumulada: giro infinito sin retrocesos
    const [theta, setTheta] = useState(0);

    const onNext = () => {
        setIndex(i => (i + 1) % proyectosSeed.length);
        setTheta(t => t - step);
    };
    const onPrev = () => {
        setIndex(i => (i - 1 + proyectosSeed.length) % proyectosSeed.length);
        setTheta(t => t + step);
    };

    const seleccionado = proyectosSeed[index];

    return (
        <section className="gf-colabs-wrapper" aria-label="Colaboraciones G’s Factory">
            {/* Stage protagonista centrado */}
            <div className="gf-colabs-stage">
                {/* Copy overlay (izquierda) */}
                <aside className="gf-colabs-side">
                    <h2 className="gf-colabs-title">{seleccionado.nombre}</h2>
                    <p className="gf-colabs-desc">{seleccionado.descripcion}</p>
                </aside>

                {/* Flechas (su posición se calcula en CSS para pegarlas al carrusel) */}
                <button className="gf-arrow gf-left" onClick={onPrev} aria-label="Anterior">‹</button>

                {/* Carrusel 3D (NO tocado tamaño ni posición) */}
                <div
                    className="gf-ring"
                    style={{ transform: `translateZ(var(--ringZ)) rotateY(${theta}deg)` }}
                >
                    {proyectosSeed.map((p, i) => (
                        <figure
                            key={p.id}
                            className={`gf-item ${i === index ? "is-active" : ""}`}
                            style={{ transform: `rotateY(${i * step}deg) translateZ(var(--radius))` }}
                        >
                            <img src={p.img} alt={p.nombre} draggable="false" />
                        </figure>
                    ))}
                </div>

                <button className="gf-arrow gf-right" onClick={onNext} aria-label="Siguiente">›</button>
            </div>

            {/* Cards cuadradas y centradas (sin cambios funcionales) */}
            <div className="gf-colabs-cards" role="list">
                {proyectosSeed.map((p, i) => (
                    <button
                        key={p.id}
                        className={`gf-card ${i === index ? "is-selected" : ""}`}
                        onClick={() => {
                            const delta = ((i - index + proyectosSeed.length) % proyectosSeed.length);
                            setTheta(t => t - delta * step);
                            setIndex(i);
                        }}
                        aria-label={`Seleccionar ${p.nombre}`}
                        role="listitem"
                    >
                        <div className="gf-card-media">
                            <img src={p.img} alt="" aria-hidden="true" />
                        </div>
                        <span className="gf-card-label">{p.nombre}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};


export { Colaboraciones };
