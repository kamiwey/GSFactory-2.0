import React, { useEffect } from "react";

export const AboutUs = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-fg", "#ffffff"); // navbar blanca
    }, []);
    return (
        <section
            style={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                backgroundColor: "#84CC16", // Sky
                color: "#ffffff"
            }}
        >
            <h1 className="display-3 m-0">About Us</h1>
        </section>
    );
};