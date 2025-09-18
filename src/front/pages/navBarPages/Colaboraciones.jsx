import React, { useEffect } from "react";

export const Colaboraciones = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#bb8d43", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">Colaboraciones</h1>
        </section>
    );
};