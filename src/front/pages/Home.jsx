import React, { useEffect, useRef } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import "../pages/styles/home.css";
import heroVideo from "../assets/video/hero-video.mp4";

export const Home = () => {
	const { dispatch } = useGlobalReducer();
	const videoRef = useRef(null);
	const heroRef = useRef(null);
	const nextRef = useRef(null);

	// ping opcional al backend
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

	// autoplay robusto (mute)
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

	// medir la altura del bloque "pineado" para encajarlo al soltar
	useEffect(() => {
		const sec = nextRef.current;
		if (!sec) return;
		const pin = sec.querySelector(".section__pin");
		if (!pin) return;

		const setH = () => {
			const h = pin.getBoundingClientRect().height;
			sec.style.setProperty("--pinHeight", `${h}px`);
		};
		setH();

		const ro = new ResizeObserver(setH);
		ro.observe(pin);
		window.addEventListener("resize", setH);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", setH);
		};
	}, []);

	// parallax del hero + estado de pinning de la siguiente sección
	useEffect(() => {
		const heroEl = heroRef.current;
		const nextEl = nextRef.current;
		if (!heroEl || !nextEl) return;

		const FADE_DIST = 160; // px para desvanecer el subtítulo

		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const rect = heroEl.getBoundingClientRect();
				const h = Math.max(1, rect.height);
				const y = Math.max(0, -rect.top);           // desplazamiento del hero
				const p = Math.max(0, Math.min(1, y / h));  // progreso 0..1

				// variables para el parallax existente
				heroEl.style.setProperty("--parY", `${y}px`);
				heroEl.style.setProperty("--p", String(Math.min(1, y / FADE_DIST)));

				// pin activo entre 0<p<1
				nextEl.classList.toggle("pinning", p > 0 && p < 1);
				nextEl.classList.toggle("done", p >= 1); // al terminar el hero
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

	// flecha: baja exactamente hasta el final del hero (sin cortina)
	const onArrowClick = (e) => {
		e.preventDefault();
		const heroEl = heroRef.current;
		if (!heroEl) return;
		const target = heroEl.getBoundingClientRect().bottom + window.scrollY;
		window.scrollTo({ top: target, behavior: "smooth" });
	};

	return (
		<main className="home">
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

					<a className="hero__arrow" href="#next" aria-label="Bajar" onClick={onArrowClick}>
						<svg viewBox="0 0 24 24" className="hero__arrowIcon" aria-hidden="true">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</a>
				</div>
			</section>

			{/* Sección siguiente: aparece al empezar a scrollear, se queda a la misma altura y se suelta al final */}
			<section id="next" ref={nextRef} className="section section--spacer">
				<div className="section__pin">
					<h2>Sección siguiente</h2>
					<p>Placeholder para probar el scroll, el difuminado y el parallax.</p>
				</div>
			</section>
		</main>
	);
};
