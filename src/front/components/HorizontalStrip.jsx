import React, { useEffect, useRef } from "react";
import "../stylesGlobal/horizontal-strip.css";

/**
 * HorizontalStrip
 * - Desktop: traduce scroll vertical → desplazamiento horizontal (1:1) con pin.
 * - Mobile (≤900px): apila verticalmente (sin pin ni transform).
 *
 * Props:
 *  - panels: número de paneles (default 6) o array de nodos (children)
 *  - navbarHeight: px de la navbar sticky (default 72)
 *  - className: clase extra para el wrapper
 */
function HorizontalStrip({
    panels = 6,
    navbarHeight = 55,
    className = "",
    children,
}) {
    const wrapRef = useRef(null); // define altura total del tramo
    const stickyRef = useRef(null); // sección sticky del alto de la ventana
    const trackRef = useRef(null); // carril que se desplaza en X

    useEffect(() => {
        const wrap = wrapRef.current;
        const sticky = stickyRef.current;
        const track = trackRef.current;
        if (!wrap || !sticky || !track) return;

        const compute = () => {
            const isMobile = window.innerWidth <= 900;
            wrap.dataset.mode = isMobile ? "vertical" : "horizontal";

            if (isMobile) {
                // Móvil: apilado vertical natural
                wrap.style.height = "auto";
                track.style.transform = "none";
                return { totalX: 0, isMobile: true };
            }

            // Desktop: altura del tramo = alto sticky + desplazamiento X a recorrer
            const totalX = Math.max(0, track.scrollWidth - sticky.clientWidth);
            wrap.style.height = `${sticky.clientHeight + totalX}px`;
            return { totalX, isMobile: false };
        };

        let totalX = 0;
        const setHeights = () => { totalX = compute().totalX; };

        const onScroll = () => {
            if (wrap.dataset.mode === "vertical") return; // móvil: sin traducción
            // 1px vertical = 1px horizontal
            const top = wrap.getBoundingClientRect().top; // px al viewport top
            const scrolledY = Math.min(totalX, Math.max(0, navbarHeight - top));
            const x = -scrolledY;
            track.style.transform = `translate3d(${x}px,0,0)`;
        };

        // Inicial
        setHeights();
        onScroll();

        const ro = new ResizeObserver(() => { setHeights(); onScroll(); });
        ro.observe(track);
        ro.observe(sticky);

        const onResize = () => { setHeights(); onScroll(); };
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onScroll);
        };
    }, [navbarHeight]);

    // Contenido: si pasas children, los uso; si no, genero paneles de muestra
    const items = Array.isArray(children) && children.length
        ? children
        : Array.from({ length: typeof panels === "number" ? panels : 6 }).map((_, i) => (
            <div key={i} className="hstrip__panel">
                <div className="hstrip__panelInner">
                    <div className="hstrip__title">Panel {i + 1}</div>
                    <p className="hstrip__text">
                        Contenido de muestra horizontal.
                    </p>
                </div>
            </div>
        ));

    return (
        <section ref={wrapRef} className={`hstrip ${className}`} aria-label="Galería horizontal">
            <div
                ref={stickyRef}
                className="hstrip__sticky"
                style={{ height: `calc(100dvh - ${navbarHeight}px)`, top: `${navbarHeight}px` }}
            >
                <div ref={trackRef} className="hstrip__track">
                    {items}
                </div>
            </div>
        </section>
    );
}

export default React.memo(HorizontalStrip);

