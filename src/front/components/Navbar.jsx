import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../stylesGlobal/navbar.css";
import LogoGS from "../assets/img/logo-color.svg";

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [armed, setArmed] = useState(false); // activa la clase de entrada en el siguiente frame
	const navigate = useNavigate();

	const CLOSE_MS = 800;      // debe coincidir con .overlay-slide-up (0.8s en CSS)
	const CLOSE_BUFFER = 20;   // pequeño colchón para evitar solapes

	// Cerrar con ESC
	useEffect(() => {
		const onEsc = (e) => e.key === "Escape" && startClose();
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, []);

	// Armar la clase de entrada un frame después de montar el overlay
	useEffect(() => {
		if (open) {
			setArmed(false);
			const id = requestAnimationFrame(() => setArmed(true));
			return () => cancelAnimationFrame(id);
		} else {
			setArmed(false);
		}
	}, [open]);

	const startClose = () => {
		if (!open) return;
		setClosing(true);
		setTimeout(() => {
			setClosing(false);
			setOpen(false);
			setArmed(false);
		}, CLOSE_MS);
	};

	const toggle = () => {
		if (open) startClose();
		else setOpen(true);
	};

	// Navegar SOLO tras cerrar el overlay (evita “salto” con la cortina)
	const navAfterClose = (e, to) => {
		e.preventDefault();                 // cancela la navegación inmediata del Link
		if (closing) return;                // ya estamos cerrando; ignora toques repetidos
		startClose();                       // dispara animación de cierre
		setTimeout(() => {
			navigate(to);                     // ahora sí, cambia de ruta → gate lanza la cortina
		}, CLOSE_MS + CLOSE_BUFFER);
	};

	// Clases del overlay: montado + entrada armada en el frame siguiente
	const overlayClass =
		"overlay-navigation" +
		(armed ? " overlay-slide-down" : "") +
		(closing ? " overlay-slide-up" : "");

	return (
		<>
			{/* NAV fija, transparente */}
			<nav className="gsNav" role="navigation" aria-label="GS navbar">
				<Link className="brand" to="/">
					<img className="brand__logo" src={LogoGS} alt="GS" />
					<span className="brand__txt">GS FACTORY</span>
				</Link>

				{/* Botón burger (3 barras) */}
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
					className={overlayClass}
					onClick={(e) => {
						// cerrar si clicas en el fondo oscuro
						if (e.target.classList.contains("overlay-navigation")) startClose();
					}}
				>
					<nav role="navigation">
						<ul>
							<li>
								<Link
									to="/projects"
									className="overlayLink"
									onClick={(e) => navAfterClose(e, "/projects")}
								>
									Proyectos
								</Link>
							</li>
							<li>
								<Link
									to="/colaboraciones"
									className="overlayLink"
									onClick={(e) => navAfterClose(e, "/colaboraciones")}
								>
									Colaboraciones
								</Link>
							</li>
							<li>
								<Link
									to="/nfc"
									className="overlayLink"
									onClick={(e) => navAfterClose(e, "/nfc")}
								>
									NFC
								</Link>
							</li>
							<li>
								<Link
									to="/about-us"
									className="overlayLink"
									onClick={(e) => navAfterClose(e, "/about-us")}
								>
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
