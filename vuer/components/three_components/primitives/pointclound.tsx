import { PropsWithChildren, Ref, useMemo } from 'react';
import { Euler, Points, Vector3 } from 'three';
import { half2float } from './half2float';

type PointCloudProps = PropsWithChildren<{
  _key?: string;
  _ref?: Ref<Points>;
  // hide?: boolean;
  position?: number[];
  rotation?: number[];
  vertices: Uint16Array;
  colors?: Uint8Array;
  size?: number;
  color?: string | number;
}>;

export function PointCloud(
  {
    _ref,
    _key,
    // hide,
    position,
    rotation,
    vertices,
    colors,
    size = 0.01,
    color,
    ...rest
  }: PointCloudProps,
) {
  const geometry = useMemo(() => ({
    position: position && new Vector3(...position),
    rotation: rotation && new Euler(...rotation),
    vertices: half2float(vertices),
    colors: colors && Float32Array.from(colors, (octet) => octet / 0xff),
  }), [ vertices, colors ]);

  return (
    <points
      ref={_ref}
      position={geometry.position}
      rotation={geometry.rotation}
      castShadow
      receiveShadow
      {...rest}
    >
      <bufferGeometry>
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
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        // only use vertex colors if it is provided.
        vertexColors
        color={color}
        size={size}
      />
    </points>
  );
}
