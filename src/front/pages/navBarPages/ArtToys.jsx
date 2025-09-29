import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/art-toys.css";

// respeta tu import de imagen
import astronauta from "../../assets/img/gsf_monkey_transparent.png";

// respeta tu import del visor 3D
import ModelViewer from "../../components/ModelViewer";

/* ========= Split de caracteres SOLO para títulos (sin dependencias) ========= */
function splitTitleChars(rootSelector = ".at-hero__title[data-split='chars']") {
    const els = document.querySelectorAll(rootSelector);
    els.forEach((el) => {
        if (el.dataset.splitDone === "true") return;
        const nodes = Array.from(el.childNodes);
        const frag = document.createDocumentFragment();
        let i = 0;

        const pushChar = (ch) => {
            const span = document.createElement("span");
            span.className = "char";
            span.style.setProperty("--char-index", i++);
            span.textContent = ch;
            frag.appendChild(span);
        };

        nodes.forEach((node) => {
            if (node.nodeType === 3) {
                for (const ch of node.textContent) pushChar(ch);
            } else if (node.nodeName === "BR") {
                frag.appendChild(document.createElement("br"));
            } else {
                frag.appendChild(node.cloneNode(true));
            }
        });

        const original = el.textContent;
        el.setAttribute("aria-label", original);
        el.textContent = "";
        el.appendChild(frag);
        el.classList.add("at-split");
        el.dataset.splitDone = "true";
    });
}

/* ========= Activación por scroll (centro de panel) con rAF ========= */
function sectionCenterIsInViewport(sec, marginPct = 0.35) {
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const topBand = vh * marginPct;
    const bottomBand = vh * (1 - marginPct);
    const secCenter = r.top + r.height / 2;
    return secCenter >= topBand && secCenter <= bottomBand;
}

function setupScrollActivator() {
    const sections = Array.from(document.querySelectorAll(".at-hero"));
    let ticking = false;

    const markIn = (s) => {
        s.dataset.in = "1";
        s.querySelectorAll(".at-hero__title, .at-hero__lead").forEach((el) => {
            el.classList.add("is-in");
        });
    };

    const check = () => {
        sections.forEach((s) => {
            if (s.dataset.in === "1") return;
            if (sectionCenterIsInViewport(s, 0.35)) markIn(s);
        });
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(check);
        }
    };

    // Primer pase
    check();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
    };
}

const ArtToys = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        splitTitleChars(); // 1) envolver títulos en spans

        // 2) Disparo inmediato del HERO 1 para que sea visible al cargar
        const first = document.querySelector(".at-hero");
        if (first) {
            first
                .querySelectorAll(".at-hero__title, .at-hero__lead")
                .forEach((el) => el.classList.add("is-in"));
            first.dataset.in = "1";
        }

        // 3) Activación por scroll para el resto de secciones
        const cleanup = setupScrollActivator();
        return cleanup;
    }, []);

    return (
        <main className="at">
            {/* HERO 1: texto izq / imagen der */}
            <section className="at-hero">
                <header>
                    <h1 className="at-hero__title" data-split="chars">
                        Art Toys
                    </h1>
                    <p className="at-hero__lead">
                        Diseñamos y prototipamos figuras con acabados premium. Del boceto al toy de vitrina, sin ruido.
                    </p>
                    {/* Botones eliminados */}
                </header>

                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Explorer Astronaut" />
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
                    {/* 👉 desde la derecha */}
                    <h2 className="at-hero__title at-fromRight" data-split="chars">
                        Prototipo
                        <br />
                        3D
                    </h2>
                    <p className="at-hero__lead at-fromRight">
                        Mostramos el modelo crudo en tiempo real: rotación suave, materiales neutros y rendimiento optimizado para web.
                    </p>
                    {/* Botones eliminados */}
                </header>
            </section>

            {/* HERO 3: texto izq / imagen der (mock) */}
            <section className="at-hero">
                <header>
                    <h2 className="at-hero__title" data-split="chars">
                        Proceso
                        <br />
                        Premium
                    </h2>
                    <p className="at-hero__lead">
                        Pipeline claro, texturas versátiles y entregas sin fricción para coleccionistas y marcas.
                    </p>
                    {/* Botones eliminados */}
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Proceso / mock visual" />
                </div>
            </section>
        </main>
    );
};

export { ArtToys };
