import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "./pages/Layout";

// Páginas (todas son exports con nombre, NO default)
import { Home } from "./pages/Home";
import { Projects } from "./pages/navBarPages/Projects";
import { PrimatePlanet } from "./pages/navBarPages/PrimatePlanet";
import { NFC } from "./pages/navBarPages/NFC";
import { Catalogo } from "./pages/navBarPages/Catalogo";
import { AboutUs } from "./pages/navBarPages/AboutUs";
import { Colaboraciones } from "./pages/navBarPages/Colaboraciones";

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
        <Route path="/primate-planet" element={<PrimatePlanet />} />
        <Route path="/nfc" element={<NFC />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/colaboraciones" element={<Colaboraciones />} />
        {/* 404 opcional */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
