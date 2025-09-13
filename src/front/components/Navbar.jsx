import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import "./../stylesGlobal/navbar.css";
import LogoGS from "../assets/img/logo-color.svg";

export default function Navbar() {
  const { t, i18n } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [armed, setArmed] = useState(false);
  const navigate = useNavigate();

  const CLOSE_MS = 800;
  const CLOSE_BUFFER = 20;

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
      <nav className="gsNav" role="navigation" aria-label={t('aria.navbar')}>
        <Link className="brand" to="/">
          <img className="brand__logo" src={LogoGS} alt="GS" loading="lazy" decoding="async" />
          <span className="brand__txt">GS FACTORY</span>
        </Link>

        {/* Selector de idioma discreto */}
        <div className="navRight">
        <div role="group" className="langSwitch" aria-label={t('aria.changeLanguage')}>
          <button
            type="button"
            onClick={() => { i18n.changeLanguage('es'); localStorage.setItem('lang', 'es'); }}
            aria-pressed={i18n.resolvedLanguage === 'es'}
          >
            ES
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('lang', 'en'); }}
            aria-pressed={i18n.resolvedLanguage === 'en'}
          >
            EN
          </button>
        </div>

        {/* Botón burger (3 barras) */}
        <div
          className={`open-overlay menuToggle ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}
          onClick={toggle}
          role="button"
          aria-label={t('aria.openMenu')}
          tabIndex={0}
        >
          <span className="bar-top"></span>
          <span className="bar-middle"></span>
          <span className="bar-bottom"></span>
        </div>
        </div>
      </nav>

      {/* OVERLAY FULLSCREEN (4 columnas) */}
      {(open || closing) && (
        <div
          className={overlayClass}
          onClick={(e) => {
            // cerrar si clicas en el fondo oscuro
            if (e.target.classList.contains("overlay-navigation")) startClose();
          }}
        >
          <nav role="navigation">
            <ul>
              <li>
                <Link
                  to="/projects"
                  className="overlayLink"
                  onClick={(e) => navAfterClose(e, "/projects")}
                >
                  {t('nav.projects')}
                </Link>
              </li>
              <li>
                <Link
                  to="/colaboraciones"
                  className="overlayLink"
                  onClick={(e) => navAfterClose(e, "/colaboraciones")}
                >
                  {t('nav.collaborations')}
                </Link>
              </li>
              <li>
                <Link
                  to="/nfc"
                  className="overlayLink"
                  onClick={(e) => navAfterClose(e, "/nfc")}
                >
                  {t('nav.nfc')}
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us"
                  className="overlayLink"
                  onClick={(e) => navAfterClose(e, "/about-us")}
                >
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

export { Navbar };



