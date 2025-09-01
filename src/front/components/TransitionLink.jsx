import React from "react";
import { useNavigate } from "react-router-dom";

// helper: espera al siguiente frame de render
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

/**
 * Enlace que dispara la transición ANTES de navegar para evitar el flash.
 * - Usa <a> en lugar de <Link> para controlar el timing.
 * - Respeta Ctrl/Cmd/Middle click y target="_blank" (no intercepta).
 * - Acepta `to` string u objeto (pathname/search/hash/state/replace).
 */
export default function TransitionLink({
    to,
    children,
    onClick,
    replace = false,
    state = undefined,
    ...rest
}) {
    const navigate = useNavigate();

    const handleClick = async (e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;

        // clicks modificados: deja que el navegador haga lo suyo
        if (
            e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
            e.button === 1 || rest.target === "_blank"
        ) {
            return;
        }

        e.preventDefault();

        // 1) Activa cortina YA
        window.dispatchEvent(new CustomEvent("gs:transition"));

        // 2) Espera 2 frames para que pinte el fade blanco y tape la pantalla
        await nextFrame();
        await nextFrame();

        // 3) Navega
        if (typeof to === "string") {
            navigate(to, { replace, state });
        } else if (to && typeof to === "object") {
            navigate(to, { replace, state: to.state ?? state });
        }
    };

    // Construye href para accesibilidad/previsualización
    const href =
        typeof to === "string"
            ? to
            : to?.pathname
                ? `${to.pathname || ""}${to.search || ""}${to.hash || ""}`
                : "#";

    return (
        <a href={href} onClick={handleClick} {...rest}>
            {children}
        </a>
    );
}
