import React from "react";
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import PageTransition from "../components/PageTransition";

export const Layout = () => {
    return (
        <ScrollToTop>
            <Navbar />
            <main id="main" role="main">
                {/* Nada de clases .page ni fades: el overlay manda */}
                <Outlet />
            </main>
            <Footer />
            {/* Overlay global: aparece en cada navegación */}
            <PageTransition />
        </ScrollToTop>
    );
};
