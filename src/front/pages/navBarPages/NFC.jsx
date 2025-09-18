import React, { useEffect } from "react";

export const NFC = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#2aa0a0", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">NFC</h1>
        </section>
    );
};