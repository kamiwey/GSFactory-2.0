import React, { useEffect } from "react";

export const Drops = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#ffffffff", // Sky
                color: "#000000ff"
            }}
        >
            <h1 className="display-3 m-0">Drops</h1>
        </section>
    );
};