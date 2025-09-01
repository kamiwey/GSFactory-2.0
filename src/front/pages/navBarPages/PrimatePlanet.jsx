import React, { useEffect } from "react";

export const PrimatePlanet = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#f5590bff", // Sky
                color: "#ffffff"
            }}
        >
            <h1 className="display-3 m-0">Primate Planets</h1>
        </section>
    );
};