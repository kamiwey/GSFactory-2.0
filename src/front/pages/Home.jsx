import React, { useEffect, useRef, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import "../pages/styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";

export const Home = () => {
	const { dispatch } = useGlobalReducer();
	const videoRef = useRef(null);
	const heroRef = useRef(null);
	const [muted] = useState(true); // lo dejamos en mute fijo

	// (opcional) ping al backend del boilerplate
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

	// Autoplay robusto en silencio
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

	// Parallax: actualiza --parY en el contenedor hero
	useEffect(() => {
		const el = heroRef.current;
		if (!el) return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (!mq.matches) el.dataset.parallax = "on";

		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const rect = el.getBoundingClientRect();
				// cuánto hemos scrolleado desde la parte superior del hero
				const y = Math.max(0, -rect.top);
				el.style.setProperty("--parY", `${y}px`);
			});
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			cancelAnimationFrame(raf);
		};
	}, []);

	return (
		<main className="home">
			<section ref={heroRef} className="hero" aria-label="GS Factory hero">
				{/* Fondo vídeo */}
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
					<div className="hero__scrim" />
				</div>

				{/* Contenido */}
				<div className="hero__content">
					<h1 className="hero__title">GS Factory 2.0</h1>
					<p className="hero__subtitle">Diseño + 3D + Tecnología</p>
					<a className="btn btn--primary hero__cta" href="#cta">Empezar</a>
				</div>
			</section>

			{/* Resto de la página (placeholder para que haya scroll y se aprecie el parallax) */}
			<section className="section section--spacer">
				<h2>Sección siguiente</h2>
				<p>Contenido de ejemplo para probar el scroll y el parallax.</p>
			</section>
		</main>
	);
};
