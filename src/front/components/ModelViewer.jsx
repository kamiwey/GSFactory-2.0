import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = new URL("../assets/models/prototipo.glb", import.meta.url).href;

function Model({
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    rotate = true,
    color = 0xd9d9d9,
}) {
    const group = useRef();
    const { scene } = useGLTF(MODEL_URL);

    useEffect(() => {
        if (!scene || !group.current) return;

        const cloned = scene.clone(true);

        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        cloned.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 2.0; // <<--- AJUSTE: antes 2.2
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

    useFrame((_, dt) => {
        if (rotate && group.current) group.current.rotation.y += dt * 0.25;
    });

    return <group ref={group} />;
}

export default function ModelViewer({
    scale = 1.0,
    offsetX = 0,
    offsetY = 0,
    rotate = true,
}) {
    return (
        <div style={{ width: "100%", height: "100%", background: "transparent" }}>
            <Canvas
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
                camera={{ position: [0, 0, 4.3], fov: 33, near: 0.1, far: 100 }}
            >
                <ambientLight intensity={0.8} />
                <directionalLight position={[2, 3, 4]} intensity={1.0} />
                <directionalLight position={[-3, 2, 2]} intensity={0.6} />
                <Environment preset="city" blur={0.6} />

                <Model
                    scale={scale}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    rotate={rotate}
                    color={0xd9d9d9}
                />
            </Canvas>
        </div>
    );
}

useGLTF.preload(MODEL_URL);
