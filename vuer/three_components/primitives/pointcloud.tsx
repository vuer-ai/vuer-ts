import { PropsWithChildren, Ref, useMemo } from 'react';
import { Points } from 'three';
import { half2float } from './half2float';

type PointCloudProps = PropsWithChildren<{
  _key?: string;
  _ref?: Ref<Points>;
  // hide?: boolean;
  position?: [ number, number, number ];
  rotation?: [ number, number, number ];
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
    position = [ 0, 0, 0 ],
    rotation = [ 0, 0, 0 ],
    vertices,
    colors,
    size = 0.01,
    color,
    ...rest
  }: PointCloudProps,
) {

  const geometry = useMemo(() => ({
    /** note: use this to indicate the time of creation, and update the geometry when it changes.
     we do this to avoid the GL error. */
    now: Date.now(),
    vertices: half2float(vertices),
    colors: colors && Float32Array.from(colors, (octet) => octet / 0xff),
  }), [ vertices, colors ]);

  return (
    <points
      ref={_ref}
      // do this to avoid the GL error.
      key={_key + geometry.now}
      position={position}
      rotation={rotation}
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
        vertexColors={colors !== undefined}
        color={color}
        size={size}
      />
    </points>
  );
}
