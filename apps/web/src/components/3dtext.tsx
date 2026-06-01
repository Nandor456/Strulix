import { useEffect, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import helvetiker from "three/examples/fonts/helvetiker_regular.typeface.json";

import { cn } from "@/lib/utils";

type ThreeDTextProps = {
    text: string;
    className?: string;
    position?: [number, number, number];
    size?: number;
    depth?: number;
    color?: string;
    cameraPosition?: [number, number, number];
    cameraTarget?: [number, number, number];
};

type ThreeDTextMeshProps = Pick<
    ThreeDTextProps,
    "text" | "position" | "size" | "depth" | "color"
>;

function ThreeDTextMesh({
    text,
    position,
    size,
    depth,
    color,
}: ThreeDTextMeshProps) {
    const font = useMemo(() => {
        return new FontLoader().parse(helvetiker);
    }, []);

    const geometry = useMemo(() => {
        const geo = new TextGeometry(text, {
            font,
            size,
            depth,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.015,
            bevelSegments: 3,
        });

        geo.center();
        return geo;
    }, [text, font, size, depth]);

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    return (
        <mesh geometry={geometry} position={position}>
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
        </mesh>
    );
}

function SceneCamera({
    cameraPosition,
    cameraTarget,
}: {
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
}) {
    const { camera } = useThree();

    useLayoutEffect(() => {
        camera.position.set(...cameraPosition);
        camera.lookAt(...cameraTarget);
        camera.updateProjectionMatrix();
    }, [camera, cameraPosition, cameraTarget]);

    return null;
}

export function ThreeDText({
    text,
    className,
    position = [0, 0, 0],
    size = 0.6,
    depth = 0.12,
    color = "#fc0037",
    cameraPosition = [0, 0, 5],
    cameraTarget = position,
}: ThreeDTextProps) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none relative h-24 w-140 max-w-3xl sm:h-28 md:h-32 lg:h-36",
                className
            )}
        >
            <Canvas
                className="h-full w-full"
                camera={{
                    position: cameraPosition,
                    fov: 35,
                    near: 0.1,
                    far: 100,
                }}
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
                    gl.toneMappingExposure = 1.05;
                }}
            >
                <SceneCamera
                    cameraPosition={cameraPosition}
                    cameraTarget={cameraTarget}
                />
                <ambientLight intensity={0.95} />
                <directionalLight position={[-2.5, 1, 4]} intensity={0.5} color="#ffffff" />
                <directionalLight position={[2, 1, 4]} intensity={1} color="#ffffff" />
                <ThreeDTextMesh
                    text={text}
                    position={position}
                    size={size}
                    depth={depth}
                    color={color}
                />
            </Canvas>
        </div>
    );
}
