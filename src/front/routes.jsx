import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./pages/Layout";

// Páginas (todas son exports con nombre, NO default)
import { Home } from "./pages/Home";
import { Projects } from "./pages/navBarPages/Projects";
import { ArtToys } from "./pages/navBarPages/ArtToys";
import { NFC } from "./pages/navBarPages/NFC";
import { Tufting } from "./pages/navBarPages/Tufting";
import { Merchandising } from "./pages/navBarPages/Merchandising";
import { Colaboraciones } from "./pages/navBarPages/Colaboraciones";
import { AboutUs } from "./pages/navBarPages/AboutUs";
import { GsHome } from "./pages/navBarPages/GsHome";

/**
 * Gate de transición:
 * - Mantiene renderizada la "location" anterior mientras la cortina cubre.
 * - Dispara la transición al detectar un cambio de location.
 * - Cuando recibimos "gs:transition:cover", soltamos la nueva location.
 */
export default function AppRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);

  // Si cambia la location → dispara transición y espera COVER para soltarla
  useEffect(() => {
    if (location === displayLocation) return;

    // Lanza la animación (PageTransition se activa por este evento)
    window.dispatchEvent(new CustomEvent("gs:transition"));

    // Cuando la cortina cubra → actualizamos qué location renderizar
    const onCover = () => setDisplayLocation(location);
    window.addEventListener("gs:transition:cover", onCover, { once: true });

    return () => window.removeEventListener("gs:transition:cover", onCover);
  }, [location, displayLocation]);

  return (
    <Routes location={displayLocation}>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/art-toys" element={<ArtToys />} />
        <Route path="/nfc" element={<NFC />} />
        <Route path="/tufting" element={<Tufting />} />
        <Route path="/merchandising" element={<Merchandising />} />
        <Route path="/colaboraciones" element={<Colaboraciones />} />
        <Route path="/gs-home" element={<GsHome />} />
        <Route path="/about-us" element={<AboutUs />} />

        {/* 404 opcional */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
