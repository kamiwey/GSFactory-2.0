import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    Bounds,
    ContactShadows,
    Environment,
    Center,
    Html,
    useProgress,
    AdaptiveDpr,
    AdaptiveEvents,
} from "@react-three/drei";
import { STLLoader, OBJLoader, GLTFLoader, DRACOLoader } from "three-stdlib";
import * as THREE from "three";

/* ---------- Loader overlay ---------- */
function CanvasLoader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div
                style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "rgba(0,0,0,.45)",
                    border: "1px solid rgba(255,255,255,.25)",
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    backdropFilter: "blur(4px)",
                    fontSize: 14,
                    minWidth: 160,
                    textAlign: "center",
                }}
            >
                Cargando {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

/* ---------- Rotación global (no local) ---------- */
function AutoRotate({ speed = 0.045, axis = "y", children }) {
    const ref = useRef();
    const axisVec = useRef(
        axis === "x" ? new THREE.Vector3(1, 0, 0)
            : axis === "z" ? new THREE.Vector3(0, 0, 1)
                : new THREE.Vector3(0, 1, 0)
    );
    useFrame((_, dt) => ref.current?.rotateOnWorldAxis(axisVec.current, speed * dt));
    return <group ref={ref}>{children}</group>;
}

/* ---------- Modelo: STL / OBJ / GLB (con Draco) ---------- */
function Model({
    url,
    type = "glb",
    color = "#dddddd",
    dracoPath = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
}) {
    if (type === "stl") {
        const geom = useLoader(STLLoader, url);
        geom.computeVertexNormals?.();
        return (
            <mesh geometry={geom} castShadow receiveShadow>
                <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} />
            </mesh>
        );
    }
    if (type === "obj") {
        const obj = useLoader(OBJLoader, url);
        return <primitive object={obj} />;
    }
    // GLB/GLTF con soporte Draco
    const gltf = useLoader(
        GLTFLoader,
        url,
        (loader) => {
            const draco = new DRACOLoader();
            draco.setDecoderPath(dracoPath);
            draco.setCrossOrigin("anonymous");
            loader.setDRACOLoader(draco);
        }
    );
    return <primitive object={gltf.scene} />;
}

export default function ModelViewer({
    url,
    type = "glb",
    color = "#dddddd",
    autorotate = true,
    rotateSpeed = 0.045,
    rotateAxis = "y",
    up = "z",                 // Blender Z-up
    yaw = Math.PI,            // se sobreescribe desde el caller
    pitch = 0,
    roll = Math.PI,
    env = "city",
    height = "58vh",
    target = [0, 0, 0],
    dracoPath = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
}) {
    const upRotX = up === "z" ? Math.PI / 2 : 0;

    // Lazy-mount del canvas
    const wrapRef = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = wrapRef.current; if (!el) return;
        const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={wrapRef} style={{ width: "100%", height, borderRadius: 20, overflow: "hidden" }}>
            {visible && (
                <Canvas
                    dpr={[1, 1.5]}
                    frameloop={autorotate ? "always" : "demand"}
                    shadows
                    camera={{ position: [2.5, 1.5, 3], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
                    style={{ background: "transparent" }}
                >
                    <AdaptiveDpr pixelated />
                    <AdaptiveEvents />

                    <Suspense fallback={<CanvasLoader />}>
                        {env && <Environment preset={env} />}
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[5, 8, 5]} intensity={0.7} castShadow />

                        <Bounds fit clip observe margin={1.2}>
                            <Center>
                                {autorotate ? (
                                    <AutoRotate speed={rotateSpeed} axis={rotateAxis}>
                                        <group rotation={[upRotX + pitch, yaw, roll]}>
                                            <Model url={url} type={type} color={color} dracoPath={dracoPath} />
                                        </group>
                                    </AutoRotate>
                                ) : (
                                    <group rotation={[upRotX + pitch, yaw, roll]}>
                                        <Model url={url} type={type} color={color} dracoPath={dracoPath} />
                                    </group>
                                )}
                            </Center>
                        </Bounds>

                        <ContactShadows opacity={0.22} scale={8} blur={1.1} far={8} />
                        <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={target} />
                    </Suspense>
                </Canvas>
            )}
        </div>
    );
}
