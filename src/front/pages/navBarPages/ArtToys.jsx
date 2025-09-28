import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/art-toys.css";

// respeta tu import de imagen
import astronauta from "../../assets/img/gsf_monkey_transparent.png";

// respeta tu import del visor 3D
import ModelViewer from "../../components/ModelViewer";

const ArtToys = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="at">
            {/* HERO 1: texto izq / imagen der */}
            <section className="at-hero">
                <header>
                    <h1 className="at-hero__title">Art Toys</h1>
                    <p className="at-hero__lead">
                        Diseñamos y prototipamos figuras con acabados premium. Del boceto al
                        toy de vitrina, sin ruido.
                    </p>
                    <div className="at-hero__cta">
                        <Link to="/projects" className="at-btn">
                            Ver proyectos
                        </Link>
                    </div>
                </header>

                <div className="at-hero__media">
                    <img
                        className="at-hero__img"
                        src={astronauta}
                        alt="Explorer Astronaut"
                    />
                </div>
            </section>

            {/* HERO 2 (mirror): 3D izq / texto der */}
            <section className="at-hero at-hero--mirror at-hero--3d">
                <div className="at-hero__media">
                    <div className="at-hero__viewer">
                        <ModelViewer
                            /* NO tocamos tamaño ni posición del mono: valores tal cual */
                            scale={1}
                            offsetX={-0.2}
                            offsetY={0.1}
                            rotate={true}
                        />
                    </div>
                </div>

                <header>
                    <h2 className="at-hero__title">
                        Prototipo
                        <br />
                        3D
                    </h2>
                    <p className="at-hero__lead">
                        Mostramos el modelo crudo en tiempo real: rotación suave, materiales
                        neutros y rendimiento optimizado para web.
                    </p>
                    <div className="at-hero__cta">
                        <a href="#contact" className="at-btn">
                            Solicitar prototipo
                        </a>
                    </div>
                </header>
            </section>

            {/* HERO 3: texto izq / imagen der (mock) */}
            <section className="at-hero">
                <header>
                    <h2 className="at-hero__title">
                        Proceso
                        <br />
                        Premium
                    </h2>
                </header>
                <div className="at-hero__media">
                    <img
                        className="at-hero__img"
                        src={astronauta}
                        alt="Proceso / mock visual"
                    />
                </div>
            </section>
        </main>
    );
};

export { ArtToys };
