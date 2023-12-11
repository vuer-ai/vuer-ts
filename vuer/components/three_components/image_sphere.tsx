import { useEffect, useMemo, useRef, useState, } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PerspectiveCamera,
  Side,
  SphereGeometry,
  Texture, Vector2,
} from 'three';
import { Sphere } from '@react-three/drei';
import { useControls } from "leva";

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

export type ImageSphereProps = {
  matRef?: React.MutableRefObject<MeshBasicMaterial>;
  rgb?: Texture;
  alpha?: Texture;
  depth?: Texture;
  depthScale?: number;
  depthBias?: number;
  distanceToCamera?: number;
  opacity?: number;
  fixed?: boolean | undefined;
  side?: number;
  wireframe?: boolean;
  material?;
};

export default function ImageSphere(
  {
    matRef,
    rgb,
    alpha,
    depth,
    depthScale = 1,
    depthBias = 0,
    distanceToCamera = 1.0, // default to 1. for occlusion.
    opacity = 1.0,
    fixed = false,
    side = 2,
    wireframe = false,
    material = {},
  }: ImageSphereProps,
) {
  const sphereRef = useRef<Mesh<SphereGeometry>>();
  const [ fov, setFov ] = useState({ cxDeg: 0, cyDeg: 0 });

  const { camera }: { camera: PerspectiveCamera | OrthographicCamera } = useThree();

  // note: only works with perspective camera
  useEffect(() => {
    if (camera.type !== "PerspectiveCamera") {
      console.warn("ImageSphere only works with perspective camera");
      return;
    }
    const c = camera as PerspectiveCamera;
    const h = 2 * Math.tan((c.fov / 360) * Math.PI) * distanceToCamera;
    const w = c.aspect * h;

    const cyDeg = c.fov / 360 * Math.PI
    const cxDeg = Math.atan(Math.tan(cyDeg) * c.aspect)

    setFov({ cyDeg, cxDeg, h, w });

  }, [ camera, camera.fov, camera.aspect, distanceToCamera ]);

  useFrame(() => {
    if (!sphereRef.current) return;
    if (fixed) return;
    const sphere = sphereRef.current;
    sphere.rotation.copy(camera.rotation)
    sphere.position.copy(camera.position)
  });

  const matProp = useMemo(() => {
    if (depth?.image) return { "displacementMap-colorSpace": NoColorSpace, ...material };
    return material;
  }, [ depth, material ]);
  const { scale, offset } = useControls("debug", { scale: { value: depthScale }, offset: { value: depthBias } }, [])

  useEffect(() => {
    if (!rgb?.image) return;
    rgb.center = new Vector2(0.5, 0.5);
    rgb.rotation = Math.PI;
    // this won't work.
    // rgb.flipY = false;
  }, [ rgb ])

  useEffect(() => {
    if (!depth?.image) return;
    depth.center = new Vector2(0.5, 0.5);
    depth.rotation = Math.PI;
    // depth.flipY = false;
  }, [ depth ])

  useEffect(() => {
    if (!alpha?.image) return;
    alpha.center = new Vector2(0.5, 0.5);
    alpha.rotation = Math.PI;
    // alpha.flipY = false;
  }, [ alpha ])

  const img = (rgb || depth)?.image;

  if (depth?.image) {
    return (
      <Sphere
        ref={sphereRef}
        args={[ distanceToCamera, img?.width, img?.height, 1.5 * Math.PI - fov.cxDeg, 2 * fov.cxDeg, 0.5 * Math.PI - fov.cyDeg, 2 * fov.cyDeg ]}
        scale={[ 1, 1, 1 ]}
      >
        <meshStandardMaterial
          ref={matRef}
          attach="material"
          map={rgb}
          alphaMap={alpha}
          displacementMap={depth}
          // No need to invert because we are looking from inside.
          displacementScale={scale}
          displacementBias={offset}
          wireframe={wireframe}
          transparent={!!alpha || typeof opacity == 'number'}
          opacity={opacity}
          side={side as Side}
          {...matProp}
        />
      </Sphere>
    );
  } else return (
    <Sphere
      ref={sphereRef}
      // don't need this many grid. Prob.
      args={[ distanceToCamera, img?.width, img?.height, 1.5 * Math.PI - fov.cxDeg, 2 * fov.cxDeg, 0.5 * Math.PI - fov.cyDeg, 2 * fov.cyDeg ]}
      scale={[ 1, 1, 1 ]}
    >
      <meshBasicMaterial
        ref={matRef}
        attach="material"
        map={rgb}
        alphaMap={alpha}
        wireframe={wireframe}
        transparent={!!alpha || typeof opacity == 'number'}
        opacity={opacity}
        side={side as Side}
        // do not add the displacementMap color space attribute
        {...material}
      />
    </Sphere>
  );
}
