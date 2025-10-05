import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/nfc.css";

export default function NFC() {
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);

    // ======== TIMINGS & TARGETS (tuneables) ========
    const ZOOM_MS = 1900;
    const HOLD_MS = 1000;
    const ROTATE_MS = 1400;

    // Paso 3 — ajustes solicitados
    const STEP3 = {
        scaleFactor: 0.62,     // antes 0.85 → ahora más pequeño
        tiltX: -0.42,          // más inclinación (pitch, rad)
        yawDelta: +0.06,       // leve giro en Y para “pose”
        moveLeftK: -0.95,      // multiplicador de radio para desplazar a la izq (igual que teníamos)
        duration: 900,
    };
    // ===============================================

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function zoomInOnLoad(object3D, { from = 0.05, to = 1.15, duration = 900 } = {}) {
        if (!object3D) return;
        object3D.scale.setScalar(from);
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const s = from + (to - from) * easeOutCubic(t);
            object3D.scale.setScalar(s);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Giro 180° sobre Y GLOBAL
    function rotateWorldY(object3D, radians, duration, THREE) {
        if (!object3D || !THREE) return;
        const startQ = object3D.quaternion.clone();
        const worldY = new THREE.Vector3(0, 1, 0);
        const tmpQ = new THREE.Quaternion();
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const k = easeInOutCubic(t);
            object3D.quaternion.copy(startQ);
            tmpQ.setFromAxisAngle(worldY, radians * k);
            object3D.quaternion.premultiply(tmpQ);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Helpers paso 3
    function animateScaleTo(object3D, toScalar, duration = 800) {
        if (!object3D) return;
        const from = object3D.scale.x;
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const s = from + (toScalar - from) * easeInOutCubic(t);
            object3D.scale.setScalar(s);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function animateQuaternionTo(object3D, targetEuler, duration, THREE) {
        if (!object3D || !THREE) return;
        const startQ = object3D.quaternion.clone();
        const targetQ = new THREE.Quaternion().setFromEuler(targetEuler);
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            THREE.Quaternion.slerp(startQ, targetQ, object3D.quaternion, easeInOutCubic(t));
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function animatePositionTo(object3D, toVec3, duration = 900, THREE) {
        if (!object3D || !THREE) return;
        const from = object3D.position.clone();
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const k = easeInOutCubic(t);
            object3D.position.set(
                from.x + (toVec3.x - from.x) * k,
                from.y + (toVec3.y - from.y) * k,
                from.z + (toVec3.z - from.z) * k
            );
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    useEffect(() => {
        let THREE, GLTFLoader;
        let renderer, scene, camera;
        let raf = 0;

        const mount = mountRef.current;
        if (!mount) return;

        const onResize = () => {
            if (!renderer || !camera) return;
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        };

        const safeMat = (THREE, colorHex, rough = 0.45, metal = 0.0) =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color(colorHex),
                roughness: rough,
                metalness: metal,
            });

        const COLORS = { offWhite: 0xf6f6f2, black: 0x111111, brown: 0xc49a6c, coil: 0xdddddd };

        const colorizeByName = (mesh, THREE) => {
            const name = (mesh.name || "").toLowerCase();
            if (name.includes("front") || name.includes("back") || name.includes("cap")) { mesh.material = safeMat(THREE, COLORS.offWhite, 0.35, 0.0); return; }
            if (name.includes("nfc") || name.includes("core") || name.includes("coil")) { mesh.material = safeMat(THREE, COLORS.coil, 0.6, 0.0); return; }
            if (name.includes("black")) { mesh.material = safeMat(THREE, COLORS.black, 0.3, 0.0); return; }
            if (name.includes("brown") || name.includes("mono") || name.includes("monkey")) { mesh.material = safeMat(THREE, COLORS.brown, 0.35, 0.0); return; }
            mesh.material = safeMat(THREE, COLORS.offWhite, 0.45, 0.0);
        };

        const autoOrientFlatModel = (model, THREE) => {
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3(); box.getSize(size);
            const axes = [
                { axis: "x", v: size.x }, { axis: "y", v: size.y }, { axis: "z", v: size.z },
            ].sort((a, b) => a.v - b.v);
            const thinnest = axes[0].axis;
            model.rotation.set(0, 0, 0);
            if (thinnest === "x") model.rotation.y = Math.PI / 2;
            else if (thinnest === "y") model.rotation.x = -Math.PI / 2;
            model.rotation.x += 0.08; // tilt leve
            const box2 = new THREE.Box3().setFromObject(model);
            const center2 = box2.getCenter(new THREE.Vector3());
            model.position.sub(center2);
            const sphere = new THREE.Sphere(); box2.getBoundingSphere(sphere);
            return sphere;
        };

        const start = async () => {
            try {
                const threeMod = await import("https://unpkg.com/three@0.160.0/build/three.module.js?module");
                const loaders = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?module");
                THREE = threeMod; GLTFLoader = loaders.GLTFLoader;

                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMappingExposure = 1.0;
                renderer.setClearColor(0x000000, 0);
                mount.appendChild(renderer.domElement);

                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.01, 100);

                scene.add(new THREE.AmbientLight(0xffffff, 0.55));
                const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(1.5, 0.8, 2.5); scene.add(key);
                const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-1.2, 0.5, 1.2); scene.add(fill);
                const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-2.0, 1.5, -2.2); scene.add(rim);

                const loader = new GLTFLoader();
                const gltf = await loader.loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                model.traverse((o) => { if (o.isMesh) { colorizeByName(o, THREE); o.castShadow = o.receiveShadow = false; } });

                const sphere = autoOrientFlatModel(model, THREE);
                model.rotation.y += Math.PI; // frontal hacia cámara
                model.position.y -= sphere.radius * 0.18;
                scene.add(model);

                zoomInOnLoad(model, { from: 0.05, to: 1.15, duration: ZOOM_MS });

                const radius = Math.max(sphere.radius, 1e-3);
                const fov = (camera.fov * Math.PI) / 180;
                const distance = (radius / Math.tan(fov / 2)) * 1.10;
                camera.near = Math.max(distance - radius * 5, 0.01);
                camera.far = distance + radius * 5;
                camera.position.set(0, 0, distance);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                setReady(true);

                // Paso 2: pausa + giro 180°
                setTimeout(() => {
                    rotateWorldY(model, Math.PI, ROTATE_MS, THREE);

                    // Paso 3: pausa + zoom-out (más pequeño) + más inclinación + mover a la izquierda
                    setTimeout(() => {
                        const targetScale = model.scale.x * STEP3.scaleFactor;
                        animateScaleTo(model, targetScale, STEP3.duration);

                        const targetEuler = new THREE.Euler(
                            model.rotation.x + STEP3.tiltX,         // más inclinación
                            model.rotation.y + STEP3.yawDelta,      // micro yaw
                            0,
                            "XYZ"
                        );
                        animateQuaternionTo(model, targetEuler, STEP3.duration, THREE);

                        const leftOffset = sphere.radius * STEP3.moveLeftK;
                        const toPos = new THREE.Vector3(model.position.x + leftOffset, model.position.y, model.position.z);
                        animatePositionTo(model, toPos, STEP3.duration, THREE);
                    }, ROTATE_MS + 1000); // pausa 1s tras el giro

                }, ZOOM_MS + HOLD_MS);

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
            if (renderer?.domElement && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
            renderer?.dispose?.();
            if (scene) scene.traverse((o) => { if (o.isMesh) o.geometry?.dispose?.(); });
        };
    }, [glbUrl]);

    return (
        <section className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`} aria-label="Sección NFC">
            <div ref={mountRef} className="nfc__viewer" />
        </section>
    );
}
export { NFC };
