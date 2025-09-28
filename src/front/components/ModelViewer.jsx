import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Ruta igual que la tuya: src/front/assets/models/prototipo.glb
const MODEL_URL = new URL("../assets/models/prototipo.glb", import.meta.url).href;

function Model({
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    rotate = true,
    color = 0xd9d9d9,
    pauseRotate = false,
}) {
    const group = useRef();
    const { scene } = useGLTF(MODEL_URL);

    useEffect(() => {
        if (!scene || !group.current) return;

        // Clon + centrado + normalización de altura (no toca tu escala visible final)
        const cloned = scene.clone(true);
        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        cloned.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 2.0;
        const baseFactor = targetHeight / (size.y || 1);

        cloned.traverse((obj) => {
            if (obj.isMesh) {
                obj.castShadow = false;
                obj.receiveShadow = false;
                obj.material = new THREE.MeshStandardMaterial({
                    color,
                    roughness: 0.9,
                    metalness: 0.0,
                });
            }
        });

        group.current.clear();
        group.current.add(cloned);
        group.current.scale.setScalar(baseFactor * scale);
        group.current.position.set(offsetX, offsetY, 0);
    }, [scene, scale, offsetX, offsetY, color]);

    // Auto-rotación suave sólo cuando procede
    useFrame((_, dt) => {
        if (rotate && !pauseRotate && group.current) {
            group.current.rotation.y += dt * 0.25;
        }
    });

    return <group ref={group} />;
}

export default function ModelViewer({
    scale = 1.0,
    offsetX = 0,
    offsetY = 0,
    rotate = true,
}) {
    const [interacting, setInteracting] = useState(false);

    // Distancia/cámara que ya estabas usando
    const CAMERA_POS = [0, 0, 4.3];
    const CAMERA_FOV = 33;

    // Para “girar sólo sobre su eje”, fijamos el ángulo polar a la altura del horizonte.
    // Dejamos un epsilon para que OrbitControls no se queje.
    const POLAR_EPS = 0.0001;
    const POLAR = Math.PI / 2;

    return (
        <div style={{ width: "100%", height: "100%", background: "transparent" }}>
            <Canvas
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
                camera={{ position: CAMERA_POS, fov: CAMERA_FOV, near: 0.1, far: 100 }}
            >
                {/* Luces y ambiente neutros */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[2, 3, 4]} intensity={1.0} />
                <directionalLight position={[-3, 2, 2]} intensity={0.6} />
                <Environment preset="city" blur={0.6} />

                {/* Modelo: la auto-rotación se pausa mientras el usuario arrastra */}
                <Model
                    scale={scale}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    rotate={rotate}
                    color={0xd9d9d9}
                    pauseRotate={interacting}
                />

                {/* Controles: sin zoom, sin pan, girando alrededor del offset del modelo */}
                <OrbitControls
                    makeDefault
                    enableZoom={false}
                    enablePan={false}
                    // bloqueamos la distancia para evitar zoom con rueda/touch
                    minDistance={CAMERA_POS[2]}
                    maxDistance={CAMERA_POS[2]}
                    target={[offsetX, offsetY, 0]}
                    // “sólo eje Y”: fijamos el polar en el ecuador
                    minPolarAngle={POLAR - POLAR_EPS}
                    maxPolarAngle={POLAR + POLAR_EPS}
                    rotateSpeed={0.8}
                    enableDamping
                    dampingFactor={0.08}
                    onStart={() => setInteracting(true)}
                    onEnd={() => setInteracting(false)}
                />
            </Canvas>
        </div>
    );
}

useGLTF.preload(MODEL_URL);
