// src/front/pages/navBarPages/NFC.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "../styles/nfc.css";

export default function NFC() {
    const sectionRef = useRef(null);
    const mountRef = useRef(null);
    const [ready, setReady] = useState(false);

    // === CONFIG ================================================================
    const glbUrl = useMemo(() => "/assets/model/llavero-completo.glb", []);
    const VIEW_Y_OFFSET_K = -0.08;
    const CAMERA = { fov: 33 };
    const TONE = { exposure: 0.95 };

    // Luces base (valores finales a los que transicionaremos)
    const LIGHTS = {
        ambient: 0.20,
        hemiSky: 0x9fc7ff, hemiGround: 0x6b5e51, hemiIntensity: 0.35,
        key: { intensity: 1.00, pos: [1.8, 1.0, 2.6] },
        fill: { intensity: 0.50, pos: [-1.6, 0.6, 1.0] },
        rim: { intensity: 0.45, pos: [-2.2, 1.4, -2.1] }
    };

    // === Utils =================================================================
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function animateNumber(from, to, duration, onUpdate, onDone) {
        const s = performance.now();
        const f = (n) => {
            const t = Math.min(1, (n - s) / duration);
            const k = easeInOutCubic(t);
            onUpdate(from + (to - from) * k);
            if (t < 1) requestAnimationFrame(f);
            else onDone && onDone();
        };
        requestAnimationFrame(f);
    }

    function dollyCameraZ(camera, toZ, duration) {
        const fromZ = camera.position.z;
        const s = performance.now();
        const f = (n) => {
            const t = Math.min(1, (n - s) / duration);
            const k = easeInOutCubic(t);
            camera.position.z = fromZ + (toZ - fromZ) * k;
            if (t < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }

    useEffect(() => {
        let renderer, scene, camera, raf = 0;
        let introSpot, beamMesh;
        let amb, hemi, key, fill, rim;

        const mount = mountRef.current;
        if (!mount) return;

        const onResize = () => {
            if (!renderer || !camera) return;
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        };

        // Cono translúcido como haz visible
        function createSpotBeam(spot) {
            const beamDistance = 6;
            const radius = Math.tan(spot.angle) * beamDistance;
            const geo = new THREE.ConeGeometry(radius, beamDistance, 48, 1, true);
            geo.rotateX(Math.PI / 2);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.0,
                depthWrite: false,
                side: THREE.DoubleSide
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
            mesh.userData.updateBeam = () => {
                mesh.position.copy(spot.position);
                mesh.lookAt(spot.target.position);
            };
            mesh.userData.setOpacity = (v) => { mesh.material.opacity = v; };
            return mesh;
        }

        const start = async () => {
            try {
                // Renderer
                renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.physicallyCorrectLights = true;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = TONE.exposure;
                renderer.setClearColor(0x000000, 1); // blackout total al inicio
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                mount.appendChild(renderer.domElement);

                // Escena & cámara
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(
                    CAMERA.fov,
                    window.innerWidth / window.innerHeight,
                    0.01,
                    100
                );

                // Luces (arrancan a 0 para la intro)
                amb = new THREE.AmbientLight(0xffffff, 0.0); scene.add(amb);
                hemi = new THREE.HemisphereLight(LIGHTS.hemiSky, LIGHTS.hemiGround, 0.0); scene.add(hemi);
                key = new THREE.DirectionalLight(0xffffff, 0.0); key.position.set(...LIGHTS.key.pos); scene.add(key);
                fill = new THREE.DirectionalLight(0xffffff, 0.0); fill.position.set(...LIGHTS.fill.pos); scene.add(fill);
                rim = new THREE.DirectionalLight(0xffffff, 0.0); rim.position.set(...LIGHTS.rim.pos); scene.add(rim);

                // Spot cenital teatral
                introSpot = new THREE.SpotLight(0xffffff, 0.0, 25, Math.PI / 10, 0.25, 2.0);
                introSpot.position.set(0, 4.0, 0.0);
                introSpot.target.position.set(0, 0, 0);
                introSpot.castShadow = true;
                introSpot.shadow.mapSize.set(2048, 2048);
                introSpot.shadow.radius = 2;
                scene.add(introSpot);
                scene.add(introSpot.target);

                // Haz visible
                beamMesh = createSpotBeam(introSpot);
                scene.add(beamMesh);

                // GLB
                const gltf = await new GLTFLoader().loadAsync(glbUrl);
                const model = gltf.scene || gltf.scenes?.[0];
                if (!model) throw new Error("GLB sin escena válida");

                // Orientación / centrado
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

                model.traverse((o) => {
                    if (o.isMesh) {
                        o.castShadow = true;
                        o.receiveShadow = true;
                        const mats = Array.isArray(o.material) ? o.material : [o.material];
                        mats.forEach((m) => {
                            ["map", "emissiveMap", "metalnessMap", "roughnessMap", "normalMap", "aoMap"].forEach((k) => {
                                if (m[k] && m[k].isTexture && "colorSpace" in m[k]) m[k].colorSpace = THREE.SRGBColorSpace;
                            });
                        });
                    }
                });

                scene.add(model);

                // Cámara (arranca lejos para “acercarnos”)
                const radius = Math.max(sphere.radius, 1e-3);
                const fov = (camera.fov * Math.PI) / 180;
                const dist = (radius / Math.tan(fov / 2)) * 1.10;
                camera.near = Math.max(dist - radius * 5, 0.01);
                camera.far = dist + radius * 5;
                const distIntro = dist * 1.45;
                camera.position.set(0, 0, distIntro);
                camera.lookAt(0, 0, 0);
                camera.updateProjectionMatrix();

                setReady(true);

                // === SECUENCIA =========================================================
                const run = async () => {
                    // 1) Negro un poco más (tensión)
                    await wait(900);

                    // 2) Enciende foco + haz (fade-in)
                    animateNumber(0.0, 2.8, 900, (v) => {
                        introSpot.intensity = v;
                        if (beamMesh?.userData?.setOpacity) beamMesh.userData.setOpacity(Math.min(0.6, v / 3.2));
                    });

                    // 3) Mantén el foco solo 1s antes de movernos
                    await wait(1000);

                    // 4) Durante el ZOOM:
                    //    - sube iluminación global gradualmente hasta los valores finales
                    //    - el fondo hace fade de negro a color corporativo
                    //    - el canvas deja de ser negro opaco (alpha 0) para mostrar el fondo CSS
                    const DUR = 1800;
                    renderer.setClearColor(0x000000, 0); // deja ver el fondo CSS
                    sectionRef.current?.classList.add("nfc--bg-on");

                    // Ramp de luces simultáneo al dolly:
                    animateNumber(0, LIGHTS.ambient, DUR, (v) => (amb.intensity = v));
                    animateNumber(0, LIGHTS.hemiIntensity, DUR, (v) => (hemi.intensity = v));
                    animateNumber(0, LIGHTS.key.intensity, DUR, (v) => (key.intensity = v));
                    animateNumber(0, LIGHTS.fill.intensity, DUR, (v) => (fill.intensity = v));
                    animateNumber(0, LIGHTS.rim.intensity, DUR, (v) => (rim.intensity = v));

                    dollyCameraZ(camera, dist, DUR);
                    await wait(DUR + 100);

                    // Estado final de Fase 1: todo iluminado, fondo ya en color.
                };
                run();

                const render = () => {
                    if (beamMesh?.userData?.updateBeam) beamMesh.userData.updateBeam();
                    renderer.render(scene, camera);
                    raf = requestAnimationFrame(render);
                };
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
        <section ref={sectionRef} className={`nfc ${ready ? "nfc--ready" : "nfc--loading"}`} aria-label="Sección NFC">
            <div ref={mountRef} className="nfc__viewer" />
        </section>
    );
}

export { NFC };
