import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
// import logo from "../assets/brand/logo-gs.svg";

export const Navbar = () => {
	const [open, setOpen] = useState(false);
	const location = useLocation();

	// Cierra el menú al cambiar de ruta (fiable, sin depender de onClick)
	useEffect(() => { setOpen(false); }, [location]);

	const items = [
		{ to: "/", label: "Home", exact: true },
		{ to: "/projects", label: "Proyectos" },
		{ to: "/colaboraciones", label: "Colaboraciones" },
		//		{ to: "/primate-planet", label: "Primate Planet" },
		{ to: "/nfc", label: "NFC" },
		//		{ to: "/catalogo", label: "Catálogo" },
		{ to: "/about-us", label: "About Us" }
	];

	return (
		<header className="navbar" role="banner" data-open={open ? "true" : "false"}>
			<div className="navbar__inner container">
				<div className="navbar__brand">
					<NavLink to="/" className="navbar__brand-link" aria-label="Ir a Home">
						{/* <img src={logo} alt="GS Factory" className="navbar__logo" /> */}
						<span className="navbar__logo-text">GS</span>
					</NavLink>
				</div>

				{/* Toggle móvil */}
				<button
					className="navbar__toggle"
					aria-label={open ? "Cerrar menú" : "Abrir menú"}
					aria-expanded={open ? "true" : "false"}
					onClick={() => setOpen(v => !v)}
				>
					<span className="navbar__toggle-line" />
					<span className="navbar__toggle-line" />
					<span className="navbar__toggle-line" />
				</button>

				{/* Menú */}
				<nav className="navbar__menu" aria-label="Navegación principal">
					{items.slice(1).map(item => (
						<NavLink
							key={item.to}
							to={item.to}
							className="navbar__link"
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</div>
		</header>
	);
};
