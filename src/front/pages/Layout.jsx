import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import PageTransition from "../components/PageTransition";

export const Layout = () => {
    // Forzar scroll al inicio cada vez que se monta el Layout (ej. al refrescar la página)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <main id="main" role="main">
                <Outlet />
            </main>
            {/* Overlay global de transición */}
            <PageTransition />
        </>
    );
};
