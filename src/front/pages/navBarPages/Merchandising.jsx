import React, { useEffect } from "react";

export const Merchandising = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#5240c9", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">MERCHANDISING</h1>
        </section>
    );
};