import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import "./../stylesGlobal/navbar.css";
import LogoGS from "../assets/img/logo-color.svg";

/**
 * Paleta interna para el overlay de la hamburguesa.
 * (Independiente del resto de paletas del proyecto)
 */
const NAV_COLORS = [
  "#3E78D1", // azul
  "#2DA57F", // verde
  "#5342D9", // violeta
  "#B5823E", // ocre
  "#D24545", // rojo
  "#A3A31E", // oliva
  "#111111" // casi negro
];

export default function Navbar() {
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [armed, setArmed] = useState(false);
  const navigate = useNavigate();

  const CLOSE_MS = 800;
  const CLOSE_BUFFER = 20;

  // Orden y rutas exactamente como en Home
  const navItems = useMemo(
    () => [
      { key: "artToys", to: "/art-toys" },
      { key: "nfc", to: "/nfc" },
      { key: "tufting", to: "/tufting" },
      { key: "merchandising", to: "/merchandising" },
      { key: "collaborations", to: "/colaboraciones" },
      { key: "home", to: "/home" },
      { key: "about", to: "/about-us" }
    ],
    []
  );

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && startClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  useEffect(() => {
    if (open) {
      setArmed(false);
      const id = requestAnimationFrame(() => setArmed(true));
      return () => cancelAnimationFrame(id);
    } else {
      setArmed(false);
    }
  }, [open]);

  const startClose = () => {
    if (!open) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setOpen(false);
      setArmed(false);
    }, CLOSE_MS);
  };

  const toggle = () => {
    if (open) startClose();
    else setOpen(true);
  };

  const navAfterClose = (e, to) => {
    e.preventDefault();
    if (closing) return;
    startClose();
    setTimeout(() => {
      navigate(to);
    }, CLOSE_MS + CLOSE_BUFFER);
  };

  const overlayClass =
    "overlay-navigation" +
    (armed ? " overlay-slide-down" : "") +
    (closing ? " overlay-slide-up" : "");

  return (
    <>
      <nav className="gsNav" role="navigation" aria-label={t("aria.navbar")}>
        <Link className="brand" to="/">
          <img
            className="brand__logo"
            src={LogoGS}
            alt="GS"
            loading="lazy"
            decoding="async"
          />
          {/* Texto de marca visible: GS FACTORY */}
          <span className="brand__text">GS <br></br>FACTORY</span>

        </Link>

        <div className="navRight">
          {/* Idiomas */}
          <div
            role="group"
            className="langSwitch"
            aria-label={t("aria.changeLanguage")}
          >
            <button
              type="button"
              onClick={() => {
                i18n.changeLanguage("es");
                localStorage.setItem("lang", "es");
              }}
              aria-pressed={i18n.resolvedLanguage === "es"}
            >
              ES
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => {
                i18n.changeLanguage("en");
                localStorage.setItem("lang", "en");
              }}
              aria-pressed={i18n.resolvedLanguage === "en"}
            >
              EN
            </button>
          </div>

          {/* Burger */}
          <div
            className={`open-overlay menuToggle navbar__toggle ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}
            onClick={toggle}
            role="button"
            aria-label={t("aria.openMenu")}
            aria-expanded={open}
            tabIndex={0}
          >
            <span className="bar-top"></span>
            <span className="bar-middle"></span>
            <span className="bar-bottom"></span>
          </div>
        </div>
      </nav>

      {/* OVERLAY FULLSCREEN — 7 bloques coloreados */}
      {(open || closing) && (
        <div
          className={overlayClass}
          onClick={(e) => {
            if (e.target.classList.contains("overlay-navigation")) startClose();
          }}
        >
          <nav role="navigation">
            <ul style={{ ["--cols"]: 7 }}>
              {navItems.map((item, i) => (
                <li
                  key={item.key}
                  style={{ background: NAV_COLORS[i % NAV_COLORS.length] }}
                >
                  <Link
                    to={item.to}
                    className="overlayLink"
                    onClick={(e) => navAfterClose(e, item.to)}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

export { Navbar };
