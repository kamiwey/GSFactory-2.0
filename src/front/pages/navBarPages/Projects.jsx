import React, { useEffect, useRef } from "react";
import "../../pages/styles/projects.css";

export const Projects = () => {
    const listRef = useRef(null);

    useEffect(() => {
        const root = listRef.current;
        if (!root) return;

        const targets = root.querySelectorAll(".timeline ol li");
        const threshold = 0.5;
        const ANIMATED_CLASS = "in-view";

        const callback = (entries, observer) => {
            entries.forEach((entry) => {
                const elem = entry.target;
                if (entry.intersectionRatio >= threshold) {
                    elem.classList.add(ANIMATED_CLASS);
                    observer.unobserve(elem); // como en el demo: se anima 1 vez
                } else {
                    // Si prefieres que se “des-animen” al salir, comenta la línea de unobserve y deja la siguiente:
                    elem.classList.remove(ANIMATED_CLASS);
                }
            });
        };

        const observer = new IntersectionObserver(callback, { threshold });

        targets.forEach(t => observer.observe(t));

        return () => observer.disconnect();
    }, []);

    return (
        <main className="projects-page" ref={listRef}>
            <section className="intro">
                <div className="container">
                    <h1>Projects Timeline ↓</h1>
                    <p>
                        pondremos algo aqui
                    </p>
                </div>
            </section>

            <section className="timeline">
                <ol>
                    {[
                        { year: "2023", h: "Heading Here", p: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium" },
                        { year: "2024", h: "Heading Here", p: "Proin quam velit, efficitur vel neque vitae, rhoncus commodo mi. Suspendisse finibus mauris et bibendum molestie. Aenean ex augue, varius et pulvinar in, pretium non nisi." },
                        { year: "1940", h: "Heading Here", p: "Proin iaculis, nibh eget efficitur varius, libero tellus porta dolor, at pulvinar tortor ex eget ligula. Integer eu dapibus arcu, sit amet sollicitudin eros." },
                        { year: "1943", h: "Heading Here", p: "In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est." },
                        { year: "1946", h: "Heading Here", p: "In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est." },
                        { year: "1956", h: "Heading Here", p: "Proin iaculis, nibh eget efficitur varius, libero tellus porta dolor, at pulvinar tortor ex eget ligula. Integer eu dapibus arcu, sit amet sollicitudin eros" },
                        { year: "1967", h: "Heading Here", p: "In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est." },
                        { year: "1985", h: "Heading Here", p: "Proin iaculis, nibh eget efficitur varius, libero tellus porta dolor, at pulvinar tortor ex eget ligula. Integer eu dapibus arcu, sit amet sollicitudin eros" },
                        { year: "2000", h: "Heading Here", p: "In mattis elit vitae odio posuere, nec maximus massa varius. Suspendisse varius volutpat mattis. Vestibulum id magna est." },
                        { year: "2012", h: "Heading Here", p: "Proin iaculis, nibh eget efficitur varius, libero tellus porta dolor, at pulvinar tortor ex eget ligula. Integer eu dapibus arcu, sit amet sollicitudin eros" },
                    ].map((item, idx) => (
                        <li key={idx}>
                            <div className="item-inner">
                                <div className="time-wrapper">
                                    <time>{item.year}</time>
                                </div>
                                <div className="details">
                                    <h3>{item.h}</h3>
                                    <p>{item.p}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    );
};
