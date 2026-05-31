import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_POSITION: [number, number, number] = [0, -0.5, -4];
const MODEL_ROTATION: [number, number, number] = [0, 0, 0];
const MODEL_SCALE = 1.15;

// Drag feel
const ROTATION_SPEED = 0.006;
const MAX_ROTATION = 0.8;

// Return feel
const RETURN_SPEED = 0.85; // smaller = slower return
const MOMENTUM_DAMPING = 2.4;

// Idle movement
const FLOAT_AMOUNT_Y = 0.06;
const FLOAT_AMOUNT_X = 0.05;
const FLOAT_AMOUNT_Z = 0.03;

function Model() {
    const { scene } = useGLTF("/buildpulse.glb");

    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    return <primitive object={clonedScene} dispose={null} />;
}

function FloatingModel() {
    const groupRef = useRef<THREE.Group>(null);
    const { gl } = useThree();

    const isDragging = useRef(false);
    const prev = useRef({ x: 0, y: 0 });
    const lastTime = useRef(0);

    const rotX = useRef(0);
    const rotY = useRef(0);

    const velX = useRef(0);
    const velY = useRef(0);

    useEffect(() => {
        const canvas = gl.domElement;

        const onPointerDown = (e: PointerEvent) => {
            // Only left mouse button
            if (e.button !== 0) return;

            isDragging.current = true;
            prev.current = { x: e.clientX, y: e.clientY };
            lastTime.current = e.timeStamp;

            canvas.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging.current) return;

            const dx = e.clientX - prev.current.x;
            const dy = e.clientY - prev.current.y;

            const dt = Math.max((e.timeStamp - lastTime.current) / 1000, 0.016);

            prev.current = { x: e.clientX, y: e.clientY };
            lastTime.current = e.timeStamp;

            const nextRotX = dy * ROTATION_SPEED;
            const nextRotY = dx * ROTATION_SPEED;

            rotX.current = THREE.MathUtils.clamp(
                rotX.current + nextRotX,
                -MAX_ROTATION,
                MAX_ROTATION
            );

            rotY.current = THREE.MathUtils.clamp(
                rotY.current + nextRotY,
                -MAX_ROTATION,
                MAX_ROTATION
            );

            // Momentum after release
            velX.current = nextRotX / dt;
            velY.current = nextRotY / dt;
        };

        const stopDragging = (e: PointerEvent) => {
            isDragging.current = false;

            if (canvas.hasPointerCapture(e.pointerId)) {
                canvas.releasePointerCapture(e.pointerId);
            }
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", stopDragging);
        canvas.addEventListener("pointercancel", stopDragging);

        return () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", stopDragging);
            canvas.removeEventListener("pointercancel", stopDragging);
        };
    }, [gl]);

    useFrame(({ clock }, delta) => {
        if (!groupRef.current) return;

        const time = clock.getElapsedTime();

        const idleX = Math.sin(time * 0.55) * FLOAT_AMOUNT_X;
        const idleY = Math.sin(time * 0.8) * FLOAT_AMOUNT_Y;
        const idleZ = Math.sin(time * 0.3) * FLOAT_AMOUNT_Z;

        groupRef.current.position.set(
            MODEL_POSITION[0] + idleX,
            MODEL_POSITION[1] + idleY,
            MODEL_POSITION[2] + idleZ
        );

        if (!isDragging.current) {
            // Keep a little momentum after the user releases
            rotX.current += velX.current * delta;
            rotY.current += velY.current * delta;

            const damping = Math.exp(-MOMENTUM_DAMPING * delta);
            velX.current *= damping;
            velY.current *= damping;

            // Slowly return to the original rotation
            const restore = 1 - Math.exp(-RETURN_SPEED * delta);

            rotX.current = THREE.MathUtils.lerp(rotX.current, 0, restore);
            rotY.current = THREE.MathUtils.lerp(rotY.current, 0, restore);
        }

        rotX.current = THREE.MathUtils.clamp(
            rotX.current,
            -MAX_ROTATION,
            MAX_ROTATION
        );

        rotY.current = THREE.MathUtils.clamp(
            rotY.current,
            -MAX_ROTATION,
            MAX_ROTATION
        );
        const SELF_ROTATE_Z = 0.35;
        const idleRotZ = Math.sin(time * 0.45) * SELF_ROTATE_Z;

        groupRef.current.rotation.set(
            MODEL_ROTATION[0] + rotX.current,
            MODEL_ROTATION[1] + rotY.current + idleRotZ,
            MODEL_ROTATION[2]
        );
    });

    return (
        <group ref={groupRef} scale={MODEL_SCALE}>
            <Center>
                <Model />
            </Center>
        </group>
    );
}

useGLTF.preload("/buildpulse.glb");

const Viewer = () => {
    return (
        <div className="absolute inset-y-0 right-20 z-20 hidden pointer-events-auto lg:block lg:w-[42%] xl:w-[38%]">
            <Canvas
                className="w-full h-full cursor-grab active:cursor-grabbing"
                style={{
                    touchAction: "none",
                }}
                camera={{ position: [0, 0.8, 5.2], fov: 35 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.15;
                }}
            >
                <ambientLight intensity={0.8} />
                <hemisphereLight args={["#ffffff", "#1e293b", 1.1]} />

                <directionalLight position={[4, 5, 6]} intensity={2.4} />
                <directionalLight position={[-4, 2, 3]} intensity={1.2} />

                <Suspense fallback={null}>
                    <FloatingModel />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Viewer;