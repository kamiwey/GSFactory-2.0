import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/nfc.css";

export default function NFC() {
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    // === CONFIG (baseline sin inventos) ========================================
    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);

    const VIEW_Y_OFFSET_K = -0.08;
    const CAMERA = { fov: 33 };
    const TONE = { exposure: 0.9 };

    // Luces — EXACTAMENTE las de tu baseline
    const LIGHTS = {
        ambient: 0.20,
        hemiSky: 0x9fc7ff, hemiGround: 0x6b5e51, hemiIntensity: 0.35,
        key: { intensity: 1.00, pos: [1.8, 1.0, 2.6] },
        fill: { intensity: 0.50, pos: [-1.6, 0.6, 1.0] },
        rim: { intensity: 0.45, pos: [-2.2, 1.4, -2.1] }
    };

    // Coreografía — misma que ya teníamos
    const ZOOM = { from: 0.05, to: 1.05, duration: 1900 };
    const HOLD_MS = 1000;
    const ROTATE = { radians: Math.PI, duration: 1400 };
    const STEP3 = { scaleFactor: 0.62, tiltX_deg: -45, yaw_deg: -30, roll_deg: -35, moveLeftK: -0.95, duration: 900 };
    const POP = { pauseAfterPose: 500, distanceK: 0.03, duration: 100 };
    const OPEN = { pauseAfterPop: 350, distanceK: 0.38, duration: 1050 };

    // === Utils / Easing (sin cambios) =========================================
    const deg = d => (d * Math.PI) / 180;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // === Helpers animación (baseline) =========================================
    function zoomToScalar(o, from, to, duration) {
        o.scale.setScalar(from);
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / duration);
            o.scale.setScalar(from + (to - from) * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function rotateWorldY(o, rad, dur) {
        const q0 = o.quaternion.clone();
        const ay = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion();
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            o.quaternion.copy(q0);
            q.setFromAxisAngle(ay, rad * k);
            o.quaternion.premultiply(q);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function animateScaleTo(o, to, dur = 800) {
        const from = o.scale.x, s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            o.scale.setScalar(from + (to - from) * k);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function animateWorldTiltYawRoll(o, tx, yy, rz, dur) {
        const q0 = o.quaternion.clone();
        const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tx);
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yy);
        const qr = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz);
        const qT = qr.clone().multiply(qy).multiply(qp).multiply(q0);
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            o.quaternion.slerpQuaternions(q0, qT, k);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function animatePositionTo(o, to, dur) {
        const from = o.position.clone(), s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            o.position.set(
                from.x + (to.x - from.x) * k,
                from.y + (to.y - from.y) * k,
                from.z + (to.z - from.z) * k
            );
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function moveAlongWorldY(part, dist, dur, easing = easeInOutCubic) {
        if (!part) return;
        const axis = new THREE.Vector3(0, 1, 0);
        const startW = new THREE.Vector3();
        part.getWorldPosition(startW);
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easing(t);
            const targetW = startW.clone().add(axis.clone().multiplyScalar(dist * k));
            const parent = part.parent || part;
            const targetL = parent.worldToLocal(targetW);
            part.position.copy(targetL);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }

    // === Detección de tapas por altura mundial (baseline) ======================
    function getCapsByWorldY(model) {
        const items = [];
        model.traverse(o => {
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
    }

    useEffect(() => {
        let renderer, scene, camera, raf = 0;

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
                // Renderer
                renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    failIfMajorPerformanceCaveat: false
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.physicallyCorrectLights = true;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = TONE.exposure;
                renderer.setClearColor(0x000000, 0);
                mount.appendChild(renderer.domElement);

                // Escena y cámara
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.01, 100);

                // Luces — SIN CAMBIOS
                scene.add(new THREE.AmbientLight(0xffffff, LIGHTS.ambient));
                scene.add(new THREE.HemisphereLight(LIGHTS.hemiSky, LIGHTS.hemiGround, LIGHTS.hemiIntensity));
                const key = new THREE.DirectionalLight(0xffffff, LIGHTS.key.intensity); key.position.set(...LIGHTS.key.pos); scene.add(key);
                const fill = new THREE.DirectionalLight(0xffffff, LIGHTS.fill.intensity); fill.position.set(...LIGHTS.fill.pos); scene.add(fill);
                const rim = new THREE.DirectionalLight(0xffffff, LIGHTS.rim.intensity); rim.position.set(...LIGHTS.rim.pos); scene.add(rim);

                // Carga GLB
                const gltf = await new GLTFLoader().loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                // Orientación / centrado (baseline)
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

                // *** NO TOCAMOS MATERIALES *** (todo se queda tal cual viene del GLB)
                scene.add(model);
                setReady(true);

                // ===== SECUENCIA (baseline) ==========================================
                const run = async () => {
                    // (1) zoom-in
                    zoomToScalar(model, ZOOM.from, ZOOM.to, ZOOM.duration);
                    await wait(ZOOM.duration + HOLD_MS);

                    // (2) giro 180º
                    rotateWorldY(model, ROTATE.radians, ROTATE.duration);
                    await wait(ROTATE.duration + 1000);

                    // (3) pose + izquierda + zoom-out
                    animateScaleTo(model, model.scale.x * STEP3.scaleFactor, STEP3.duration);
                    animateWorldTiltYawRoll(
                        model,
                        deg(STEP3.tiltX_deg),
                        deg(STEP3.yaw_deg),
                        deg(STEP3.roll_deg),
                        STEP3.duration
                    );
                    const leftOffset = sphere.radius * STEP3.moveLeftK;
                    animatePositionTo(
                        model,
                        new THREE.Vector3(model.position.x + leftOffset, model.position.y, model.position.z),
                        STEP3.duration
                    );

                    // (4) pop (abre un poco)
                    await wait(STEP3.duration + POP.pauseAfterPose);
                    const caps = getCapsByWorldY(model);
                    const dyPop = radius * POP.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, +dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));
                    if (caps.bottom) moveAlongWorldY(caps.bottom, -dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));

                    // (5) apertura completa
                    await wait(POP.duration + OPEN.pauseAfterPop);
                    const dyOpen = radius * OPEN.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, +dyOpen, OPEN.duration, easeInOutCubic);
                    if (caps.bottom) moveAlongWorldY(caps.bottom, -dyOpen, OPEN.duration, easeInOutCubic);
                };

                run();

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
            const el = mountRef.current;
            if (el && el.firstChild) el.removeChild(el.firstChild);
        };
    }, [glbUrl]);

    return (
        <section className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`} aria-label="Sección NFC">
            <div ref={mountRef} className="nfc__viewer" />
        </section>
    );
}

export { NFC };
