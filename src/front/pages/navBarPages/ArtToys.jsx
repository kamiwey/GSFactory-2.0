import React, { useEffect, useRef } from "react";
import "../styles/art-toys.css";

import astronauta from "../../assets/img/gsf_monkey_transparent.png";
import ModelViewer from "../../components/ModelViewer";

/* ============== Split muy simple (chars) ============== */
function splitTitleChars(sel = ".at-hero__title[data-split='chars']") {
    const els = document.querySelectorAll(sel);
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

        nodes.forEach((n) => {
            if (n.nodeType === 3) {
                for (const ch of n.textContent) pushChar(ch);
            } else if (n.nodeName === "BR") {
                frag.appendChild(document.createElement("br"));
            } else {
                frag.appendChild(n.cloneNode(true));
            }
        });

        el.setAttribute("aria-label", el.textContent);
        el.textContent = "";
        el.appendChild(frag);
        el.classList.add("at-split");
        el.dataset.splitDone = "true";
    });
}

/* ============== Activador “is-in” por centro de panel ============== */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
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

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
    };
}

/* ============== Utilidades órbita ============== */
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const pageTop = (el) =>
    el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);

/* ============== Escena de cards final (sticky + 3D) ============== */
function setupCardsStage(stageEl) {
    if (!stageEl) return () => { };
    const sticky = stageEl.querySelector(".at-cardsSticky");
    const cards = Array.from(stageEl.querySelectorAll(".at-card3d"));
    if (!sticky || cards.length === 0) return () => { };

    // Envoltorio visual (blur/opacity) sin tocar Z
    cards.forEach((card) => {
        if (!card.querySelector(".at-card3d__inner")) {
            const inner = document.createElement("div");
            inner.className = "at-card3d__inner";
            while (card.firstChild) inner.appendChild(card.firstChild);
            card.appendChild(inner);
        }
    });

    // ======= Ajuste pedido: desplazar el centro de la órbita a la DERECHA =======
    // Cantidad del desplazamiento horizontal del centro, en vw.
    // Sube/baja este valor para más/menos espacio con el astronauta.
    const ORBIT_OFFSET_X_VW = 16; // <- cambia aquí si quieres más hueco

    // Geometría de la órbita
    const RADIUS_X_VW = 38;
    const RADIUS_Y_VH = 10;
    const ANG_START = (-40 * Math.PI) / 180;
    const ANG_END = (220 * Math.PI) / 180;

    // Profundidad
    const Z_BACK = -260;
    const Z_FRONT = 480; // delante del astro (20px) con margen

    // Timings
    const STAG = 0.14;
    const DUR = 0.68;
    const totalSpan = (cards.length - 1) * STAG + DUR;

    const vh = () => window.innerHeight || document.documentElement.clientHeight;

    function setSectionHeight() {
        const pinScroll = vh() * (2.8 + totalSpan * 3.8);
        const h = Math.max(vh() * 4.4, vh() + pinScroll);
        stageEl.style.height = `${Math.round(h)}px`;
    }
    setSectionHeight();

    // Astronauta anclado un poco en Z
    sticky.style.setProperty("--astroZ", "20px");

    let raf = 0;

    const update = () => {
        const y = window.scrollY || window.pageYOffset;
        const _vh = vh();

        const pinStart = pageTop(stageEl);
        const pinEnd = pinStart + stageEl.scrollHeight - _vh;

        // Entrada suave previa
        const preWindow = _vh * 0.65;
        const preStart = pinStart - preWindow;
        const preT = clamp01((y - preStart) / Math.max(1, pinStart - preStart));
        sticky.style.setProperty("--astroShift", `${(1 - preT) * 30}vh`);

        // Sticky activo
        const PIN_HOLD = _vh * 0.55;
        if (y > pinStart && y < pinEnd + PIN_HOLD) stageEl.classList.add("is-pinned");
        else stageEl.classList.remove("is-pinned");

        // Progreso en pin
        let p;
        if (y <= pinStart) p = 0;
        else if (y >= pinEnd + PIN_HOLD) p = 1;
        else p = (y - pinStart) / Math.max(1, pinEnd - pinStart);
        p = clamp01(p);

        // Tiempo “local” por card
        const s = p * totalSpan;

        // Gauss de foco en centro
        const sigma = 0.12;
        const focusGauss = (t) =>
            Math.exp(-Math.pow(t - 0.5, 2) / (2 * sigma * sigma));

        const FADE_IN = 0.08;
        const FADE_OUT_START = 0.7;
        const FADE_OUT_LEN = 0.28;

        // 1) Calculamos estado
        const state = cards.map((card, i) => {
            const inner = card.querySelector(".at-card3d__inner");
            const t0 = i * STAG;
            const lt = clamp01((s - t0) / DUR);
            const et = ease(lt);

            const ang = lerp(ANG_START, ANG_END, et);
            const xvw = Math.cos(ang) * RADIUS_X_VW + ORBIT_OFFSET_X_VW; // <- offset a la derecha
            const yvh = Math.sin(ang) * RADIUS_Y_VH;

            const zBase = lerp(Z_BACK, Z_FRONT, 0.5 - 0.5 * Math.cos(et * Math.PI));

            const focus = focusGauss(et);
            const blurMax = 6;
            const blur = (1 - focus) * blurMax;
            const sCard = 1 + 0.22 * focus;

            let o;
            if (lt <= 0) o = 0;
            else if (lt < FADE_IN) o = lt / FADE_IN;
            else if (lt > FADE_OUT_START)
                o = 1 - clamp01((lt - FADE_OUT_START) / FADE_OUT_LEN);
            else o = 1;

            return { i, card, inner, xvw, yvh, zBase, sCard, blur, o, et };
        });

        // 2) Encadenado de Z para que nunca se “cuelen”
        const DELTA_Z = 8;
        const zAdj = [];
        for (let i = 0; i < state.length; i++) {
            if (i === 0) zAdj[i] = state[i].zBase;
            else zAdj[i] = Math.min(state[i].zBase, zAdj[i - 1] - DELTA_Z);
        }

        // 3) Pintamos (JS fija el transform)
        state.forEach((st, i) => {
            const { card, inner, xvw, yvh, sCard, blur, o } = st;

            const transform = `translate(-50%, -50%) translate3d(${xvw.toFixed(
                3
            )}vw, ${yvh.toFixed(3)}vh, ${zAdj[i].toFixed(1)}px) scale(${sCard.toFixed(
                3
            )})`;
            card.style.transform = transform;

            inner.style.filter = `blur(${blur.toFixed(2)}px)`;
            inner.style.opacity = o.toFixed(3);
        });

        raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);

    const onResize = () => {
        setSectionHeight();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", onResize);
    };
}

const ArtToys = () => {
    const cardsStageRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        splitTitleChars();

        // Disparo inicial del primer héroe
        const first = document.querySelector(".at-hero");
        if (first) {
            first
                .querySelectorAll(".at-hero__title, .at-hero__lead")
                .forEach((el) => el.classList.add("is-in"));
            first.dataset.in = "1";
        }

        const cleanupHeroes = setupScrollActivator();
        const cleanupCards = setupCardsStage(cardsStageRef.current);

        return () => {
            cleanupHeroes && cleanupHeroes();
            cleanupCards && cleanupCards();
        };
    }, []);

    return (
        <main className="at">
            {/* HERO 1 */}
            <section className="at-hero">
                <header>
                    <h1 className="at-hero__title" data-split="chars">Art Toys</h1>
                    <p className="at-hero__lead">
                        Diseñamos y prototipamos figuras con acabados premium. Del boceto al toy de vitrina, sin ruido.
                    </p>
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Explorer Astronaut" />
                </div>
            </section>

            {/* HERO 2 */}
            <section className="at-hero at-hero--mirror at-hero--3d">
                <div className="at-hero__media">
                    <div className="at-hero__viewer">
                        <ModelViewer scale={1} offsetX={-0.2} offsetY={0.1} rotate />
                    </div>
                </div>
                <header>
                    <h2 className="at-hero__title at-fromRight" data-split="chars">Prototipo<br />3D</h2>
                    <p className="at-hero__lead at-fromRight">
                        Mostramos el modelo crudo en tiempo real: rotación suave, materiales neutros y rendimiento optimizado para web.
                    </p>
                </header>
            </section>

            {/* HERO 3 */}
            <section className="at-hero">
                <header>
                    <h2 className="at-hero__title" data-split="chars">Proceso<br />Premium</h2>
                    <p className="at-hero__lead">
                        Pipeline claro, texturas versátiles y entregas sin fricción para coleccionistas y marcas.
                    </p>
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Proceso / mock visual" />
                </div>
            </section>

            {/* ESCENA FINAL */}
            <section
                className="at-cardsStage"
                ref={cardsStageRef}
                aria-label="Showcase final"
                style={{ "--astroY": "58%" }}
            >
                <div className="at-cardsSticky">
                    <img className="at-astro" src={astronauta} alt="" aria-hidden="true" />

                    <div className="at-card3d" style={{ "--c": "#FDF7E7" }}>
                        <span>Modelado</span>
                    </div>
                    <div className="at-card3d" style={{ "--c": "#EAF3FF" }}>
                        <span>Impresión</span>
                    </div>
                    <div className="at-card3d" style={{ "--c": "#E9FFE9" }}>
                        <span>Pintura</span>
                    </div>
                    <div className="at-card3d" style={{ "--c": "#FBE9FF" }}>
                        <span>Acabado</span>
                    </div>
                    <div className="at-card3d" style={{ "--c": "#FFF0F0" }}>
                        <span>Packaging</span>
                    </div>
                </div>
            </section>
        </main>
    );
};

export { ArtToys };
