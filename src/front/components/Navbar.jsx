import React from "react";
import TransitionLink from "./TransitionLink";

// Si tienes un SVG/PNG de marca, descomenta e importa:
// import logo from "../assets/brand/logo-gs.svg";

export const Navbar = () => {
	// Menú principal: 5 rutas ya definidas en tu router
	const items = [
		{ to: "/projects", label: "Projects" },
		{ to: "/primate-planet", label: "Primate Planet" },
		{ to: "/drops", label: "Drops" },
		{ to: "/catalogo", label: "Catálogo" },
		{ to: "/about-us", label: "About Us" }
	];

	return (
		<header className="navbar" role="banner">
			<div className="navbar__inner container">
				<div className="navbar__brand">
					<TransitionLink to="/" className="navbar__brand-link" aria-label="Ir a Home">
						{/* Si usas imagen de logo, sustituye el span por <img src={logo} alt="GS Factory" className="navbar__logo" /> */}
						<span className="navbar__logo-text">GS</span>
					</TransitionLink>
				</div>

				<nav className="navbar__menu" aria-label="Navegación principal">
					{items.map(item => (
						<TransitionLink
							key={item.to}
							to={item.to}
							className="navbar__link"
						>
							{item.label}
						</TransitionLink>
					))}
				</nav>
			</div>
		</header>
	);
};
