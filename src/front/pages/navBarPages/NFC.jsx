import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/nfc.css"; // <- tu ruta

const MODEL_URL = "/assets/model/llavero-completo.glb";

function NFC() {
    const mountRef = useRef(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let renderer, scene, camera, animationId;
        let model = null;
        let disposed = false;

        const mount = mountRef.current;
        const { clientWidth: W, clientHeight: H } = mount;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(W, H);
        mount.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(35, W / H, 0.01, 100);
        camera.position.set(0, 0, 3);
        scene.add(camera);

        const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.6);
        const key = new THREE.DirectionalLight(0xffffff, 0.9);
        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        key.position.set(2, 3, 4);
        fill.position.set(-2, 1.5, 2);
        scene.add(hemi, key, fill);

        const loader = new GLTFLoader();
        loader.load(
            MODEL_URL,
            (gltf) => {
                if (disposed) return;

                model = gltf.scene;
                scene.add(model);

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3()).length();
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                const targetSize = 1.6;
                const baseScale = targetSize / size;
                model.scale.setScalar(baseScale);

                // baja un poco el modelo
                const sphere = box.getBoundingSphere(new THREE.Sphere());
                const r = (sphere.radius || 1) * baseScale;
                model.position.y = -r * 0.15;

                // de frente
                model.rotation.set(0, 0, 0);

                const start = performance.now();
                const DURATION = 1100;
                const startScale = 0.15;
                const endScale = 1.0;

                function zoomIn() {
                    if (disposed) return;
                    const t = performance.now() - start;
                    const k = Math.min(t / DURATION, 1);
                    const ease = 1 - Math.pow(1 - k, 3);
                    const s = startScale + (endScale - startScale) * ease;
                    model.scale.setScalar(baseScale * s);
                    renderer.render(scene, camera);
                    if (k < 1) animationId = requestAnimationFrame(zoomIn);
                    else animationId = requestAnimationFrame(loop);
                }

                function loop() {
                    if (disposed) return;
                    renderer.render(scene, camera);
                    animationId = requestAnimationFrame(loop);
                }

                zoomIn();
            },
            undefined,
            (e) => {
                if (disposed) return;
                console.error("NFC GLB load error:", e);
                setError("No pude cargar el modelo.");
            }
        );

        function onResize() {
            if (!mount) return;
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        window.addEventListener("resize", onResize);

        return () => {
            disposed = true;
            window.removeEventListener("resize", onResize);
            if (animationId) cancelAnimationFrame(animationId);
            if (renderer) {
                renderer.dispose();
                mount.removeChild(renderer.domElement);
            }
            if (scene) {
                scene.traverse((o) => {
                    if (o.isMesh) {
                        o.geometry?.dispose?.();
                        const mats = Array.isArray(o.material) ? o.material : [o.material];
                        mats.forEach((m) => m?.dispose?.());
                    }
                });
            }
        };
    }, []);

    return (
        <section className="nfc-hero">
            <div ref={mountRef} className="nfc-canvas-wrap" aria-label="NFC model" />
            {error && <div className="nfc-error">{error}</div>}
        </section>
    );
}

export default NFC;
export { NFC };
