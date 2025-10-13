import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/nfc.css";
import useLenis from "../../hooks/useLenis";

/* IMÁGENES CARDS */
import imgLlaveros from "../../assets/img/Llaveros-Card.png";
import imgTarjetas from "../../assets/img/Tarjetas-Card.png";
import imgPersonalizado from "../../assets/img/Stand-Resto.png";

/* GALLERIES — MODAL (caras front) */
import LlaveroEurogas from "../../assets/img/Llavero-Eurogas.png";
import LlaveroMasMusculo from "../../assets/img/Llavero-MasMusculo.png";
import LlaveroOzono from "../../assets/img/Llavero-Ozono.png";
import LlaveroPedro from "../../assets/img/Llavero-Pedro.png";
import LlaveroRVFV from "../../assets/img/Llavero-RVFV.png";

import TarjetaFREV from "../../assets/img/Tarjeta-FREV.png";
import TarjetaGS from "../../assets/img/Tarjeta-GS.png";
import TarjetaLupita from "../../assets/img/Tarjeta-Lupita.png";
import TarjetaMasmusculo from "../../assets/img/Tarjeta-masmusculo.png";
import TarjetaNavarrete from "../../assets/img/Tarjeta-Navarrete.png";
import TarjetaRebelion from "../../assets/img/Tarjeta-Rebelion.png";
import TarjetaTecnocasa from "../../assets/img/Tarjeta-Tecnocasa.png";

/* GALLERIES — MODAL (caras back) */
import LlaveroEurogasBack from "../../assets/img/Llavero-Eurogas-Back.png";
import LlaveroMasMusculoBack from "../../assets/img/Llavero-MasMusculo-Back.png";
import LlaveroOzonoBack from "../../assets/img/Llavero-Ozono-Back.png";
import LlaveroPedroBack from "../../assets/img/Llavero-Pedro-Back.png";
import LlaveroRVFVBack from "../../assets/img/Llavero-RVFV-Back.png";

import TarjetaFREVBack from "../../assets/img/Tarjeta-FREV-Back.png";
import TarjetaGSBack from "../../assets/img/Tarjeta-GS-Back.png";
import TarjetaLupitaBack from "../../assets/img/Tarjeta-Lupita-Back.png";
import TarjetaMasmusculoBack from "../../assets/img/Tarjeta-masmusculo-Back.png";
import TarjetaNavarreteBack from "../../assets/img/Tarjeta-Navarrete-Back.png";
import TarjetaRebelionBack from "../../assets/img/Tarjeta-Rebelion-Back.png";
import TarjetaTecnocasaBack from "../../assets/img/Tarjeta-Tecnocasa-Back.png";

/* ===== Lock/Unlock scroll (sin desplazamientos) ========================== */
const lockPageScroll = () => {
  const html = document.documentElement.style;
  const body = document.body.style;
  html.overflow = "hidden";
  body.overflow = "hidden";
  body.position = "fixed";
  body.inset = "0";     // top/right/bottom/left = 0 => sin saltos
  body.width = "100%";
};
const unlockPageScroll = () => {
  const html = document.documentElement.style;
  const body = document.body.style;
  html.overflow = "";
  body.overflow = "";
  body.position = "";
  body.inset = "";
  body.width = "";
};

export default function NFC() {
  const sectionRef = useRef(null);
  const mountRef = useRef(null);
  const cardsRef = useRef(null);
  const [ready, setReady] = useState(false);

  /* ===== MODAL STATE ======================================================= */
  const [modal, setModal] = useState(null); // { key, index }
  const [isClosing, setIsClosing] = useState(false);

  // Hover SOLO sobre la imagen
  const [isImgHover, setIsImgHover] = useState(false);
  useEffect(() => { setIsImgHover(false); }, [modal?.index, modal?.key]);

  // Lock ligero para el MODAL (no movemos layout)
  const modalLockRef = useRef({ html: "", body: "" });
  const lockModal = () => {
    modalLockRef.current.html = document.documentElement.style.overflow;
    modalLockRef.current.body = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };
  const unlockModal = () => {
    document.documentElement.style.overflow = modalLockRef.current.html || "";
    document.body.style.overflow = modalLockRef.current.body || "";
  };

  /* Smooth scroll (Lenis) */
  useLenis({ lerp: 0.16, wheelMultiplier: 1.1, enableOnTouch: false });

  // === CONFIG 3D ============================================================
  const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);
  const VIEW_Y_OFFSET_K = -0.08;
  const CAMERA = { fov: 33 };
  const TONE = { exposure: 0.9 };
  const LIGHTS = {
    ambient: 0.2,
    hemiSky: 0x9fc7ff, hemiGround: 0x6b5e51, hemiIntensity: 0.35,
    key: { intensity: 1.00, pos: [1.8, 1.0, 2.6] },
    fill: { intensity: 0.50, pos: [-1.6, 0.6, 1.0] },
    rim: { intensity: 0.45, pos: [-2.2, 1.4, -2.1] }
  };
  const ZOOM = { from: 0.05, to: 1.05, duration: 1900 };
  const HOLD_MS = 1000;
  const ROTATE = { radians: Math.PI, duration: 1400 };
  const STEP3 = { scaleFactor: 0.62, tiltX_deg: -45, yaw_deg: -30, roll_deg: -35, moveLeftK: -0.95, duration: 900 };
  const POP = { pauseAfterPose: 500, distanceK: 0.03, duration: 100 };
  const OPEN = { pauseAfterPop: 350, distanceK: 0.38, duration: 1050 };
  const INTRO = { BLACKOUT_MS: 1500, FOCUS_FADE_MS: 1200, FOCUS_HOLD_MS: 2200, APPEAR_SCALE: 0.50 };
  const FLOAT = { ampK: 0.012, periodMs: 3600 };

  // === Utils ================================================================
  const deg = (d) => (d * Math.PI) / 180;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const animateNumber = (from, to, dur, onUpdate, onDone) => {
    const s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur);
      const k = easeInOutCubic(t);
      onUpdate(from + (to - from) * k);
      if (t < 1) requestAnimationFrame(f);
      else onDone && onDone();
    };
    requestAnimationFrame(f);
  };
  const zoomToScalar = (o, from, to, duration) => {
    o.scale.setScalar(from);
    const s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / duration), k = easeInOutCubic(t);
      o.scale.setScalar(from + (to - from) * k);
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const rotateWorldY = (o, rad, dur) => {
    const q0 = o.quaternion.clone();
    const ay = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
      o.quaternion.copy(q0);
      q.setFromAxisAngle(ay, rad * k);
      o.quaternion.premultiply(q);
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const animateScaleTo = (o, to, dur = 800) => {
    const from = o.scale.x, s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
      o.scale.setScalar(from + (to - from) * k);
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const animateWorldTiltYawRoll = (o, tx, yy, rz, dur) => {
    const q0 = o.quaternion.clone();
    const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tx);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yy);
    const qr = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz);
    const qT = qr.clone().multiply(qy).multiply(qp).multiply(q0);
    const s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
      o.quaternion.slerpQuaternions(q0, qT, k);
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const animatePositionTo = (o, to, dur) => {
    const from = o.position.clone(), s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
      o.position.set(
        from.x + (to.x - from.x) * k,
        from.y + (to.y - from.y) * k,
        from.z + (to.z - from.z) * k
      );
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const moveAlongWorldY = (part, dist, dur, easing = easeInOutCubic) => {
    if (!part) return;
    const axis = new THREE.Vector3(0, 1, 0);
    const startW = new THREE.Vector3(); part.getWorldPosition(startW);
    const s = performance.now();
    const f = (n) => {
      const t = Math.min(1, (n - s) / dur), k = easing(t);
      const targetW = startW.clone().add(axis.clone().multiplyScalar(dist * k));
      const parent = part.parent || part;
      const targetL = parent.worldToLocal(targetW);
      part.position.copy(targetL);
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };

  const createSpotBeam = (spot) => {
    const beamDistance = 6;
    const radius = Math.tan(spot.angle) * beamDistance;
    const geo = new THREE.ConeGeometry(radius, beamDistance, 48, 1, true);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide
    });
    mat.onBeforeCompile = (shader) => {
      shader.transparent = true;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying vec2 vUv2;`)
        .replace("#include <uv_pars_fragment>", `#include <uv_pars_fragment>\nvarying vec2 vUv2;`)
        .replace("#include <uv_vertex>", `#include <uv_vertex>\nvUv2 = uv;`)
        .replace("#include <output_fragment>", `
          float grad = smoothstep(1.0, 0.0, vUv2.y);
          float rim  = smoothstep(0.9, 0.2, vUv2.x) * smoothstep(0.9, 0.2, 1.0 - vUv2.x);
          float a = grad * rim * opacity;
          gl_FragColor = vec4(outgoingLight, a);
        `);
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    mesh.userData.updateBeam = () => { mesh.position.copy(spot.position); mesh.lookAt(spot.target.position); };
    mesh.userData.setOpacity = (v) => { mesh.material.opacity = v; };
    return mesh;
  };

  /* ====== BLOQUEO ANTES DEL PRIMER PAINT (fix del “media pantalla negra”) ====== */
  useLayoutEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch { }
    window.scrollTo(0, 0);                   // top de la página
    document.documentElement.classList.add("nfc-intro"); // ocultar cards en el primer frame
    lockPageScroll();                        // bloqueo sin desplazar layout
    return () => {
      unlockPageScroll();
      document.documentElement.classList.remove("nfc-intro");
    };
  }, []);

  /* ===== INTRO + ESCENA ==================================================== */
  useEffect(() => {
    let renderer, scene, camera, raf = 0;
    let amb, hemi, key, fill, rim;
    let introSpot, beamMesh;
    let floatStart = 0, canFloat = false;
    let sphere, modelRef, rootGroup;

    const mount = mountRef.current;
    if (!mount) return;

    const onResize = () => {
      if (!renderer || !camera) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const start = async () => {
      try {
        const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
        r.setSize(window.innerWidth, window.innerHeight);
        r.outputColorSpace = THREE.SRGBColorSpace;
        r.physicallyCorrectLights = true;
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.toneMappingExposure = TONE.exposure;
        r.setClearColor(0x000000, 0);
        r.shadowMap.enabled = true;
        r.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(r.domElement);

        renderer = r;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.01, 100);

        amb = new THREE.AmbientLight(0xffffff, 0.0); scene.add(amb);
        hemi = new THREE.HemisphereLight(LIGHTS.hemiSky, LIGHTS.hemiGround, 0.0); scene.add(hemi);
        key = new THREE.DirectionalLight(0xffffff, 0.0); key.position.set(...LIGHTS.key.pos); scene.add(key);
        fill = new THREE.DirectionalLight(0xffffff, 0.0); fill.position.set(...LIGHTS.fill.pos); scene.add(fill);
        rim = new THREE.DirectionalLight(0xffffff, 0.0); rim.position.set(...LIGHTS.rim.pos); scene.add(rim);

        introSpot = new THREE.SpotLight(0xffffff, 0.0, 25, Math.PI / 9.5, 0.3, 2.0);
        introSpot.position.set(0, 4.0, 0.0);
        introSpot.target.position.set(0, 0, 0);
        scene.add(introSpot); scene.add(introSpot.target);
        beamMesh = createSpotBeam(introSpot); scene.add(beamMesh);
        const setBeam = (v) => beamMesh?.userData?.setOpacity?.(Math.min(0.55, v / 3.2));

        const gltf = await new GLTFLoader().loadAsync(glbUrl);
        const model = gltf.scene || gltf.scenes?.[0];
        if (!model) throw new Error("GLB sin escena válida");

        const box0 = new THREE.Box3().setFromObject(model);
        const size0 = new THREE.Vector3(); box0.getSize(size0);
        model.rotation.set(0, 0, 0);
        if (size0.y < size0.x && size0.y < size0.z) model.rotation.x = -Math.PI / 2;
        model.rotation.x += 0.08;

        const box1 = new THREE.Box3().setFromObject(model);
        const center = box1.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.rotation.y += Math.PI;

        sphere = new THREE.Sphere(); box1.getBoundingSphere(sphere);
        model.position.y += sphere.radius * VIEW_Y_OFFSET_K;

        const radius = Math.max(sphere.radius, 1e-3);
        const fov = (camera.fov * Math.PI) / 180;
        const dist = (radius / Math.tan(fov / 2)) * 1.10;
        camera.near = Math.max(dist - radius * 5, 0.01);
        camera.far = dist + radius * 5;
        camera.position.set(0, 0, dist);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        const maxAniso = renderer.capabilities.getMaxAnisotropy?.() || 1;
        model.traverse(o => {
          if (o.isMesh && o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(m => {
              ["map", "emissiveMap", "metalnessMap", "roughnessMap", "normalMap", "aoMap"].forEach(k => {
                if (m[k] && m[k].isTexture) {
                  if ("colorSpace" in m[k]) m[k].colorSpace = THREE.SRGBColorSpace;
                  if ("anisotropy" in m[k]) m[k].anisotropy = Math.max(m[k].anisotropy || 0, maxAniso);
                }
              });
            });
          }
        });

        const core = model.getObjectByName("NFC_Core");
        if (core && core.isMesh && core.material) {
          const mat = core.material.clone();
          mat.transparent = true;
          mat.opacity = (typeof mat.opacity === "number") ? Math.min(mat.opacity, 0.65) : 0.55;
          mat.depthWrite = false; mat.side = THREE.FrontSide;
          core.material = mat; core.renderOrder = 1;
        }

        rootGroup = new THREE.Group();
        model.scale.setScalar(INTRO.APPEAR_SCALE);
        rootGroup.add(model);
        scene.add(rootGroup);

        modelRef = model;
        setReady(true);

        const run = async () => {
          await new Promise(r => requestAnimationFrame(() => r()));
          await wait(INTRO.BLACKOUT_MS);

          animateNumber(0.0, 2.8, INTRO.FOCUS_FADE_MS, (v) => { introSpot.intensity = v; setBeam(v); });
          await wait(INTRO.FOCUS_HOLD_MS);

          sectionRef.current?.classList.add("nfc--bg-on");
          animateNumber(0, LIGHTS.ambient, ZOOM.duration, v => (amb.intensity = v));
          animateNumber(0, LIGHTS.hemiIntensity, ZOOM.duration, v => (hemi.intensity = v));
          animateNumber(0, LIGHTS.key.intensity, ZOOM.duration, v => (key.intensity = v));
          animateNumber(0, LIGHTS.fill.intensity, ZOOM.duration, v => (fill.intensity = v));
          animateNumber(0, LIGHTS.rim.intensity, ZOOM.duration, v => (rim.intensity = v));

          const zoomFrom = Math.max(modelRef.scale.x, ZOOM.from);
          const minPunch = zoomFrom * 1.2;
          const zoomTo = Math.max(ZOOM.to, minPunch);
          zoomToScalar(modelRef, zoomFrom, zoomTo, ZOOM.duration);
          await wait(ZOOM.duration);

          animateNumber(introSpot.intensity, 0.0, 600, (v) => { introSpot.intensity = v; setBeam(v); });
          await wait(HOLD_MS);

          rotateWorldY(modelRef, ROTATE.radians, ROTATE.duration);
          await wait(ROTATE.duration + 1000);

          animateScaleTo(modelRef, modelRef.scale.x * STEP3.scaleFactor, STEP3.duration);
          animateWorldTiltYawRoll(
            modelRef,
            deg(STEP3.tiltX_deg),
            deg(STEP3.yaw_deg),
            deg(STEP3.roll_deg),
            STEP3.duration
          );
          const leftOffset = sphere.radius * STEP3.moveLeftK;
          animatePositionTo(
            modelRef,
            new THREE.Vector3(modelRef.position.x + leftOffset, modelRef.position.y, modelRef.position.z),
            STEP3.duration
          );

          await wait(STEP3.duration + POP.pauseAfterPose);
          // detectar tapas
          const getCapsPreferNames = (m) => {
            const topByName = m.getObjectByName("FrontCap") || m.getObjectByName("frontcap");
            const bottomByName = m.getObjectByName("BackCap") || m.getObjectByName("backcap");
            if (topByName && bottomByName) return { top: topByName, bottom: bottomByName };
            const items = [];
            m.traverse(o => {
              if (o.isMesh || o.isObject3D) {
                const box = new THREE.Box3().setFromObject(o);
                const c = box.getCenter(new THREE.Vector3());
                const sz = new THREE.Vector3(); box.getSize(sz);
                items.push({ node: o, yWorld: c.y, areaXZ: Math.abs(sz.x * sz.z) });
              }
            });
            if (!items.length) return { top: null, bottom: null };
            const top = items.slice().sort((a, b) => (b.yWorld - a.yWorld) || (b.areaXZ - a.areaXZ))[0].node;
            let bottom = items.slice().sort((a, b) => (a.yWorld - b.yWorld) || (b.areaXZ - a.areaXZ))[0].node;
            if (top === bottom && items.length > 1) bottom = items[1].node;
            return { top, bottom };
          };
          const caps = getCapsPreferNames(modelRef);
          const dyPop = sphere.radius * POP.distanceK;
          if (caps.top) moveAlongWorldY(caps.top, +dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));
          if (caps.bottom) moveAlongWorldY(caps.bottom, -dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));

          await wait(POP.duration + OPEN.pauseAfterPop);
          const dyOpen = sphere.radius * OPEN.distanceK;
          if (caps.top) moveAlongWorldY(caps.top, +dyOpen, OPEN.duration, easeInOutCubic);
          if (caps.bottom) moveAlongWorldY(caps.bottom, -dyOpen, OPEN.duration, easeInOutCubic);

          // flotado + copy + fin intro (desbloquear y mostrar cards)
          canFloat = true;
          sectionRef.current?.classList.add("nfc--copy-on");
          unlockPageScroll();
          document.documentElement.classList.remove("nfc-intro");
        };

        floatStart = performance.now();
        const render = () => {
          if (canFloat && rootGroup && sphere) {
            const t = performance.now() - floatStart;
            const amp = sphere.radius * FLOAT.ampK;
            rootGroup.position.y = amp * Math.sin((2 * Math.PI * t) / FLOAT.periodMs);
          }
          beamMesh?.userData?.updateBeam?.();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(render);
        };
        render();

        window.addEventListener("resize", onResize);
        run();
      } catch (err) {
        console.error("NFC GLB load error:", err);
        unlockPageScroll();
        document.documentElement.classList.remove("nfc-intro");
      }
    };

    start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      const el = mountRef.current; if (el && el.firstChild) el.removeChild(el.firstChild);
    };
  }, [glbUrl]);

  /* ===== MODAL & GALLERIES ================================================= */
  const cards = [
    { key: "llaveros", label: "LLAVEROS", img: imgLlaveros },
    { key: "tarjetas", label: "TARJETAS", img: imgTarjetas },
    { key: "personalizado", label: "PERSONALIZADO", img: imgPersonalizado },
  ];

  const GALLERIES = {
    llaveros: [
      { src: LlaveroEurogas, back: LlaveroEurogasBack, title: "Eurogas", desc: "Llavero NFC en ABS con logotipo Eurogas y acabado mate." },
      { src: LlaveroMasMusculo, back: LlaveroMasMusculoBack, title: "MasMusculo", desc: "Serie personalizada con branding deportivo y chip NTAG." },
      { src: LlaveroOzono, back: LlaveroOzonoBack, title: "Ozono", desc: "Geometría limpia, grabado profundo y contraste nítido." },
      { src: LlaveroPedro, back: LlaveroPedroBack, title: "Pedro", desc: "Diseño minimal, borde redondeado y tacto soft-touch." },
      { src: LlaveroRVFV, back: LlaveroRVFVBack, title: "RVFV", desc: "Drop de artista. Tag NFC para experiencias y enlaces." },
    ],
    tarjetas: [
      { src: TarjetaFREV, back: TarjetaFREVBack, title: "FREV", desc: "Tarjeta de contacto NFC con relieve y barniz selectivo." },
      { src: TarjetaGS, back: TarjetaGSBack, title: "GS", desc: "Tarjeta corporativa, lectura rápida y materiales premium." },
      { src: TarjetaLupita, back: TarjetaLupitaBack, title: "Lupita", desc: "Ilustración custom + tag NFC para social y portfolio." },
      { src: TarjetaMasmusculo, back: TarjetaMasmusculoBack, title: "MasMusculo", desc: "Versión fitness. Impresión nítida y alta durabilidad." },
      { src: TarjetaNavarrete, back: TarjetaNavarreteBack, title: "Navarrete", desc: "Brand card con UX de un toque. Configurable al vuelo." },
      { src: TarjetaRebelion, back: TarjetaRebelionBack, title: "Rebelión", desc: "Estética urbana, contraste alto y perfil resistente." },
      { src: TarjetaTecnocasa, back: TarjetaTecnocasaBack, title: "Tecnocasa", desc: "Identidad corporativa y tag NFC para leads instantáneos." },
    ],
    personalizado: [],
  };

  const openModal = (key) => { setIsClosing(false); setModal({ key, index: 0 }); lockModal(); };
  const closeModal = () => {
    setIsClosing(true);
    const EXIT_MS = 340;
    setTimeout(() => { setModal(null); setIsClosing(false); unlockModal(); }, EXIT_MS + 20);
  };

  const gallery = modal ? (GALLERIES[modal.key] || []) : [];
  const curr = modal ? gallery[modal.index] : null;

  const nextSlide = () => {
    if (!modal || gallery.length === 0) return;
    setModal(({ key, index }) => ({ key, index: (index + 1) % gallery.length }));
  };
  const prevSlide = () => {
    if (!modal || gallery.length === 0) return;
    setModal(({ key, index }) => ({ key, index: (index - 1 + gallery.length) % gallery.length }));
  };

  useEffect(() => {
    if (!modal) return;
    const onKeys = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", onKeys);
    return () => window.removeEventListener("keydown", onKeys);
  }, [modal]);

  const scrollToCards = () => {
    const el = cardsRef.current || document.getElementById("nfc-cards");
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      const top = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* HERO */}
      <section
        ref={sectionRef}
        className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`}
        aria-label="Sección NFC"
        aria-hidden={modal ? "true" : "false"}
      >
        <div ref={mountRef} className="nfc__viewer" />
        <header className="nfc__hud" aria-live="polite">
          <h1 className="nfc__title">NFC</h1>
          <p className="nfc__desc">
            Etiqueta inteligente integrada para experiencias de un toque.
            Conecta, comparte y desbloquea funciones en tu toy.
          </p>

          {/* Botón flecha hacia abajo */}
          <button
            type="button"
            className="nfc__down"
            aria-label="Ver opciones NFC"
            title="Ver opciones NFC"
            onClick={scrollToCards}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M12 16.5c-.32 0-.64-.12-.88-.36l-6-6a1.25 1.25 0 1 1 1.76-1.76L12 13.44l5.12-5.06a1.25 1.25 0 1 1 1.76 1.76l-6 6c-.24.24-.56.36-.88.36z" fill="currentColor" />
            </svg>
          </button>
        </header>
      </section>

      {/* CARDS */}
      <section
        ref={cardsRef}
        id="nfc-cards"
        className="nfc-cards nfc-cards--three"
        aria-label="Opciones NFC"
        aria-hidden={modal ? "true" : "false"}
      >
        {cards.map((item) => (
          <button
            key={item.key}
            type="button"
            className="nfc-card"
            data-key={item.key}
            aria-label={item.label}
            onClick={() => openModal(item.key)}
          >
            <div className="nfc-card__imgwrap">
              <img className="nfc-card__img" src={item.img} alt="" loading="lazy" decoding="async" />
            </div>
            <h3 className="nfc-card__title">{item.label}</h3>
          </button>
        ))}
      </section>

      {/* MODAL */}
      {(modal || isClosing) && (
        <div
          className={`nfc-modal ${isClosing ? "nfc-modal--closing" : "nfc-modal--open"}`}
          role="dialog"
          aria-modal="true"
          aria-label={modal?.key || "modal"}
        >
          <div className="nfc-modal__bg" />
          <div className="nfc-modal__shell nfc-modal__shell--full" role="document">
            <button className="nfc-modal__close" aria-label="Cerrar" onClick={closeModal}>✕</button>

            {/* Copy izquierda con el mismo efecto que el HUD */}
            <aside className="nfc-modal__left">
              <div className="nfc-modal__copy nfc-modal__copy--animate" key={`copy-${modal?.index ?? 0}`}>
                <h3 className="nfc-modal__h">{curr?.title || "—"}</h3>
                <p className="nfc-modal__p">{curr?.desc || "Contenido próximamente."}</p>
              </div>
            </aside>

            {/* Stage derecha (hover y transiciones ya existentes) */}
            <section className="nfc-modal__right">
              <button className="nfc-modal__nav nfc-modal__nav--prev" aria-label="Anterior" onClick={prevSlide}>‹</button>
              <div className="nfc-modal__stage nfc-modal__stage--clean">
                {curr && (
                  <img
                    key={modal.index}
                    src={isImgHover && curr.back ? curr.back : curr.src}
                    alt=""
                    className="nfc-modal__img"
                    draggable="false"
                    onMouseEnter={() => setIsImgHover(true)}
                    onMouseLeave={() => setIsImgHover(false)}
                  />
                )}
              </div>
              <button className="nfc-modal__nav nfc-modal__nav--next" aria-label="Siguiente" onClick={nextSlide}>›</button>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export { NFC };
