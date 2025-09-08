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
                backgroundColor: "#fdcea9", // Sky
                color: "#ffffffff"
            }}
        >
            <h1 className="display-3 m-0">About Us</h1>
        </section>
    );
};