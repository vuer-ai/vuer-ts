import { useMemo, useRef, } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Euler,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Side,
  Texture,
  Vector3,
} from 'three';
import { Plane } from '@react-three/drei';
import { Matrix16T, QuaternionT } from "../interfaces";

function interpolateTexture(texture: Texture, interpolate: boolean) {
  if (!texture) return;
  if (interpolate) {
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
  } else {
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
  }
}

export type ImagePlaneProps = {
  matRef?: React.MutableRefObject<MeshBasicMaterial>;
  rgb?: Texture;
  alpha?: Texture;
  depth?: Texture;
  depthScale?: number;
  depthBias?: number;
  distanceToCamera?: number;
  opacity?: number;
  position?: [ number, number, number ];
  rotation?: [ number, number, number ];
  quaternion?: QuaternionT;
  matrix?: Matrix16T;
  fixed?: boolean | undefined;
  side?: number;
  wireframe?: boolean;
  material?;
};

export default function ImagePlane(
  {
    matRef,
    rgb,
    alpha,
    depth,
    depthScale = 1,
    depthBias = 0,
    distanceToCamera = 10,
    position,
    rotation,
    quaternion,
    matrix,
    opacity = 1.0,
    fixed = false,
    side = 2,
    wireframe = false,
    material = {},
  }: ImagePlaneProps,
) {
  const planeRef = useRef<Mesh<PlaneGeometry>>();

  const { camera }: { camera: PerspectiveCamera | OrthographicCamera } = useThree();

  useFrame(() => {
    if (!planeRef.current) return;
    const plane = planeRef.current;
    // note: only works with perspective camera
    let h: number;
    let w: number;
    if (camera.type === 'PerspectiveCamera') {
      const c = camera as PerspectiveCamera;
      h = 2 * Math.tan((c.fov / 360) * Math.PI) * distanceToCamera;
      w = c.aspect * h;
      plane.scale.set(w, h, 1);
    } else if (camera.type === 'OrthographicCamera') {
      // handle Orthographic Camera
      const c = camera as OrthographicCamera;
      h = (c.top - c.bottom) / camera.zoom;
      w = (c.right - c.left) / camera.zoom;
      plane.scale.set(w, h, 1);
    } else {
      console.warn('Unsupported camera type', camera.type);
    }
    if (fixed) {
      if (matrix) {
        plane.matrix.fromArray(matrix);
        plane.matrixAutoUpdate = false;
        return
      }
      if (quaternion) plane.quaternion.fromArray(quaternion);
      else if (rotation) plane.rotation.set(...rotation);
      if (position) plane.position.set(...position);
      return;
    }

    if (matrix) {
      plane.matrixAutoUpdate = false;
      plane.matrix.fromArray(matrix);
      plane.matrix.premultiply(camera.matrixWorld);
      return
    }

    // @ts-ignore: use placeholder for scale.
    camera.matrixWorld.decompose(plane.position, camera.quaternion, []);
    if (quaternion) {
      plane.quaternion.fromArray(quaternion);
      plane.quaternion.premultiply(camera.quaternion);
    } else if (rotation) {
      plane.quaternion.setFromEuler(new Euler().fromArray(rotation))
      plane.quaternion.premultiply(camera.quaternion)
    } else {
      plane.quaternion.copy(camera.quaternion);
    }

    const [ x, y, z ] = position || [ 0, 0, 0 ]
    const dirVec = new Vector3(x, y, z - distanceToCamera).applyQuaternion(camera.quaternion);
    plane.position.add(dirVec)
  });

  const matProp = useMemo(() => {
    if (depth?.image) return { "displacementMap-colorSpace": NoColorSpace, ...material };
    return material;
  }, [ depth, material ]);

  const img = (rgb || depth)?.image;

  if (depth?.image) {
    return (
      <Plane
        ref={planeRef}
        args={[ 1, 1, img?.width, img?.height ]}
        scale={[ 1, 1, 1 ]}
      >
        <meshStandardMaterial
          attach="material"
          ref={matRef}
          map={rgb}
          alphaMap={alpha}
          displacementMap={depth}
          // invert it because depth is defined w.r.t plane.
          displacementScale={-depthScale}
          displacementBias={depthBias}
          wireframe={wireframe}
          transparent={!!alpha || typeof opacity == 'number'}
          opacity={opacity}
          side={side as Side}
          {...matProp}
        />
      </Plane>
    );
  } else return (
    <Plane
      ref={planeRef}
      args={[ 1, 1, img?.width, img?.height ]}
      scale={[ 1, 1, 1 ]}
    >
      <meshBasicMaterial
        attach="material"
        ref={matRef}
        map={rgb}
        alphaMap={alpha}
        displacementScale={-depthScale}
        displacementBias={depthBias}
        wireframe={wireframe}
        transparent={!!alpha || typeof opacity == 'number'}
        opacity={opacity}
        side={side as Side}
        // do not add the displacementMap color space attribute
        {...material}
      />
    </Plane>
  );
}
