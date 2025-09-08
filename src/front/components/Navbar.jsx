import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // ← usamos Link para navegar
import "./../stylesGlobal/navbar.css";

// Ajusta la ruta si tu carpeta no es "img"
import LogoGS from "../assets/img/logo-color.svg";

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);

	// Cerrar con ESC
	useEffect(() => {
		const onEsc = (e) => e.key === "Escape" && startClose();
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, []);

	const startClose = () => {
		if (!open) return;
		setClosing(true);
		// Debe coincidir con .overlay-slide-up (800ms en tu CSS)
		setTimeout(() => {
			setClosing(false);
			setOpen(false);
		}, 800);
	};

	const toggle = () => {
		if (open) startClose();
		else setOpen(true);
	};

	// Cierra overlay al hacer click en un item
	const onItemClick = () => startClose();

	return (
		<>
			{/* NAV fija, transparente, texto negro */}
			<nav className="gsNav" role="navigation" aria-label="GS navbar">
				<Link className="brand" to="/">
					<img className="brand__logo" src={LogoGS} alt="GS" />
					<span className="brand__txt">GS</span>
				</Link>

				{/* Botón burger con 3 barras blancas (Fluxus) */}
				<div
					className={`open-overlay ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}
					onClick={toggle}
					role="button"
					aria-label="Abrir menú"
					tabIndex={0}
				>
					<span className="bar-top"></span>
					<span className="bar-middle"></span>
					<span className="bar-bottom"></span>
				</div>
			</nav>

			{/* OVERLAY FULLSCREEN (4 columnas) */}
			{(open || closing) && (
				<div
					className={`overlay-navigation ${open ? "overlay-slide-down" : ""} ${closing ? "overlay-slide-up" : ""}`}
					onClick={(e) => {
						// cerrar si clicas fuera de los enlaces
						if (e.target.classList.contains("overlay-navigation")) startClose();
					}}
				>
					<nav role="navigation">
						<ul>
							<li>
								<Link to="/projects" className="overlayLink" onClick={onItemClick}>
									Proyectos
								</Link>
							</li>
							<li>
								<Link to="/colaboraciones" className="overlayLink" onClick={onItemClick}>
									Colaboraciones
								</Link>
							</li>
							<li>
								<Link to="/nfc" className="overlayLink" onClick={onItemClick}>
									NFC
								</Link>
							</li>
							<li>
								<Link to="/about-us" className="overlayLink" onClick={onItemClick}>
									About us
								</Link>
							</li>
						</ul>
					</nav>
				</div>
			)}
		</>
	);
}

// Export nombrado opcional si tu Layout lo importa como { Navbar }
export { Navbar };
