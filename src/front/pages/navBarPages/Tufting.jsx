import React, { useEffect } from "react";

export const Tufting = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#39a84e", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">TUFTING</h1>
        </section>
    );
};