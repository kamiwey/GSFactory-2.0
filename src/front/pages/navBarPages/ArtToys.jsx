import React, { useEffect, useRef } from "react";
import "../styles/art-toys.css";
import useLenis from "../../hooks/useLenis";

import astronauta from "../../assets/img/gsf_monkey_transparent.png";
import ModelViewer from "../../components/ModelViewer";

/* ===== Split chars ===== */
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

/* ===== Activación por scroll (centro del panel) ===== */
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

/* ===== Utils ===== */
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const pageTop = (el) =>
    el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);

/* ===== Stage final optimizado ===== */
function setupCardsStage(stageEl) {
    if (!stageEl) return () => { };
    const sticky = stageEl.querySelector(".at-cardsSticky");
    const cards = Array.from(stageEl.querySelectorAll(".at-card3d"));
    if (!sticky || cards.length === 0) return () => { };

    // Cache inner refs SOLO una vez
    const entries = cards.map((card) => {
        let inner = card.querySelector(".at-card3d__inner");
        if (!inner) {
            inner = document.createElement("div");
            inner.className = "at-card3d__inner";
            while (card.firstChild) inner.appendChild(card.firstChild);
            card.appendChild(inner);
        }
        return { card, inner };
    });

    // Órbita: mantenemos parámetros (con offset a la derecha si lo pusiste)
    const RADIUS_X_VW = 38;
    const RADIUS_Y_VH = 10;
    const ORBIT_OFFSET_X_VW = 16; // tu offset actual a la derecha
    const ANG_START = (-40 * Math.PI) / 180;
    const ANG_END = (220 * Math.PI) / 180;

    // Profundidad
    const Z_BACK = -260;
    const Z_FRONT = 480;

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

    sticky.style.setProperty("--astroZ", "20px");

    // IO para arrancar/parar RAF
    let visible = false;
    const io = new IntersectionObserver(
        (obs) => {
            visible = obs.some((e) => e.isIntersecting);
            if (visible && !raf) raf = requestAnimationFrame(update);
        },
        { root: null, threshold: 0.01 }
    );
    io.observe(stageEl);

    let raf = 0;
    let lastScrollY = -1;

    // --- Parámetros del “no-blur window” (nuevo) ---
    const DEAD_ZONE = 0.10; // +/- 0.10 alrededor del centro sin blur (ligeramente más largo)
    const RAMP = 0.18;      // rampa suave después de la dead-zone

    const update = () => {
        // Early exit si no es visible
        if (!visible) {
            raf = 0;
            return;
        }

        const y = window.scrollY || window.pageYOffset;
        if (y === lastScrollY) {
            // No avances si no hay cambio real de scroll
            raf = requestAnimationFrame(update);
            return;
        }
        lastScrollY = y;

        const _vh = vh();
        const pinStart = pageTop(stageEl);
        const pinEnd = pinStart + stageEl.scrollHeight - _vh;

        // Pre-entrada del astro (ligera)
        const preWindow = _vh * 0.65;
        const preStart = pinStart - preWindow;
        const preT = clamp01((y - preStart) / Math.max(1, pinStart - preStart));
        sticky.style.setProperty("--astroShift", `${(1 - preT) * 30}vh`);

        // Estado "pinned"
        const PIN_HOLD = _vh * 0.55;
        const pinned = y > pinStart && y < pinEnd + PIN_HOLD;
        if (pinned) stageEl.classList.add("is-pinned");
        else stageEl.classList.remove("is-pinned");

        // Progreso dentro del pin
        let p;
        if (y <= pinStart) p = 0;
        else if (y >= pinEnd + PIN_HOLD) p = 1;
        else p = (y - pinStart) / Math.max(1, pinEnd - pinStart);
        p = clamp01(p);

        const s = p * totalSpan;

        // Foco gauss (más nítido cerca del centro)
        const sigma = 0.12;
        const focusGauss = (t) =>
            Math.exp(-Math.pow(t - 0.5, 2) / (2 * sigma * sigma));

        const FADE_IN = 0.08;
        const FADE_OUT_START = 0.7;
        const FADE_OUT_LEN = 0.28;

        // Precalcular una vez
        const cos = Math.cos;
        const sin = Math.sin;
        const PI = Math.PI;

        const state = entries.map(({ card, inner }, i) => {
            const t0 = i * STAG;
            const lt = clamp01((s - t0) / DUR);
            const et = lt * lt * (3 - 2 * lt); // ease inline (evita closure)

            const ang = ANG_START + (ANG_END - ANG_START) * et;
            const xvw = ORBIT_OFFSET_X_VW + cos(ang) * RADIUS_X_VW;
            const yvh = sin(ang) * RADIUS_Y_VH;

            const zBase = Z_BACK + (Z_FRONT - Z_BACK) * (0.5 - 0.5 * cos(et * PI));

            const focus = focusGauss(et);
            const scrolling = document.body.classList.contains("is-scrolling");
            const blurMax = scrolling ? 3.2 : 4.2;

            // ====== BLOQUE CLAVE: prolongar “no blur” sin tocar lo demás ======
            // Base de blur
            const baseBlur = (1 - focus) * blurMax;
            // Distancia al centro del recorrido (0 en centro, 0.5 max a extremos)
            const dist = Math.abs(et - 0.5);
            // Factor 0 en la “dead-zone”, sube linealmente en la rampa y se satura a 1
            let k;
            if (dist <= DEAD_ZONE) k = 0;
            else k = Math.min(1, (dist - DEAD_ZONE) / RAMP);

            const blur = baseBlur * k;
            // ================================================================

            const scale = 1 + 0.22 * focus;

            let o;
            if (lt <= 0) o = 0;
            else if (lt < FADE_IN) o = lt / FADE_IN;
            else if (lt > FADE_OUT_START)
                o = 1 - clamp01((lt - FADE_OUT_START) / FADE_OUT_LEN);
            else o = 1;

            return { card, inner, xvw, yvh, zBase, scale, blur, o };
        });

        // Encadenado Z (i detrás de i-1)
        const DELTA_Z = 8;
        for (let i = 1; i < state.length; i++) {
            state[i].zBase = Math.min(state[i].zBase, state[i - 1].zBase - DELTA_Z);
        }

        // Pintar (un único transform)
        for (let i = 0; i < state.length; i++) {
            const { card, inner, xvw, yvh, zBase, scale, blur, o } = state[i];
            card.style.transform =
                `translate(-50%, -50%) translate3d(${xvw.toFixed(2)}vw, ${yvh.toFixed(2)}vh, ${zBase.toFixed(1)}px) scale(${scale.toFixed(3)})`;
            inner.style.opacity = o.toFixed(3);
            if (blur < 0.25) {
                inner.style.filter = "none";
            } else {
                inner.style.filter = `blur(${blur.toFixed(2)}px)`;
            }
        }

        raf = requestAnimationFrame(update);
    };

    const onResize = () => {
        setSectionHeight();
        // Forzamos un frame posterior
        if (!raf && visible) raf = requestAnimationFrame(update);
    };

    window.addEventListener("resize", onResize, { passive: true });

    // Arranque condicional
    if (!raf) raf = requestAnimationFrame(update);

    return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        io.disconnect();
    };
}

const ArtToys = () => {
    useLenis({ lerp: 0.16, wheelMultiplier: 1.1, enableOnTouch: false });

    const cardsStageRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        splitTitleChars();

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
