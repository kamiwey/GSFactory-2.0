import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";

// Espera un frame de render
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
// Espera un evento (una sola vez)
const waitFor = (name) =>
    new Promise(resolve => window.addEventListener(name, () => resolve(), { once: true }));
// Fallback: si COVER no llega en X ms, navegamos igual
const waitForCoverOrTimeout = (ms = 1200) =>
    Promise.race([waitFor("gs:transition:cover"), new Promise(r => setTimeout(r, ms))]);

export default function TransitionLink({
    to,
    children,
    onClick,
    replace = false,
    state = undefined,
    ...rest // ← CORREGIDO (antes había un ".rest")
}) {
    const navigate = useNavigate();
    const armed = useRef(false); // evita doble dispatch (pointerdown + click)

    // Dispara lo antes posible
    const handlePointerDown = (e) => {
        if (
            e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
            e.button === 1 || rest.target === "_blank"
        ) return; // clicks modificados / nueva pestaña => no interceptar

        armed.current = true;
        window.dispatchEvent(new CustomEvent("gs:transition"));
    };

    const handleClick = async (e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;

        if (
            e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
            e.button === 1 || rest.target === "_blank"
        ) return; // dejar pasar

        e.preventDefault();

        // Si no hubo pointerdown (teclado, etc.), dispara ahora
        if (!armed.current) {
            window.dispatchEvent(new CustomEvent("gs:transition"));
        }

        // Da margen al fade blanco para cubrir
        await nextFrame(); await nextFrame();

        // Espera cobertura real (o timeout de seguridad)
        await waitForCoverOrTimeout(1200);

        // Navega ya con la pantalla cubierta
        if (typeof to === "string") {
            const nextState = typeof state === "object" && state !== null
                ? { ...state, __gs_tl: true }
                : { __gs_tl: true };
            navigate(to, { replace, state: nextState });
        } else if (to && typeof to === "object") {
            const mergedState = {
                ...(to.state || {}),
                ...(typeof state === "object" && state !== null ? state : {}),
                __gs_tl: true,
            };
            navigate({ ...to }, { replace, state: mergedState });
        }

        armed.current = false;
    };

    const href =
        typeof to === "string"
            ? to
            : to?.pathname
                ? `${to.pathname || ""}${to.search || ""}${to.hash || ""}`
                : "#";

    return (
        <a
            href={href}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            {...rest}
        >
            {children}
        </a>
    );
}
