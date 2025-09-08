import React, { useEffect, useRef } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import "../pages/styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";

import HorizontalStrip from "../components/HorizontalStrip";

export const Home = () => {
	const { dispatch } = useGlobalReducer();
	const videoRef = useRef(null);
	const heroRef = useRef(null);

	// (Opcional) ping al backend del boilerplate
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

	// Autoplay robusto (vídeo en mute)
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

	// Parallax clamp del hero — PUBLICA --parY y --p
	useEffect(() => {
		const el = heroRef.current;
		if (!el) return;
		let raf = 0;
		const update = () => {
			const rect = el.getBoundingClientRect();
			const h = Math.max(1, rect.height);
			const y = Math.max(0, -rect.top);        // desplazamiento consumido dentro del hero
			const range = h * 0.45;                   // ~45% del alto del hero
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

	const scrollDown = (e) => {
		e.preventDefault();
		const heroEl = heroRef.current;
		if (!heroEl) return;

		// Altura de navbar desde la CSS var si existe (fallback 72)
		const navH = parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue("--nav-h")
		) || 72;

		// Destino: justo tras el hero, restando navbar y un pequeño respiro
		const target = heroEl.getBoundingClientRect().bottom + window.scrollY - (navH + 8);

		// 🔒 Bloquea X: fuerza left=0 para que no haya deriva lateral
		window.scrollTo({
			top: Math.max(0, Math.round(target)),
			left: 0,
			behavior: "smooth",
		});
	};



	// ⬆️ Botón “volver arriba” (siempre visible en Home)
	const scrollToTop = (e) => {
		e?.preventDefault?.();
		const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		window.scrollTo({ top: 0, left: 0, behavior: prefersReduce ? "auto" : "smooth" });
	};

	return (
		<main className="home">
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

					{/* Flecha hacia la sección siguiente */}
					<a className="hero__arrow" href="#next" aria-label="Bajar" onClick={scrollDown}>
						<svg viewBox="0 0 24 24" className="hero__arrowIcon" aria-hidden="true">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</a>
				</div>
			</section>

			{/* ============== HORIZONTAL PINNED (6 paneles) ============== */}
			<HorizontalStrip panels={6} navbarHeight={72} />

			{/* ============== DOS PANELES VERTICALES FULLSCREEN ============== */}
			<section className="vstack" aria-label="Bloque vertical tras horizontal">
				<div className="vpanel">
					<div className="vpanel__inner">
						<h2 className="vpanel__title">Panel 7</h2>
						<p className="vpanel__text">
							Primer panel vertical justo después del tramo horizontal. Ocupa toda la altura visible.
						</p>
					</div>
				</div>
				<div className="vpanel vpanel--last">
					<div className="vpanel__inner">
						<h2 className="vpanel__title">Panel 8</h2>
						<p className="vpanel__text">
							Segundo panel vertical a pantalla completa antes de volver al flujo normal.
						</p>
					</div>
				</div>
			</section>

			{/* ============== SECCIÓN NORMAL (tu contenido real) ============== */}
			<section id="next" className="section section--spacer">
				<h2>Sección siguiente (vertical)</h2>
				<p>
					Tras el horizontal pinneado y los dos paneles verticales, el documento vuelve al flujo
					vertical normal hasta el footer.
				</p>
			</section>

			{/* ⬅️ Botón fijo inferior-izquierda (volver arriba) */}
			<button className="homeTopBtn" aria-label="Volver arriba" onClick={scrollToTop}>
				<svg viewBox="0 0 24 24" className="homeTopBtn__icon" aria-hidden="true">
					<path d="M6 15l6-6 6 6" />
				</svg>
			</button>
		</main>
	);
};
