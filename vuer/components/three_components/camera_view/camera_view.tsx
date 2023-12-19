import React, { MutableRefObject, useContext, useEffect, useLayoutEffect, useMemo, useRef, } from 'react';
import { OrthographicCamera, PerspectiveCamera, Plane, useFBO, } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Group,
  Matrix4,
  Mesh,
  NoColorSpace,
  OrthographicCamera as tOrthographicCamera,
  PerspectiveCamera as tPerspectiveCamera,
  PlaneGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { SocketContext, SocketContextType } from '../../contexts/websocket';
import { Frustum } from '../frustum';
import { VuerProps } from '../../../interfaces';
import { Movable } from "../controls/movables";
import { useControls } from "leva";

type CameraViewProps = VuerProps<{
  hide?: boolean;
  width?: number;
  height?: number;
  matrix?: [ number, number, number, number, number, number, number, number, number, number, number, number, number,
    number, number, number ];
  fov?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  origin?: 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right';
  distanceToCamera?: number;
  ctype?: 'perspective' | 'orthographic';
  showFrustum?: boolean;
  stream?: null | 'frame' | 'time';
  downsample?: number;
  fps?: number;
  quality?: number;
  position?: [ number, number, number ];
  rotation?: [ number, number, number ];
  monitor?: boolean;
}>;

export function CameraView(
  {
    _ref,
    _key: key,
    hide,
    width = 640,
    height = 480,
    // the world matrix of the camera
    matrix,
    // used for perspective camera
    fov = 60,
    // used for orthographic camera
    top = 1,
    bottom = -1,
    left = -1,
    right = 1,
    // used for positioning of the view
    origin = 'top-left', // "bottom-left" | "top-left" | "bottom-right" | "top-right"
    distanceToCamera = 0.5,
    ctype = 'perspective',
    showFrustum = true,
    stream = null, // one of [null, 'frame', 'time']
    fps = 30,
    downsample = 2,
    quality = 1,
    monitor = true,
    ...rest
  }: CameraViewProps,
) {
  const cameraRef = useRef() as MutableRefObject<tPerspectiveCamera | tOrthographicCamera>;
  const planeRef = useRef() as MutableRefObject<Mesh<PlaneGeometry>>;
  const frustum = useRef() as MutableRefObject<Group>;
  const frustumHandle = useRef() as MutableRefObject<Mesh>

  const timingCache = useMemo(() => ({
    sinceLastFrame: 0,
  }), []);

  const { size, camera } = useThree() as {
    size: { width: number, height: number }, camera: tPerspectiveCamera
  };
  const dpr = window.devicePixelRatio || 1;
  // the output buffer size does not depend on this resolution.
  const fbo = useFBO(width * dpr, height * dpr,);
  const renderer = useMemo(() => {
    const r = new WebGLRenderer({
      canvas: new OffscreenCanvas(width / downsample, height / downsample),
      antialias: true, precision: 'highp', preserveDrawingBuffer: true,
      depth: true,
    });
    r.setPixelRatio(dpr)
    return r;
  }, [ width, height, dpr ]);

  const m = useMemo(() => new Matrix4(), []);
  const offset = useMemo(() => new Vector3(), []);
  const { sendMsg } = useContext(SocketContext) as SocketContextType;

  const { _fov } = useControls(key ? `Scene.Camera-${key}` : "Scene.Camera", {
    _fov: {
      value: fov,
      min: 0,
      max: 180
    }
  }, [ fov ]);


  const sinceLastFrame = useRef({});

  useFrame(({ gl, scene }, delta) => {
    timingCache.sinceLastFrame += delta;

    if (!cameraRef.current) return;

    const aspect = width / height;

    // @ts-ignore: aspect is only available on the PerspectiveCamera. Need to fix this.
    cameraRef.current.aspect = aspect;
    cameraRef.current.updateProjectionMatrix();

    if (frustumHandle.current) {
      cameraRef.current.matrixAutoUpdate = false
      cameraRef.current.matrix.copy(frustumHandle.current.matrix);
    }

    if (timingCache.sinceLastFrame > (1 / fps) && stream === 'frame') {
      timingCache.sinceLastFrame = 0;

      const ctx = renderer.getContext();
      let w = renderer.domElement.width;
      let h = renderer.domElement.height;

      if (planeRef?.current) planeRef.current.visible = false;
      if (frustum?.current) frustum.current.visible = false;
      renderer.render(scene, cameraRef.current);

      const rgbArrayBuffer = new Uint8Array(w * h * 4);
      ctx.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, rgbArrayBuffer);
      // @ts-ignore: this is okay.
      const canvas = renderer.domElement as OffscreenCanvas;
      canvas.convertToBlob({ quality, type: "image/jpeg" }).then((blob) => {
        blob.arrayBuffer().then((array: ArrayBuffer) => {
          const payload = {
            etype: 'CAMERA_VIEW',
            key,
            value: {
              dpr,
              delta: sinceLastFrame,
              width,
              height,
              frame: new Uint8Array(array),
            },
          }
          sendMsg(payload);
        })
      })
    }

    if (!!monitor && planeRef?.current) {
      const plane = planeRef.current;

      plane.visible = false;
      if (frustum.current) frustum.current.visible = false;
      gl.setRenderTarget(fbo);
      gl.render(scene, cameraRef.current);
      gl.setRenderTarget(null);
      fbo.texture.colorSpace = NoColorSpace;
      plane.visible = true;
      if (frustum.current) frustum.current.visible = true;

      const vAspect = size.width / size.height;
      const dirVec = new Vector3(0, 0, -1).applyEuler(camera.rotation);
      // prettier-ignore
      let polarity;
      switch (origin) {
      case 'bottom-left':
        polarity = [ -1, -1 ];
        break;
      case 'bottom-right':
        polarity = [ 1, -1 ];
        break;
      case 'top-left':
        polarity = [ -1, 1 ];
        break;
      case 'top-right':
        polarity = [ 1, 1 ];
        break;
      }
      // prettier-ignore
      const horizontal = Math.tan((camera.fov / 360) * Math.PI);
      offset
        .set(
          polarity[0] * (1 - width / size.width) * vAspect * horizontal,
          polarity[1] * (1 - height / size.height) * horizontal,
          0,
        )
        .applyEuler(camera.rotation);

      const h = 2 * horizontal * distanceToCamera;
      const w = aspect * h;
      const scale = height / size.height;

      plane.scale.set(w * scale, h * scale, 1);
      // plane.scale.set(w * scale, h * scale, 1);
      // do the pointing first to make align with image plane
      plane.position
        .copy(camera.position)
        .addScaledVector(dirVec, distanceToCamera);
      plane.lookAt(camera.position);
      plane.position.addScaledVector(offset, distanceToCamera);

    }

    if (planeRef?.current) planeRef.current.visible = true;
    if (frustum?.current) frustum.current.visible = true;

  }, 1);

  useLayoutEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    // @ts-ignore: aspect is only available on the PerspectiveCamera.
    cam.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [ width, height, cameraRef.current ]);

  useLayoutEffect(() => {
    if (!cameraRef.current || !matrix || matrix.length !== 16) return;
    const cam = cameraRef.current;
    m.set(...matrix);
    m.decompose(cam.position, cam.quaternion, cam.scale);
    cam.rotation.setFromQuaternion(cam.quaternion);
    cam.updateMatrix()
  }, [ matrix, cameraRef.current ]);

  if (hide) return null;
  return (
    <>
      {showFrustum ? (
        <Movable _ref={frustumHandle} {...rest}>
          <Frustum _ref={frustum} fov={_fov} showFocalPlane={false}/>
        </Movable>
      ) : null}
      {monitor ?
        <Plane
          ref={planeRef}
          key="rgb" // ref={} // args={[1, 1]}
          args={[ 1, 1, width, height ]}
          renderOrder={1}
        >
          <meshBasicMaterial attach="material" map={fbo.texture}/>
        </Plane>
        : null}
      {ctype === 'perspective' ? (
        <PerspectiveCamera ref={cameraRef as MutableRefObject<tPerspectiveCamera>} fov={_fov} {...rest} />
      ) : null}
      {ctype === 'orthographic' ? (
        <OrthographicCamera
          ref={cameraRef as MutableRefObject<tOrthographicCamera>}
          top={top}
          bottom={bottom}
          left={left}
          right={right}
          {...rest}
        />
      ) : null}
    </>
  );
}
