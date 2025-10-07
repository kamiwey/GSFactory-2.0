// src/front/pages/navBarPages/NFC.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/nfc.css";

export default function NFC() {
    const sectionRef = useRef(null);
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    // === CONFIG (tu baseline) ====================================================
    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);
    const VIEW_Y_OFFSET_K = -0.08;
    const CAMERA = { fov: 33 };
    const TONE = { exposure: 0.9 };

    // Luces baseline
    const LIGHTS = {
        ambient: 0.20,
        hemiSky: 0x9fc7ff, hemiGround: 0x6b5e51, hemiIntensity: 0.35,
        key: { intensity: 1.00, pos: [1.8, 1.0, 2.6] },
        fill: { intensity: 0.50, pos: [-1.6, 0.6, 1.0] },
        rim: { intensity: 0.45, pos: [-2.2, 1.4, -2.1] }
    };

    // Coreografía baseline (NO tocada)
    const ZOOM = { from: 0.05, to: 1.05, duration: 1900 };
    const HOLD_MS = 1000;
    const ROTATE = { radians: Math.PI, duration: 1400 };
    const STEP3 = { scaleFactor: 0.62, tiltX_deg: -45, yaw_deg: -30, roll_deg: -35, moveLeftK: -0.95, duration: 900 };
    const POP = { pauseAfterPose: 500, distanceK: 0.03, duration: 100 };
    const OPEN = { pauseAfterPop: 350, distanceK: 0.38, duration: 1050 };

    // Intro cinematográfica (solo prefacio)
    const INTRO = {
        BLACKOUT_MS: 1500,
        FOCUS_FADE_MS: 1200,
        FOCUS_HOLD_MS: 2200,
        APPEAR_SCALE: 0.50, // tamaño de aparición bajo el foco (tu setting actual)
    };

    // === Utils ===================================================================
    const deg = d => (d * Math.PI) / 180;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function animateNumber(from, to, dur, onUpdate, onDone) {
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            onUpdate(from + (to - from) * k);
            if (t < 1) requestAnimationFrame(f); else onDone && onDone();
        };
        requestAnimationFrame(f);
    }
    function zoomToScalar(o, from, to, duration) {
        o.scale.setScalar(from);
        const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / duration), k = easeInOutCubic(t);
            o.scale.setScalar(from + (to - from) * k);
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    function rotateWorldY(o, rad, dur) {
        const q0 = o.quaternion.clone();
        const ay = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion(); const s = performance.now();
        const f = n => {
            const t = Math.min(1, (n - s) / dur), k = easeInOutCubic(t);
            o.quaternion.copy(q0); q.setFromAxisAngle(ay, rad * k); o.quaternion.premultiply(q);
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
        const startW = new THREE.Vector3(); part.getWorldPosition(startW);
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

    // === Spot beam helper ========================================================
    function createSpotBeam(spot) {
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
                .replace("#include <common>", `
          #include <common>
          varying vec2 vUv2;
        `)
                .replace("#include <uv_pars_fragment>", `
          #include <uv_pars_fragment>
          varying vec2 vUv2;
        `)
                .replace("#include <uv_vertex>", `
          #include <uv_vertex>
          vUv2 = uv;
        `)
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
    }

    useEffect(() => {
        let renderer, scene, camera, raf = 0;
        let amb, hemi, key, fill, rim;
        let introSpot, beamMesh;

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
                // Renderer: dejamos ver el negro/verde de CSS + sombras y dither
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.physicallyCorrectLights = true;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = TONE.exposure;
                renderer.setClearColor(0x000000, 0);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                // Dither en gradientes (ya suele estar activo, lo reforzamos)
                const gl = renderer.getContext?.();
                if (gl?.enable && gl?.DITHER) gl.enable(gl.DITHER);
                mount.appendChild(renderer.domElement);

                // Escena + cámara
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.01, 100);

                // Luces: arrancan a 0 para el reveal con foco
                amb = new THREE.AmbientLight(0xffffff, 0.0); scene.add(amb);
                hemi = new THREE.HemisphereLight(LIGHTS.hemiSky, LIGHTS.hemiGround, 0.0); scene.add(hemi);
                key = new THREE.DirectionalLight(0xffffff, 0.0); key.position.set(...LIGHTS.key.pos); scene.add(key);
                fill = new THREE.DirectionalLight(0xffffff, 0.0); fill.position.set(...LIGHTS.fill.pos); scene.add(fill);
                rim = new THREE.DirectionalLight(0xffffff, 0.0); rim.position.set(...LIGHTS.rim.pos); scene.add(rim);

                // Foco + haz (ligeramente más soft)
                introSpot = new THREE.SpotLight(0xffffff, 0.0, 25, Math.PI / 9.5, 0.3, 2.0);
                introSpot.position.set(0, 4.0, 0.0);
                introSpot.target.position.set(0, 0, 0);
                scene.add(introSpot); scene.add(introSpot.target);
                beamMesh = createSpotBeam(introSpot); scene.add(beamMesh);
                const setBeam = (v) => beamMesh?.userData?.setOpacity?.(Math.min(0.55, v / 3.2));

                // GLB
                const gltf = await new GLTFLoader().loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                // Orientación / centrado (tu baseline)
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

                // Cámara (baseline)
                const radius = Math.max(sphere.radius, 1e-3);
                const fov = (camera.fov * Math.PI) / 180;
                const dist = (radius / Math.tan(fov / 2)) * 1.10;
                camera.near = Math.max(dist - radius * 5, 0.01);
                camera.far = dist + radius * 5;
                camera.position.set(0, 0, dist);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                // Materiales: sRGB + anisotropía
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

                // Transparencia NFC_Core (baseline)
                const core = model.getObjectByName("NFC_Core");
                if (core && core.isMesh && core.material) {
                    const mat = core.material.clone();
                    mat.transparent = true;
                    mat.opacity = (typeof mat.opacity === "number") ? Math.min(mat.opacity, 0.65) : 0.55;
                    mat.depthWrite = false; mat.side = THREE.FrontSide;
                    core.material = mat; core.renderOrder = 1;
                }

                // Aparición: más cerca/grande bajo el foco
                model.scale.setScalar(INTRO.APPEAR_SCALE);

                scene.add(model);
                setReady(true);

                // ================= SECUENCIA ===========================================
                const run = async () => {
                    // 0) Pre-warm
                    await new Promise(r => requestAnimationFrame(() => r()));

                    // (Intro-1) Negro ya está (CSS). Espera
                    await wait(INTRO.BLACKOUT_MS);

                    // (Intro-2) Foco + haz (cap del haz para no quemar)
                    animateNumber(0.0, 2.8, INTRO.FOCUS_FADE_MS, (v) => {
                        introSpot.intensity = v;
                        setBeam(v);
                    });

                    // (Intro-3) Hold foco
                    await wait(INTRO.FOCUS_HOLD_MS);

                    // Cambia fondo y sube luces durante TU primer zoom
                    sectionRef.current?.classList.add("nfc--bg-on");
                    animateNumber(0, LIGHTS.ambient, ZOOM.duration, v => amb.intensity = v);
                    animateNumber(0, LIGHTS.hemiIntensity, ZOOM.duration, v => hemi.intensity = v);
                    animateNumber(0, LIGHTS.key.intensity, ZOOM.duration, v => key.intensity = v);
                    animateNumber(0, LIGHTS.fill.intensity, ZOOM.duration, v => fill.intensity = v);
                    animateNumber(0, LIGHTS.rim.intensity, ZOOM.duration, v => rim.intensity = v);

                    // (1) Zoom-in del modelo — ADAPTATIVO para garantizar punch-in
                    const zoomFrom = Math.max(model.scale.x, ZOOM.from);
                    const minPunch = zoomFrom * 1.2; // al menos +20%
                    const zoomTo = Math.max(ZOOM.to, minPunch);
                    zoomToScalar(model, zoomFrom, zoomTo, ZOOM.duration);
                    await wait(ZOOM.duration);

                    // Apaga el foco suave (deja el look baseline limpio)
                    animateNumber(introSpot.intensity, 0.0, 600, (v) => {
                        introSpot.intensity = v;
                        setBeam(v);
                    });

                    // (hold original)
                    await wait(HOLD_MS);

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
                    const leftOffset = radius * STEP3.moveLeftK;
                    animatePositionTo(
                        model,
                        new THREE.Vector3(model.position.x + leftOffset, model.position.y, model.position.z),
                        STEP3.duration
                    );

                    // (4) pop tapas
                    await wait(STEP3.duration + POP.pauseAfterPose);
                    const caps = (function getCapsPreferNames(m) {
                        const topByName = m.getObjectByName("FrontCap") || m.getObjectByName("frontcap");
                        const bottomByName = m.getObjectByName("BackCap") || m.getObjectByName("backcap");
                        if (topByName && bottomByName) return { top: topByName, bottom: bottomByName };
                        const items = []; m.traverse(o => {
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
                    })(model);

                    const dyPop = radius * POP.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, +dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));
                    if (caps.bottom) moveAlongWorldY(caps.bottom, -dyPop, POP.duration, t => 1 - Math.pow(1 - t, 3));

                    // (5) apertura completa tapas
                    await wait(POP.duration + OPEN.pauseAfterPop);
                    const dyOpen = radius * OPEN.distanceK;
                    if (caps.top) moveAlongWorldY(caps.top, +dyOpen, OPEN.duration, easeInOutCubic);
                    if (caps.bottom) moveAlongWorldY(caps.bottom, -dyOpen, OPEN.duration, easeInOutCubic);
                };

                const render = () => { beamMesh?.userData?.updateBeam?.(); renderer.render(scene, camera); raf = requestAnimationFrame(render); };
                render();

                window.addEventListener("resize", onResize);
                run();
            } catch (err) {
                console.error("NFC GLB load error:", err);
            }
        };

        start();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            const el = mountRef.current; if (el && el.firstChild) el.removeChild(el.firstChild);
        };
    }, [glbUrl]);

    return (
        <section
            ref={sectionRef}
            className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`}
            aria-label="Sección NFC"
        >
            <div ref={mountRef} className="nfc__viewer" />
        </section>
    );
}

export { NFC };
