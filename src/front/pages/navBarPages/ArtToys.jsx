import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/art-toys.css";

import astronauta from "../../assets/img/gsf_monkey_transparent.png";
import ModelViewer from "../../components/ModelViewer";

/* ========= Split simple ========= */
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
        el.setAttribute("aria-label", el.textContent);
        el.textContent = "";
        el.appendChild(frag);
        el.classList.add("at-split");
        el.dataset.splitDone = "true";
    });
}

/* ========= Activación por scroll (centro de panel) ========= */
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
        s.querySelectorAll(".at-hero__title, .at-hero__lead").forEach((el) => el.classList.add("is-in"));
    };
    const check = () => {
        sections.forEach((s) => {
            if (s.dataset.in === "1") return;
            if (sectionCenterIsInViewport(s, 0.35)) markIn(s);
        });
        ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
    };
}

/* ========= Utils ========= */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const pageTop = (el) => el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);

/* ========= Escena final: pin FIXED + foco + salida limpia ========= */
function setupCardsStage(stageEl) {
    if (!stageEl) return () => { };
    const sticky = stageEl.querySelector(".at-cardsSticky");
    const cards = Array.from(stageEl.querySelectorAll(".at-card3d"));
    if (!sticky || !cards.length) return () => { };

    /* Core params */
    const RADIUS_X_VW = 38;
    const RADIUS_Y_VH = 10;
    const ANG_START = (-40 * Math.PI) / 180;
    const ANG_END = (220 * Math.PI) / 180;

    const Z_BACK = -260;
    const Z_FRONT = 160;

    const STAG = 0.14;   // separación entre tarjetas
    const DUR = 0.68;   // duración por tarjeta

    const vh = () => window.innerHeight || document.documentElement.clientHeight;

    /* Altura del tramo (pin) amplia para que las cards desaparezcan con aire */
    function setSectionHeight() {
        const totalTimeline = (cards.length - 1) * STAG + DUR; // unidades lógicas
        const pinScroll = vh() * (2.2 + totalTimeline * 3.0);  // <- alargado
        const h = Math.max(vh() * 3.6, vh() + pinScroll);
        stageEl.style.height = `${Math.round(h)}px`;
    }
    setSectionHeight();

    let raf = 0;

    const update = () => {
        const y = window.scrollY || window.pageYOffset;
        const _vh = vh();

        const pinStart = pageTop(stageEl);
        const pinEnd = pinStart + stageEl.scrollHeight - _vh;

        /* Pre-pin: parallax desde abajo */
        const preWindow = _vh * 0.65;
        const preStart = pinStart - preWindow;
        const preT = clamp01((y - preStart) / Math.max(1, (pinStart - preStart)));
        sticky.style.setProperty("--astroShift", `${(1 - preT) * 30}vh`);

        /* Pin fijo */
        const PIN_HOLD = _vh * 0.40; // mantiene astronauta visible al final
        if (y > pinStart && y < (pinEnd + PIN_HOLD)) stageEl.classList.add("is-pinned");
        else stageEl.classList.remove("is-pinned");

        /* Progreso p (0..1). Durante el hold final se congela en 1 */
        let p;
        if (y <= pinStart) p = 0;
        else if (y >= (pinEnd + PIN_HOLD)) p = 1;
        else p = clamp01((y - pinStart) / Math.max(1, (pinEnd - pinStart)));
        sticky.style.setProperty("--t", p.toFixed(4));

        /* Foco frontal y salida con desvanecimiento */
        const sigma = 0.12;                                // foco alrededor del centro
        const focusGauss = (t) => Math.exp(-Math.pow(t - 0.5, 2) / (2 * sigma * sigma));
        const FADE_IN = 0.08;
        const FADE_OUT_START = 0.74;                       // empieza a desaparecer antes de irse
        const FADE_OUT_LEN = 0.22;                         // llega a 0 antes de 1.0

        cards.forEach((card, i) => {
            const t0 = i * STAG;
            const t1 = t0 + DUR;
            const lt = clamp01((p - t0) / (t1 - t0));        // local 0..1 por tarjeta
            const et = ease(lt);

            // Órbita
            const ang = lerp(ANG_START, ANG_END, et);
            const xvw = Math.cos(ang) * RADIUS_X_VW;
            const yvh = Math.sin(ang) * RADIUS_Y_VH;

            // Profundidad + foco
            const zBase = lerp(Z_BACK, Z_FRONT, 0.5 - 0.5 * Math.cos(et * Math.PI));
            const focus = focusGauss(et);
            const blurMax = 6;
            const blur = (1 - focus) * blurMax;

            // Escala en el centro para lectura
            const s = 1 + 0.22 * focus;

            // Opacidad: fade-in al principio + fade-out al final (salida limpia, nada se acumula)
            let o;
            if (lt <= 0) o = 0;
            else if (lt < FADE_IN) o = lt / FADE_IN;
            else if (lt > FADE_OUT_START) {
                o = 1 - clamp01((lt - FADE_OUT_START) / FADE_OUT_LEN);
            } else o = 1;

            card.style.setProperty("--xvw", xvw.toFixed(3));
            card.style.setProperty("--yvh", yvh.toFixed(3));
            card.style.setProperty("--z", `${zBase.toFixed(1)}px`);
            card.style.setProperty("--s", s.toFixed(3));
            card.style.setProperty("--o", o.toFixed(3));
            card.style.filter = `blur(${blur.toFixed(2)}px)`;
        });

        raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => { setSectionHeight(); update(); }, { passive: true });

    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
    };
}

const ArtToys = () => {
    const cardsStageRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        splitTitleChars();

        const first = document.querySelector(".at-hero");
        if (first) {
            first.querySelectorAll(".at-hero__title, .at-hero__lead").forEach((el) => el.classList.add("is-in"));
            first.dataset.in = "1";
        }

        const cleanupHeroes = setupScrollActivator();
        const cleanupCards = setupCardsStage(cardsStageRef.current);
        return () => { cleanupHeroes && cleanupHeroes(); cleanupCards && cleanupCards(); };
    }, []);

    return (
        <main className="at">
            {/* HERO 1 */}
            <section className="at-hero">
                <header>
                    <h1 className="at-hero__title" data-split="chars">Art Toys</h1>
                    <p className="at-hero__lead">Diseñamos y prototipamos figuras con acabados premium. Del boceto al toy de vitrina, sin ruido.</p>
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Explorer Astronaut" />
                </div>
            </section>

            {/* HERO 2 */}
            <section className="at-hero at-hero--mirror at-hero--3d">
                <div className="at-hero__media">
                    <div className="at-hero__viewer">
                        <ModelViewer scale={1} offsetX={-0.2} offsetY={0.1} rotate={true} />
                    </div>
                </div>
                <header>
                    <h2 className="at-hero__title at-fromRight" data-split="chars">Prototipo<br />3D</h2>
                    <p className="at-hero__lead at-fromRight">Mostramos el modelo crudo en tiempo real: rotación suave, materiales neutros y rendimiento optimizado para web.</p>
                </header>
            </section>

            {/* HERO 3 */}
            <section className="at-hero">
                <header>
                    <h2 className="at-hero__title" data-split="chars">Proceso<br />Premium</h2>
                    <p className="at-hero__lead">Pipeline claro, texturas versátiles y entregas sin fricción para coleccionistas y marcas.</p>
                </header>
                <div className="at-hero__media">
                    <img className="at-hero__img" src={astronauta} alt="Proceso / mock visual" />
                </div>
            </section>

            {/* FINAL: pin fijo + cards (foco central + salida fade) */}
            <section
                className="at-cardsStage"
                ref={cardsStageRef}
                aria-label="Showcase final"
                style={{ "--astroY": "58%" }}
            >
                <div className="at-cardsSticky">
                    <img className="at-astro" src={astronauta} alt="" aria-hidden="true" />
                    <div className="at-card3d" style={{ "--c": "#FDF7E7" }}><span>Modelado</span></div>
                    <div className="at-card3d" style={{ "--c": "#EAF3FF" }}><span>Impresión</span></div>
                    <div className="at-card3d" style={{ "--c": "#E9FFE9" }}><span>Pintura</span></div>
                    <div className="at-card3d" style={{ "--c": "#FBE9FF" }}><span>Acabado</span></div>
                    <div className="at-card3d" style={{ "--c": "#FFF0F0" }}><span>Packaging</span></div>
                </div>
            </section>
        </main>
    );
};

export { ArtToys };
