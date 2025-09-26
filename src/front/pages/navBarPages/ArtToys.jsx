import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/art-toys.css";

// Usa la misma imagen/asset que ya usas en el hero (no toco rutas tuyas)
import astronauta from "../../assets/img/gsf_monkey_transparent.png";

// Tu visor 3D GLB (funcionando)
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
                        Diseñamos y prototipamos figuras con acabados premium. Del boceto al toy de vitrina, sin ruido.
                    </p>
                    <div className="at-hero__cta">
                        <Link to="/projects" className="at-btn">Ver proyectos</Link>
                    </div>
                </header>

                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Explorer Astronaut" />
                </div>
            </section>

            {/* HERO 2 (mirror): 3D izq / texto der  */}
            <section className="at-hero at-hero--mirror at-hero--3d">
                {/* 3D a la izquierda. No tocamos CSS; el tamaño real lo da scale/offset. */}
                <div className="at-hero__media">
                    <div className="at-hero__viewer">
                        <ModelViewer
                            // sube/baja este factor para verlo más grande/pequeño (sí responde)
                            scale={1.8}
                            // negativo = más a la izquierda; positivo = a la derecha
                            offsetX={-1.3}
                            // pequeño ajuste vertical
                            offsetY={-0.08}
                            rotate={true}
                        />
                    </div>
                </div>

                <header>
                    <h2 className="at-hero__title">Prototipo<br />3D</h2>
                    <p className="at-hero__lead">
                        Mostramos el modelo crudo en tiempo real: rotación suave, materiales neutros
                        y rendimiento optimizado para web.
                    </p>
                    <div className="at-hero__cta">
                        <a href="#contact" className="at-btn">Solicitar prototipo</a>
                    </div>
                </header>
            </section>

            {/* HERO 3 (texto izq / imagen der) */}
            <section className="at-hero">
                <header>
                    <h2 className="at-hero__title">Proceso<br />Premium</h2>
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Proceso / mock visual" />
                </div>
            </section>
        </main>
    );
};

export default ArtToys;
export { ArtToys };
<div className="at-hero__viewer">
    <ModelViewer
        scale={2.8}       // igual de grande
        offsetX={-1.18}   // un poco menos a la izquierda para que no “raspe” el borde
        offsetY={-0.02}   // centrado vertical afinado
    />

</div>
