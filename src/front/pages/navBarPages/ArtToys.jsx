import React, { useEffect } from "react";

export const ArtToys = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#4a86d9", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">ART TOYS</h1>
        </section>
    );
};