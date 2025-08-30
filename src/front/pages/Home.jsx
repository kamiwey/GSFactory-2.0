import React, { useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import "../pages/styles/home.css";

export const Home = () => {

	const { store, dispatch } = useGlobalReducer()

	const loadMessage = async () => {
		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL

			if (!backendUrl) throw new Error("VITE_BACKEND_URL is not defined in .env file")

			const response = await fetch(backendUrl + "/api/hello")
			const data = await response.json()

			if (response.ok) dispatch({ type: "set_hello", payload: data.message })

			return data

		} catch (error) {
			if (error.message) throw new Error(
				`Could not fetch the message from the backend.
				Please check if the backend is running and the backend port is public.`
			);
		}

	}

	useEffect(() => {
		loadMessage()
	}, [])

	return (
		<main className="home">
			<section className="hero">
				<div className="hero__inner">
					<h1 className="hero__title">GS Factory 2.0</h1>
					<p className="hero__subtitle">Diseño + 3D + Tecnología</p>
					<a className="btn btn--primary" href="#cta">Empezar</a>
				</div>
			</section>

			<section className="reel" aria-label="Muestra visual">
				<div className="reel__track">
					{/* aquí insertaremos imágenes/cards luego */}
				</div>
			</section>

			<section id="cta" className="cta">
				<h2 className="cta__title">Proyectos a medida</h2>
				<p className="cta__text">Merch 3D, art toys y NFC con sabor premium.</p>
				<button className="btn btn--ghost">Contactar</button>
			</section>

			<footer className="footer">
				<p className="footer__copy">© GS Factory 2025</p>
			</footer>
		</main>
	);
}; 