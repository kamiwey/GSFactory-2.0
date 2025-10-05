import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/nfc.css";

/**
 * NFC.jsx — Animación + look del llavero NFC
 * Orden:
 *  1) CONFIG (knobs)
 *  2) UTILS
 *  3) HELPERS ANIM
 *  4) DETECCIÓN TAPAS (top/bottom por altura)
 *  5) MOTOR THREE (init, materiales, luces, cámara)
 *  6) SECUENCIA (pasos 1→5)
 */

export default function NFC() {
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    // ===== 1) CONFIG ===========================================================
    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);

    // Altura global del show (mueve todo arriba/abajo en pantalla)
    const VIEW_Y_OFFSET_K = -0.08;

    // Cámara / render
    const CAMERA = { fov: 33 };
    const TONE = { exposure: 0.9 }; // 0.85–1.10

    // Luces
    const LIGHTS = {
        ambient: 0.08,
        hemiSky: 0x9fc7ff, hemiGround: 0x6b5e51, hemiIntensity: 0.18,
        key: { intensity: 1.5, pos: [-1.2, 0.80, 0.30] },
        fill: { intensity: 0.28, pos: [-1.2, 0.80, 0.30] },
        rim: { intensity: 0.55, pos: [-1.4, 1.30, -1.30] }
    };

    // --- LOOK KNOBS (todo lo visual aquí) ---
    const LOOK = {
        CAPS_ROUGHNESS: 0.75,   // ← mate de TAPAS (sube/baja aquí)
        CAPS_METALNESS: 0.05,

        CORE_COPPER_COLOR: "#B87333", // cobre (prueba "#C47C3C" o "#A65E2E")
        CORE_ROUGHNESS: 0.35,
        CORE_METALNESS: 0.85,
    };

    // Coreografía
    const ZOOM = { from: 0.05, to: 1.05, duration: 1900 };
    const HOLD_MS = 1000;
    const ROTATE = { radians: Math.PI, duration: 1400 };
    const STEP3 = { scaleFactor: 0.62, tiltX_deg: -45, yaw_deg: -30, roll_deg: -35, moveLeftK: -0.95, duration: 900 };
    const POP = { pauseAfterPose: 500, distanceK: 0.03, duration: 100 };
    const OPEN = { pauseAfterPop: 350, distanceK: 0.38, duration: 1050 };

    // ===== 2) UTILS ============================================================
    const deg = d => (d * Math.PI) / 180;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // ===== 3) HELPERS ANIM =====================================================
    function zoomToScalar(o, from, to, duration) {
        o.scale.setScalar(from);
        const s = performance.now();
        const f = (n) => { const t = Math.min(1, (n - s) / duration); o.scale.setScalar(from + (to - from) * easeOutCubic(t)); if (t < 1) requestAnimationFrame(f) };
        requestAnimationFrame(f);
    }
    function rotateWorldY(o, rad, dur, THREE) {
        const q0 = o.quaternion.clone(), y = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
        const s = performance.now();
        const f = (n) => { const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t); o.quaternion.copy(q0); q.setFromAxisAngle(y, rad * k); o.quaternion.premultiply(q); if (t < 1) requestAnimationFrame(f) };
        requestAnimationFrame(f);
    }
    function animateScaleTo(o, to, dur = 800) {
        const from = o.scale.x, s = performance.now();
        const f = (n) => { const t = Math.min(1, (n - s) / dur); o.scale.setScalar(from + (to - from) * easeInOutCubic(t)); if (t < 1) requestAnimationFrame(f) };
        requestAnimationFrame(f);
    }
    function animateWorldTiltYawRoll(o, tx, yy, rz, dur, THREE) {
        const q0 = o.quaternion.clone();
        const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tx);
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yy);
        const qr = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz);
        const qT = qr.clone().multiply(qy).multiply(qp).multiply(q0);
        const s = performance.now();
        const f = (n) => { const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t); o.quaternion.slerpQuaternions(q0, qT, k); if (t < 1) requestAnimationFrame(f) };
        requestAnimationFrame(f);
    }
    function animatePositionTo(o, to, dur, THREE) {
        const from = o.position.clone(), s = performance.now();
        const f = (n) => { const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t); o.position.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k, from.z + (to.z - from.z) * k); if (t < 1) requestAnimationFrame(f) };
        requestAnimationFrame(f);
    }
    function moveAlongWorldY(part, THREE, dist, dur, easing = easeInOutCubic) {
        if (!part || !isFinite(dist)) return;
        const axis = new THREE.Vector3(0, 1, 0), startW = new THREE.Vector3();
        part.getWorldPosition(startW);
        const s = performance.now();
        const f = (n) => {
            const t = Math.min(1, (n - s) / dur), k = easing(t);
            const targetW = startW.clone().add(axis.clone().multiplyScalar(dist * k));
            const parent = part.parent || part; const targetL = parent.worldToLocal(targetW);
            part.position.copy(targetL);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }

    // ===== 4) DETECCIÓN TAPAS ==================================================
    function getCapsByWorldY(model, THREE) {
        const roots = model.children.filter(Boolean);
        const items = (roots.length ? roots : []).map(node => {
            const box = new THREE.Box3().setFromObject(node);
            const c = box.getCenter(new THREE.Vector3()); const sz = new THREE.Vector3(); box.getSize(sz);
            return { node, yWorld: c.y, areaXZ: Math.abs(sz.x * sz.z) };
        });
        if (!items.length) {
            model.traverse(o => {
                if (o.isMesh) {
                    const box = new THREE.Box3().setFromObject(o);
                    const c = box.getCenter(new THREE.Vector3()); const sz = new THREE.Vector3(); box.getSize(sz);
                    items.push({ node: o, yWorld: c.y, areaXZ: Math.abs(sz.x * sz.z) });
                }
            });
        }
        if (!items.length) return { top: null, bottom: null };
        const top = items.slice().sort((a, b) => (b.yWorld - a.yWorld) || (b.areaXZ - a.areaXZ))[0].node;
        let bottom = items.slice().sort((a, b) => (a.yWorld - b.yWorld) || (b.areaXZ - a.areaXZ))[0].node;
        if (top === bottom && items.length > 1) {
            bottom = items.slice().sort((a, b) => (a.yWorld - b.yWorld) || (b.areaXZ - a.areaXZ))[1].node;
        }
        return { top, bottom };
    }

    // ===== 5) MOTOR THREE ======================================================
    useEffect(() => {
        let THREE, GLTFLoader;
        let renderer, scene, camera; let raf = 0;

        const mount = mountRef.current; if (!mount) return;

        const onResize = () => {
            if (!renderer || !camera) return;
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        };

        const start = async () => {
            try {
                const threeMod = await import("https://unpkg.com/three@0.157.0/build/three.module.js?module");
                const loaders = await import("https://unpkg.com/three@0.157.0/examples/jsm/loaders/GLTFLoader.js?module");
                THREE = threeMod; GLTFLoader = loaders.GLTFLoader;

                // Renderer
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.physicallyCorrectLights = true;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = TONE.exposure;
                renderer.setClearColor(0x000000, 0);
                mount.appendChild(renderer.domElement);

                // Escena + cámara
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.01, 100);

                // Luces
                scene.add(new THREE.AmbientLight(0xffffff, LIGHTS.ambient));
                scene.add(new THREE.HemisphereLight(LIGHTS.hemiSky, LIGHTS.hemiGround, LIGHTS.hemiIntensity));
                const key = new THREE.DirectionalLight(0xffffff, LIGHTS.key.intensity); key.position.set(...LIGHTS.key.pos); scene.add(key);
                const fill = new THREE.DirectionalLight(0xffffff, LIGHTS.fill.intensity); fill.position.set(...LIGHTS.fill.pos); scene.add(fill);
                const rim = new THREE.DirectionalLight(0xffffff, LIGHTS.rim.intensity); rim.position.set(...LIGHTS.rim.pos); scene.add(rim);

                // Carga GLB
                const gltf = await new GLTFLoader().loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                // --- Orientar / centrar antes de clasificar por altura ---
                const box0 = new THREE.Box3().setFromObject(model);
                const size0 = new THREE.Vector3(); box0.getSize(size0);
                model.rotation.set(0, 0, 0);
                if (size0.y < size0.x && size0.y < size0.z) model.rotation.x = -Math.PI / 2;
                model.rotation.x += 0.08;

                const box1 = new THREE.Box3().setFromObject(model);
                const center = box1.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.rotation.y += Math.PI;

                const sphere = new THREE.Sphere(); box1.getBoundingSphere(sphere);
                model.position.y += sphere.radius * VIEW_Y_OFFSET_K;

                // Cámara
                const radius = Math.max(sphere.radius, 1e-3);
                const fov = (camera.fov * Math.PI) / 180;
                const dist = (radius / Math.tan(fov / 2)) * 1.10;
                camera.near = Math.max(dist - radius * 5, 0.01);
                camera.far = dist + radius * 5;
                camera.position.set(0, 0, dist);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                // --- Clasificación por altura mundial: top/bottom/core ---
                const { top, bottom } = getCapsByWorldY(model, THREE);
                const getY = (obj) => new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).y;
                const yTop = top ? getY(top) : Infinity;
                const yBot = bottom ? getY(bottom) : -Infinity;
                const eps = Math.abs(yTop - yBot) * 0.15; // 15% de margen

                // Materiales con reglas claras (tapasmate + flat, núcleo cobre)
                model.traverse((o) => {
                    if (!o.isMesh) return;

                    if (o.geometry && !o.geometry.attributes.normal) {
                        o.geometry.computeVertexNormals();
                    }

                    // ¿Vertex colors con contraste real?
                    let useVColors = false;
                    const attr = o.geometry?.attributes?.color;
                    if (attr?.array?.length >= 3) {
                        const arr = attr.array;
                        let min = 1e9, max = -1e9;
                        for (let i = 0; i < arr.length; i += 12) {
                            const r = arr[i], g = arr[i + 1], b = arr[i + 2];
                            const l = r * 0.2126 + g * 0.7152 + b * 0.0722;
                            if (l < min) min = l; if (l > max) max = l;
                            if (max - min > 0.01) { useVColors = true; break; }
                        }
                    }

                    const y = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).y;
                    const isTopCap = isFinite(yTop) && Math.abs(y - yTop) <= eps;
                    const isBottomCap = isFinite(yBot) && Math.abs(y - yBot) <= eps;
                    const isCap = isTopCap || isBottomCap;
                    const isCore = !isCap;

                    let mat;
                    if (isCore) {
                        // Núcleo NFC — Cobre
                        mat = new THREE.MeshStandardMaterial({
                            color: new THREE.Color(LOOK.CORE_COPPER_COLOR),
                            roughness: LOOK.CORE_ROUGHNESS,
                            metalness: LOOK.CORE_METALNESS,
                            side: THREE.FrontSide
                        });
                        mat.vertexColors = useVColors; // conserva colores (chip/pcb) si vienen
                    } else {
                        // Tapas — mate y arista definida
                        const baseColor = (o.material?.color) ? o.material.color.clone() : new THREE.Color(0xffffff);
                        mat = new THREE.MeshStandardMaterial({
                            color: baseColor,
                            map: o.material?.map || null,
                            roughness: LOOK.CAPS_ROUGHNESS,
                            metalness: LOOK.CAPS_METALNESS,
                            flatShading: true,   // ← aristas nítidas
                            side: THREE.FrontSide
                        });
                        mat.vertexColors = useVColors;
                    }

                    o.material = mat;
                    o.castShadow = o.receiveShadow = false;
                });

                scene.add(model);
                setReady(true);

                // ===== 6) SECUENCIA ==================================================
                const run = async () => {
                    // 1 — zoom-in
                    zoomToScalar(model, ZOOM.from, ZOOM.to, ZOOM.duration);
                    await wait(ZOOM.duration + HOLD_MS);

                    // 2 — giro 180
                    rotateWorldY(model, ROTATE.radians, ROTATE.duration, THREE);
                    await wait(ROTATE.duration + 1000);

                    // 3 — pose + izquierda + zoom-out
                    animateScaleTo(model, model.scale.x * STEP3.scaleFactor, STEP3.duration);
                    animateWorldTiltYawRoll(model, deg(STEP3.tiltX_deg), deg(STEP3.yaw_deg), deg(STEP3.roll_deg), STEP3.duration, THREE);
                    const leftOffset = sphere.radius * STEP3.moveLeftK;
                    animatePositionTo(model, new THREE.Vector3(model.position.x + leftOffset, model.position.y, model.position.z), STEP3.duration, THREE);

                    // 4 — pop (arriba top / abajo bottom)
                    await wait(STEP3.duration + POP.pauseAfterPose);
                    const caps = getCapsByWorldY(model, THREE);
                    const dyPop = radius * POP.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, THREE, +dyPop, POP.duration, easeOutCubic);
                    if (caps.bottom) moveAlongWorldY(caps.bottom, THREE, -dyPop, POP.duration, easeOutCubic);

                    // 5 — apertura
                    await wait(POP.duration + OPEN.pauseAfterPop);
                    const dyOpen = radius * OPEN.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, THREE, +dyOpen, OPEN.duration, easeInOutCubic);
                    if (caps.bottom) moveAlongWorldY(caps.bottom, THREE, -dyOpen, OPEN.duration, easeInOutCubic);
                };

                run();

                // Render loop + resize
                const render = () => { renderer.render(scene, camera); raf = requestAnimationFrame(render); };
                render();
                window.addEventListener("resize", onResize);
            } catch (err) {
                console.error("NFC GLB load error:", err);
            }
        };

        start();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            if (mountRef.current && renderer?.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer?.dispose?.();
        };
    }, [glbUrl]);

    return (
        <section className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`} aria-label="Sección NFC">
            <div ref={mountRef} className="nfc__viewer" />
        </section>
    );
}

export { NFC };
