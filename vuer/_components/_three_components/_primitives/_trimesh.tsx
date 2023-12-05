import {useMemo} from "react";
import {half2float} from "./_half2float";
import {MeshProps} from "@react-three/fiber";

enum Side { front, back, double }

type TriMeshProps = MeshProps & {
    vertices: Uint16Array;
    faces: Uint16Array;
    colors?: Uint8Array;
    color?: string;
    materialType?: "basic" | "standard" | "phong" | "lambert";
    wireframe?: boolean;
    opacity?: number;
    side?: "front" | "back" | "double";
};

type GeoCache = {
    vertices: Float32Array;
    faces: Uint32Array;
    colors?: Float32Array;
};

export function TriMesh(
    {
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        vertices,
        faces,
        colors,
        color,
        materialType = "standard",
        wireframe,
        opacity,
        side = "double",
        ...rest
    }: TriMeshProps
) {
    const geometry = useMemo<GeoCache>(() => {
        const byteRatio = Uint8Array.BYTES_PER_ELEMENT / Float32Array.BYTES_PER_ELEMENT;
        return {
            vertices: half2float(vertices),
            faces: new Uint32Array(faces.buffer.slice(faces.byteOffset), 0, byteRatio * faces.byteLength),
            colors: colors && Float32Array.from(colors, (octet) => octet / 0xff),
        };
    }, [vertices, faces, colors]);

    const MType =
        "mesh" +
        materialType.charAt(0).toUpperCase() +
        materialType.slice(1) +
        "Material";

    return (
        <mesh
            position={position}
            rotation={rotation}
            castShadow
            receiveShadow
            {...rest}
        >
            <bufferGeometry onUpdate={(self) => self.computeVertexNormals()}>
                <bufferAttribute
                    attach="attributes-position"
                    array={geometry.vertices}
                    count={geometry.vertices.length / 3}
                    itemSize={3}
                />
                {geometry.colors && (
                    <bufferAttribute
                        attach="attributes-color"
                        array={geometry.colors}
                        count={geometry.colors.length / 3}
                        itemSize={3}
                    />
                )}
                <bufferAttribute
                    attach="index"
                    array={geometry.faces}
                    count={geometry.faces.length}
                    itemSize={1}
                />
            </bufferGeometry>
            <MType
                attach="material"
                wireframe={wireframe}
                //only use vertex colors if it is provided.
                vertexColors={!!colors}
                color={color}
                transparent={true}
                alphaTest={1}
                opacity={opacity}
                // one of [0, 1, 2]
                side={Side[side]}
            />
        </mesh>
    );
}
