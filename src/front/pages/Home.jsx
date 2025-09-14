import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";
import monoImg from "../assets/img/gsf_monkey_transparent.png";

import HorizontalStrip from "../components/HorizontalStrip";
import ColorStage from "../components/ColorStage";
import { PALETTE_HOME } from "../theme/paletteHome";

export const Home = () => {
  const { t } = useTranslation("common");
  const { dispatch } = useGlobalReducer();
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const homeRef = useRef(null);

  // === Ajuste fino de la altura del rótulo (más arriba que antes) ===
  // Sube/baja cambiando estos clamps (más negativo = más arriba).
  const DESKTOP_Y = "clamp(-16rem, -24vh, -30rem)";
  const MOBILE_Y = "clamp(-10rem, -17vh, -23rem)";

  const [heroWordY, setHeroWordY] = useState(DESKTOP_Y);

  // Ping opcional al backend de ejemplo (si no hay backend, ignora el error)
  useEffect(() => {
    const f = async () => {
      try {
        const url = import.meta.env.VITE_BACKEND_URL;
        if (!url) return;
        const r = await fetch(url + "/api/hello");
        const d = await r.json();
        if (r.ok) dispatch({ type: "set_hello", payload: d.message });
      } catch {
        // sin backend => sin bloqueos
      }
    };
    f();
  }, [dispatch]);

  // Autoplay robusto del vídeo
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const tryPlay = () => {
      vid.muted = true;
      const p = vid.play();
      if (p && typeof p.then === "function") p.catch(() => { });
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) {
        vid.pause();
        vid.removeAttribute("autoplay");
        vid.currentTime = 0;
      } else {
        tryPlay();
      }
    };
    apply();
    vid.addEventListener("loadeddata", tryPlay, { once: true });
    mq.addEventListener?.("change", apply);
    return () => {
      vid.removeEventListener("loadeddata", tryPlay);
      mq.removeEventListener?.("change", apply);
    };
  }, []);

  // Parallax del hero (publica --parY y --p)
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const h = Math.max(1, rect.height);
      const y = Math.max(0, -rect.top);
      const range = h * 0.45;
      const p = Math.max(0, Math.min(1, y / range));
      el.style.setProperty("--parY", `${y}px`);
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Responsivo: Y del título en móviles/desktop
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setHeroWordY(mq.matches ? MOBILE_Y : DESKTOP_Y);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []); // eslint-disable-line

  // === Aparición / desaparición del rótulo por foco de panel (IO) ===
  // Con HorizontalStrip, lo que cambia es la intersección horizontal.
  // IO nos da un ratio 0..1; lo mapeamos a visibilidad/zoom de las letras.
  useEffect(() => {
    const panels = Array.from(document.querySelectorAll(".panelHero"));
    if (!panels.length) return;

    const thresholds = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // mapeo: visible al 100% cuando ratio>=0.7; oculta cuando <=0.3
          const r = e.intersectionRatio;
          const vis = Math.max(0, Math.min(1, (r - 0.3) / 0.4)); // 0.3→0, 0.7→1
          e.target.style.setProperty("--wordVis", vis.toFixed(3));
          e.target.style.setProperty("--wordOut", (1 - vis).toFixed(3));
        });
      },
      { threshold: thresholds }
    );

    panels.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Flecha: bajar desde el hero
  const scrollDown = (e) => {
    e.preventDefault();
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const navH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--nav-h")
      ) || 72;

    const target =
      heroEl.getBoundingClientRect().bottom + window.scrollY - (navH + 8);
    window.scrollTo({
      top: Math.max(0, Math.round(target)),
      left: 0,
      behavior: "smooth",
    });
  };

  const scrollToTop = (e) => {
    e?.preventDefault?.();
    const prefersReduce = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReduce ? "auto" : "smooth",
    });
  };

  return (
    <main ref={homeRef} className="home">
      {/* HERO */}
      <section ref={heroRef} className="hero" aria-label="GS Factory hero">
        <div className="hero__bg" aria-hidden="true">
          <video
            ref={videoRef}
            className="hero__video"
            src={heroVideo}
            autoPlay
            loop
            playsInline
            preload="auto"
            muted
          />
          <div className="hero__fadeBottom" />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">GS FACTORY</h1>
          <p className="hero__subtitle">DISEÑO + 3D + TECNOLOGÍA</p>

          <a
            className="hero__arrow"
            href="#next"
            aria-label={t("hero.scrollDown")}
            onClick={scrollDown}
          >
            <svg viewBox="0 0 24 24" className="hero__arrowIcon" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </section>

      {/* COLOR + HORIZONTAL + VERTICAL */}
      <ColorStage colors={PALETTE_HOME}>
        <HorizontalStrip panels={6} navbarHeight={72}>
          {/* PANEL 1 */}
          <div className="hstrip__panel" key="p1">
            <section className="panel panel--hero" aria-label="ART TOYS">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                {/* Rótulo gigante detrás */}
                <h2 className="panelHero__word" aria-hidden="true">
                  {t("hero.artToys")}
                </h2>

                {/* Imagen botón (modal más adelante) */}
                <button
                  type="button"
                  className="panelHero__cta"
                  aria-label="Abrir ART TOYS"
                >
                  <img
                    className="panelHero__img"
                    src={monoImg}
                    alt="Figura mono astronauta — GS Factory"
                    loading="eager"
                    decoding="async"
                  />
                </button>
              </div>
            </section>
          </div>

          {/* PANEL 2..6 (placeholders) */}
          <div className="hstrip__panel" key="p2">
            <div className="hstrip__panelInner">
              <div className="hstrip__title">Panel 2</div>
              <p className="hstrip__text">Contenido de muestra horizontal.</p>
            </div>
          </div>

          <div className="hstrip__panel" key="p3">
            <div className="hstrip__panelInner">
              <div className="hstrip__title">Panel 3</div>
              <p className="hstrip__text">Contenido de muestra horizontal.</p>
            </div>
          </div>

          <div className="hstrip__panel" key="p4">
            <div className="hstrip__panelInner">
              <div className="hstrip__title">Panel 4</div>
              <p className="hstrip__text">Contenido de muestra horizontal.</p>
            </div>
          </div>

          <div className="hstrip__panel" key="p5">
            <div className="hstrip__panelInner">
              <div className="hstrip__title">Panel 5</div>
              <p className="hstrip__text">Contenido de muestra horizontal.</p>
            </div>
          </div>

          <div className="hstrip__panel" key="p6">
            <div className="hstrip__panelInner">
              <div className="hstrip__title">Panel 6</div>
              <p className="hstrip__text">Contenido de muestra horizontal.</p>
            </div>
          </div>
        </HorizontalStrip>

        {/* 7 y 8 en vertical */}
        <section className="vstack" aria-label="Bloque vertical tras horizontal">
          <div className="vpanel">
            <div className="vpanel__inner">
              <h2 className="vpanel__title">Panel 7</h2>
              <p className="vpanel__text">Contenido de muestra vertical.</p>
            </div>
          </div>
          <div className="vpanel vpanel--last">
            <div className="vpanel__inner">
              <h2 className="vpanel__title">Panel 8</h2>
              <p className="vpanel__text">Contenido de muestra vertical.</p>
            </div>
          </div>
        </section>
      </ColorStage>

      {/* Botón subir */}
      <button className="homeTopBtn" onClick={scrollToTop} aria-label={t("hero.backToTop")}>
        <svg viewBox="0 0 24 24" className="homeTopBtn__icon" aria-hidden="true">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
    </main>
  );
};
