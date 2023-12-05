import {
  MutableRefObject, useContext, useLayoutEffect, useMemo, useRef,
} from 'react';
import {
  OrthographicCamera, PerspectiveCamera, Plane, useFBO,
} from '@react-three/drei';
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
} from 'three';
import { SocketContext, SocketContextType } from '../contexts/websocket.tsx';
import { Frustum } from './frustum.tsx';
import { VuerProps } from '../../interfaces.tsx';

type CameraViewProps = VuerProps<{
  hide?: boolean;
  width?: number;
  height?: number;
  matrix?: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
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
  // dpr?: number;
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
    origin = 'bottom-left', // "bottom-left" | "top-left" | "bottom-right" | "top-right"
    distanceToCamera = 0.5,
    ctype = 'perspective',
    showFrustum = true,
    stream = null, // one of [null, 'frame', 'time']
    // dpr = window.devicePixelRatio || 1,
    ...rest
  }: CameraViewProps,
) {
  const cameraRef = useRef() as MutableRefObject<tPerspectiveCamera | tOrthographicCamera>;
  const planeRef = useRef() as MutableRefObject<Mesh<PlaneGeometry>>;
  const frustum = useRef() as MutableRefObject<Group>;

  const { size, camera } = useThree() as {
    size: { width: number, height: number }, camera: tPerspectiveCamera
  };

  const dpr = window.devicePixelRatio || 1;
  const ratio = dpr ** 2;
  const fbo = useFBO(width * dpr, height * dpr);

  const m = useMemo(() => new Matrix4(), []);
  const offset = useMemo(() => new Vector3(), []);
  const { sendMsg } = useContext(SocketContext) as SocketContextType;

  useFrame(({ gl, scene }) => {
    if (!cameraRef.current) return;
    if (!planeRef.current) return;

    const plane = planeRef.current;
    const aspect = width / height;

    // @ts-ignore: aspect is only available on the PerspectiveCamera. Need to fix this.
    cameraRef.current.aspect = aspect;
    cameraRef.current.updateProjectionMatrix();

    // write to the framebuffer.
    plane.visible = false;
    if (frustum.current) frustum.current.visible = false;
    // gl.setSize(planeRef.current.width, planeRef.current.h);
    gl.setRenderTarget(fbo);
    gl.render(scene, cameraRef.current);
    gl.setRenderTarget(null);
    fbo.texture.colorSpace = NoColorSpace;
    plane.visible = true;
    if (frustum.current) frustum.current.visible = true;

    const ctx = gl.getContext();

    if (stream === 'frame') {
      // read from webgl context to array buffer.
      const pixelBuffer = new Uint8Array(width * height * ratio * 4);
      ctx.readPixels(
        0,
        0,
        width * dpr,
        height * dpr,
        ctx.RGBA,
        ctx.UNSIGNED_BYTE,
        pixelBuffer,
      );

      // if (dpr !== realDPR) {
      //   const logicRatio = (realDPR / dpr) ** 2;
      //   pixelBuffer = Uint8Array.from(pixelBuffer.filter((v, i) => [0, 4, 8, 12].indexOf(i % 16) > -1 ));
      // }

      // add png encoding
      setTimeout(() => {
        sendMsg({
          etype: 'RENDER',
          key,
          value: {
            dpr,
            width,
            height,
            frame: pixelBuffer,
          },
        });
      }, 0);
    }

    const vAspect = size.width / size.height;
    const dirVec = new Vector3(0, 0, -1).applyEuler(camera.rotation);
    // prettier-ignore
    let polarity;
    switch (origin) {
    case 'bottom-left':
      polarity = [-1, -1];
      break;
    case 'bottom-right':
      polarity = [1, -1];
      break;
    case 'top-left':
      polarity = [-1, 1];
      break;
    case 'top-right':
      polarity = [1, 1];
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
  }, 1);

  useLayoutEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    // @ts-ignore: aspect is only available on the PerspectiveCamera.
    cam.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height, cameraRef.current]);

  useLayoutEffect(() => {
    if (!cameraRef.current || !matrix || matrix.length !== 16) return;
    const cam = cameraRef.current;
    m.set(...matrix);
    m.decompose(cam.position, cam.quaternion, cam.scale);
    cam.rotation.setFromQuaternion(cam.quaternion);
    cam.updateProjectionMatrix();
  }, [matrix, cameraRef.current]);

  if (hide) return null;
  return (
    <>
      {showFrustum ? (
        <Frustum _ref={frustum} fov={fov} showFocalPlane={false} {...rest} />
      ) : null}
      <Plane
        ref={planeRef}
        key="rgb" // ref={} // args={[1, 1]}
        args={[1, 1, width, height]}
        renderOrder={1}
      >
        <meshBasicMaterial attach="material" map={fbo.texture} />
      </Plane>
      {ctype === 'perspective' ? (
        <PerspectiveCamera ref={cameraRef as MutableRefObject<tPerspectiveCamera>} fov={fov} {...rest} />
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
