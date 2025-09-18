import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";

/* IMÁGENES PANELS */
import artToysImg from "../assets/img/gsf_monkey_transparent.png";
import nfcImg from "../assets/img/nfc.png";
import tuftingImg from "../assets/img/tufting.png";
import merchandisingImg from "../assets/img/merchandising.png";
import colaboracionesImg from "../assets/img/colaboraciones.png";
import homeDecorImg from "../assets/img/home.png";

import HorizontalStrip from "../components/HorizontalStrip";
import ColorStage from "../components/ColorStage";
import { PALETTE_HOME } from "../theme/paletteHome";

export const Home = () => {
  const { t } = useTranslation("common");
  const { dispatch } = useGlobalReducer();
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const homeRef = useRef(null);

  // === Altura del rótulo ===
  const DESKTOP_Y = "clamp(-16rem, -24vh, -30rem)";
  const MOBILE_Y = "clamp(-10rem, -17vh, -23rem)";
  const [heroWordY, setHeroWordY] = useState(DESKTOP_Y);

  // Ping opcional backend (silencioso)
  useEffect(() => {
    const f = async () => {
      try {
        const url = import.meta.env.VITE_BACKEND_URL;
        if (!url) return;
        const r = await fetch(url + "/api/hello");
        const d = await r.json();
        if (r.ok) dispatch({ type: "set_hello", payload: d.message });
      } catch { }
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

  // Responsivo: Y del título
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setHeroWordY(mq.matches ? MOBILE_Y : DESKTOP_Y);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []); // eslint-disable-line

  // Aparición / desaparición del rótulo (IO con histeresis)
  useEffect(() => {
    const panels = Array.from(document.querySelectorAll(".panelHero"));
    if (!panels.length) return;

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const lastRatio = new WeakMap();

    const ENTER_R0 = 0.22, ENTER_R1 = 0.68;
    const LEAVE_R0 = 0.58, LEAVE_R1 = 1;
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const r = e.intersectionRatio;
          const prev = lastRatio.get(e.target) ?? r;
          const leaving = r < prev - 0.0005;
          const r0 = leaving ? LEAVE_R0 : ENTER_R0;
          const r1 = leaving ? LEAVE_R1 : ENTER_R1;
          const vis = clamp01((r - r0) / (r1 - r0));
          e.target.style.setProperty("--wordVis", vis.toFixed(3));
          e.target.style.setProperty("--wordOut", (1 - vis).toFixed(3));
          lastRatio.set(e.target, r);
        });
      },
      { threshold: thresholds }
    );

    panels.forEach((el) => {
      lastRatio.set(el, 0);
      io.observe(el);
    });
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
          {/* PANEL 1 — ART TOYS */}
          <div className="hstrip__panel" key="p1">
            <section className="panel panel--hero" aria-label="ART TOYS">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">
                  {t("hero.artToys")}
                </h2>

                <Link
                  to="/art-toys"
                  className="panelHero__cta"
                  aria-label="Ir a ART TOYS"
                >
                  <img
                    className="panelHero__img"
                    src={artToysImg}
                    alt="Art toy mono — GS Factory"
                    loading="eager"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>

          {/* PANEL 2 — NFC */}
          <div className="hstrip__panel" key="p2">
            <section className="panel panel--hero" aria-label="NFC">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">NFC</h2>

                <Link
                  to="/nfc"
                  className="panelHero__cta"
                  aria-label="Ir a NFC"
                >
                  <img
                    className="panelHero__img"
                    src={nfcImg}
                    alt="Token NFC — GS Factory"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>

          {/* PANEL 3 — TUFTING */}
          <div className="hstrip__panel" key="p3">
            <section className="panel panel--hero" aria-label="TUFTING">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">TUFTING</h2>

                <Link
                  to="/tufting"
                  className="panelHero__cta"
                  aria-label="Ir a TUFTING"
                >
                  <img
                    className="panelHero__img"
                    src={tuftingImg}
                    alt="Alfombra tufting — GS Factory"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>

          {/* PANEL 4 — MERCHANDISING */}
          <div className="hstrip__panel" key="p4">
            <section className="panel panel--hero" aria-label="MERCHANDISING">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">MERCHANDISING</h2>

                <Link
                  to="/merchandising"
                  className="panelHero__cta"
                  aria-label="Ir a MERCHANDISING"
                >
                  <img
                    className="panelHero__img"
                    src={merchandisingImg}
                    alt="Caja GS Merch + objetos — GS Factory"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>

          {/* PANEL 5 — COLABORACIONES */}
          <div className="hstrip__panel" key="p5">
            <section className="panel panel--hero" aria-label="COLABORACIONES">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">COLABORACIONES</h2>

                <Link
                  to="/colaboraciones"
                  className="panelHero__cta"
                  aria-label="Ir a COLABORACIONES"
                >
                  <img
                    className="panelHero__img"
                    src={colaboracionesImg}
                    alt="Pack colaboraciones — GS Factory"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>

          {/* PANEL 6 — HOME */}
          <div className="hstrip__panel" key="p6">
            <section className="panel panel--hero" aria-label="HOME">
              <div className="panelHero" style={{ "--heroWordY": heroWordY }}>
                <h2 className="panelHero__word" aria-hidden="true">HOME</h2>

                <Link
                  to="/gs-home"
                  className="panelHero__cta"
                  aria-label="Ir a GS HOME"
                >
                  <img
                    className="panelHero__img"
                    src={homeDecorImg}
                    alt="Decoración hogar GS — GS Factory"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            </section>
          </div>
        </HorizontalStrip>

        {/* Bloque vertical 7–8 (igual que antes) */}
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
