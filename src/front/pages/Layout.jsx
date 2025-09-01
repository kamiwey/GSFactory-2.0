import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import PageTransition from "../components/PageTransition";

export const Layout = () => {
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
