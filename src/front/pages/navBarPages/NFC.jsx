import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/nfc.css";

export default function NFC() {
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);

    // Timings
    const ZOOM_MS = 1900;
    const HOLD_MS = 1000;
    const ROTATE_MS = 1400;
    const deg = (d) => (d * Math.PI) / 180;

    // Paso 3 (tus buenos)
    const STEP3 = {
        scaleFactor: 0.62,
        tiltX: deg(-45),
        yawDelta: deg(-30),
        rollZ: deg(-35),
        moveLeftK: -0.95,
        duration: 900,
    };

    // Paso 4: “pop” simultáneo (Y global)
    const POP = { pauseAfterPose: 500, distanceK: 0.03, duration: 140 };

    // Easing
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Helpers anim
    function zoomInOnLoad(object3D, { from = 0.05, to = 1.15, duration = 900 } = {}) {
        object3D.scale.setScalar(from);
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            object3D.scale.setScalar(from + (to - from) * easeOutCubic(t));
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function rotateWorldY(object3D, radians, duration, THREE) {
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

    function animateScaleTo(object3D, toScalar, duration = 800) {
        const from = object3D.scale.x;
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            object3D.scale.setScalar(from + (toScalar - from) * easeInOutCubic(t));
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function animateWorldTiltYawRoll(object3D, tiltX, yawY, rollZ, duration, THREE) {
        const startQ = object3D.quaternion.clone();
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltX);
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawY);
        const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollZ);
        const targetQ = qRoll.clone().multiply(qYaw).multiply(qPitch).multiply(startQ);
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const k = easeInOutCubic(t);
            object3D.quaternion.slerpQuaternions(startQ, targetQ, k);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function animatePositionTo(object3D, toVec3, duration = 900, THREE) {
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

    // ===== Detectar tapas por ALTURA EN MUNDO y en grupos raíz =====
    function getCapsByWorldY(model, THREE) {
        // 1) Preferir hijos directos (grupos raíz)
        const roots = model.children.filter(Boolean);
        const items = (roots.length ? roots : []).map((node) => {
            const box = new THREE.Box3().setFromObject(node);
            const center = box.getCenter(new THREE.Vector3()); // MUNDO
            const size = new THREE.Vector3(); box.getSize(size);
            const areaXZ = Math.abs(size.x * size.z);
            return { node, yWorld: center.y, areaXZ };
        });

        // 2) Si no hay grupos, caer a meshes
        if (!items.length) {
            model.traverse((o) => {
                if (o.isMesh) {
                    const box = new THREE.Box3().setFromObject(o);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = new THREE.Vector3(); box.getSize(size);
                    items.push({ node: o, yWorld: center.y, areaXZ: Math.abs(size.x * size.z) });
                }
            });
        }

        if (!items.length) return { top: null, bottom: null };

        // Top = mayor yWorld; Bottom = menor yWorld; romper empates con área XZ
        const top = items.slice().sort((a, b) => (b.yWorld - a.yWorld) || (b.areaXZ - a.areaXZ))[0].node;
        const bottom = items.slice().sort((a, b) => (a.yWorld - b.yWorld) || (b.areaXZ - a.areaXZ))[0].node;

        // Asegurar que no sean el mismo (si pasa, forzar segundo mejor)
        if (top === bottom && items.length > 1) {
            const alt = items.slice().sort((a, b) => (a.yWorld - b.yWorld) || (b.areaXZ - a.areaXZ))[1]?.node || bottom;
            return { top, bottom: alt };
        }
        return { top, bottom };
    }

    // ===== Mover parte en Y GLOBAL =====
    function popAlongWorldY(part, THREE, distance, duration) {
        if (!part || !isFinite(distance)) return;
        const axisWorld = new THREE.Vector3(0, 1, 0); // arriba de pantalla

        const startW = new THREE.Vector3();
        part.getWorldPosition(startW);

        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const k = easeOutCubic(t);
            const targetW = startW.clone().add(axisWorld.clone().multiplyScalar(distance * k));
            const parent = part.parent || part; // por si es root
            const targetL = parent.worldToLocal(targetW);
            part.position.copy(targetL);
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

        const start = async () => {
            try {
                // three sin nodes
                const threeMod = await import("https://unpkg.com/three@0.157.0/build/three.module.js?module");
                const loaders = await import("https://unpkg.com/three@0.157.0/examples/jsm/loaders/GLTFLoader.js?module");
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

                // Carga GLB
                const loader = new GLTFLoader();
                const gltf = await loader.loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                // Kill-switch `onBuild`: forzar MeshBasic (respeta color/tex, sin luces)
                model.traverse((o) => {
                    if (!o.isMesh) return;
                    const g = o.geometry;
                    const hasVColor = !!(g && g.attributes && g.attributes.color);
                    const src = o.material;
                    const baseColor = (src && src.color) ? src.color.clone() : new THREE.Color(0xffffff);
                    const mat = new THREE.MeshBasicMaterial({
                        color: baseColor,
                        map: src?.map || null,
                        side: THREE.DoubleSide,
                        transparent: !!src?.transparent,
                        opacity: (typeof src?.opacity === "number") ? src.opacity : 1
                    });
                    if (hasVColor) mat.vertexColors = true;
                    o.material = mat;
                });

                // Orientar/centrar
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3(); box.getSize(size);
                model.rotation.set(0, 0, 0);
                if (size.y < size.x && size.y < size.z) model.rotation.x = -Math.PI / 2;
                model.rotation.x += 0.08;
                const box2 = new THREE.Box3().setFromObject(model);
                const center = box2.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.rotation.y += Math.PI; // frontal a cámara

                const sphere = new THREE.Sphere(); box2.getBoundingSphere(sphere);
                model.position.y -= sphere.radius * 0.18;

                scene.add(model);

                // Cámara
                const radius = Math.max(sphere.radius, 1e-3);
                const fov = (camera.fov * Math.PI) / 180;
                const distance = (radius / Math.tan(fov / 2)) * 1.10;
                camera.near = Math.max(distance - radius * 5, 0.01);
                camera.far = distance + radius * 5;
                camera.position.set(0, 0, distance);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                setReady(true);

                // 1) Zoom-in
                zoomInOnLoad(model, { from: 0.05, to: 1.05, duration: ZOOM_MS });

                // 2) Giro 180°
                setTimeout(() => {
                    rotateWorldY(model, Math.PI, ROTATE_MS, THREE);

                    // 3) Zoom-out + pose + mover a la izquierda
                    setTimeout(() => {
                        animateScaleTo(model, model.scale.x * STEP3.scaleFactor, STEP3.duration);
                        animateWorldTiltYawRoll(model, STEP3.tiltX, STEP3.yawDelta, STEP3.rollZ, STEP3.duration, THREE);

                        const leftOffset = sphere.radius * STEP3.moveLeftK;
                        const toPos = new THREE.Vector3(model.position.x + leftOffset, model.position.y, model.position.z);
                        animatePositionTo(model, toPos, STEP3.duration, THREE);

                        // 4) POP simultáneo: top ↑ y bottom ↓ en Y GLOBAL (detecto por Y mundial)
                        setTimeout(() => {
                            const { top, bottom } = getCapsByWorldY(model, THREE);
                            const dy = radius * POP.distanceK;
                            if (top) popAlongWorldY(top, THREE, +dy, POP.duration); // arriba
                            if (bottom) popAlongWorldY(bottom, THREE, -dy, POP.duration); // abajo
                        }, STEP3.duration + POP.pauseAfterPose);

                    }, ROTATE_MS + 1000);
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
            if (renderer?.domElement && mountRef.current?.contains(renderer.domElement)) {
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
