import React, { useEffect } from "react";

export const Catalogo = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#F59E0B", // Sky
                color: "#ffffff"
            }}
        >
            <h1 className="display-3 m-0">Catalogo</h1>
        </section>
    );
};