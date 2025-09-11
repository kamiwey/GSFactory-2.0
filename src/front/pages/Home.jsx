import React, { useEffect, useRef } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "./styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";

import HorizontalStrip from "../components/HorizontalStrip";
import ColorStage from "../components/ColorStage";

// Paleta (6 secciones; top/bottom para un degradado sutil)
const PALETTE = [
	{ top: "#4a86d9", bottom: "#0f3f86" }, // 1 Azul
	{ top: "#2aa0a0", bottom: "#1f7073" }, // 2 Verde azulado
	{ top: "#39a84e", bottom: "#2b6f39" }, // 3 Verde
	{ top: "#5240c9", bottom: "#2d1f90" }, // 4 Morado
	{ top: "#bb8d43", bottom: "#9c702f" }, // 5 Ocre
	{ top: "#cf4e50", bottom: "#a43a3c" }, // 6 Rojo
];

export const Home = () => {
	const { dispatch } = useGlobalReducer();
	const videoRef = useRef(null);
	const heroRef = useRef(null);
	const homeRef = useRef(null);

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

	// Autoplay robusto
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
		const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			cancelAnimationFrame(raf);
		};
	}, []);

	// Flecha: bajar desde el hero
	const scrollDown = (e) => {
		e.preventDefault();
		const heroEl = heroRef.current;
		if (!heroEl) return;

		const navH = parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue("--nav-h")
		) || 72;

		const target = heroEl.getBoundingClientRect().bottom + window.scrollY - (navH + 8);
		window.scrollTo({ top: Math.max(0, Math.round(target)), left: 0, behavior: "smooth" });
	};

	const scrollToTop = (e) => {
		e?.preventDefault?.();
		const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		window.scrollTo({ top: 0, left: 0, behavior: prefersReduce ? "auto" : "smooth" });
	};

	return (
		<main ref={homeRef} className="home">
			{/* ================= HERO ================= */}
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

					<a className="hero__arrow" href="#next" aria-label="Bajar" onClick={scrollDown}>
						<svg viewBox="0 0 24 24" className="hero__arrowIcon" aria-hidden="true">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</a>
				</div>
			</section>

			{/* ======= FONDO DE COLOR + TRAMO HORIZONTAL ======= */}
			<ColorStage colors={PALETTE}>
				<HorizontalStrip panels={6} navbarHeight={72} />
			</ColorStage>

			{/* (lo demás de tu Home se mantiene tal cual) */}
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

			{/* Botón subir */}
			<button className="homeTopBtn" onClick={scrollToTop} aria-label="Volver arriba">
				<svg viewBox="0 0 24 24" className="homeTopBtn__icon" aria-hidden="true">
					<path d="M6 15l6-6 6 6" />
				</svg>
			</button>
		</main>
	);
};
