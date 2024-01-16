import React, { MutableRefObject, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, } from 'react';
import { OrthographicCamera, PerspectiveCamera, Plane, useFBO, } from '@react-three/drei';
import { RootState, useFrame, useThree } from '@react-three/fiber';
import {
  Group,
  Mesh,
  NoColorSpace,
  OrthographicCamera as tOrthographicCamera,
  PerspectiveCamera as tPerspectiveCamera,
  PlaneGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Frustum } from '../frustum';
import { Movable } from "../controls/movables";
import { useControls } from "leva";
import { VuerProps } from "../../interfaces";
import { SocketContext, SocketContextType } from "../../html_components/contexts/websocket";
import { GrabRenderEvent } from "./GrabRender";

type CameraViewProps = VuerProps<{
  hide?: boolean;
  width?: number;
  height?: number;
  matrix?: [ number, number, number, number, number, number, number, number, number, number, number, number, number,
    number, number, number ];
  fov?: number;
  aspect?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  near?: number;
  far?: number;
  origin?: 'bottom-left' | 'top-left' | 'bottom-right' | 'top-right';
  distanceToCamera?: number;
  ctype?: 'perspective' | 'orthographic';
  showCamera?: boolean;
  scale?: number;
  showFrustum?: boolean;
  stream?: null | 'frame' | 'time' | 'ondemand';
  downsample?: number;
  fps?: number;
  quality?: number;
  position?: [ number, number, number ];
  rotation?: [ number, number, number ];
  monitor?: boolean;
  movable?: boolean;
}>;

type PerspParams = {
  fov: number;
  aspect: number;
}
type OrthoParams = {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
type ComonP = {
  near: number;
  far: number;
  showImagePlane: boolean;
  showFrustum: boolean;
};

export function CameraView(
  {
    _ref,
    _key,
    hide,
    width = 640,
    height = 480,
    // the world matrix of the camera
    matrix,
    // used for perspective camera
    fov = 60,
    aspect,
    // used for orthographic camera, not feature-complete yet.
    top = 1,
    bottom = -1,
    left = -1,
    right = 1,
    // near and far clipping plane, affects the value of the depth material
    near = 0.1,
    far = 20,
    // used for positioning of the view
    origin = 'top-left', // "bottom-left" | "top-left" | "bottom-right" | "top-right"
    distanceToCamera = 0.5,
    ctype = 'perspective',
    showCamera = true,
    scale = 10,
    showFrustum = true,
    stream = null, // one of [null, 'frame', 'time']
    fps = 30,
    downsample = 2,
    quality = 1,
    monitor = true,
    movable = true,
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

  const { size, camera, scene } = useThree() as RootState & {
    camera: tPerspectiveCamera;
  }
  const dpr = window.devicePixelRatio || 1;
  // the output buffer size does not depend on this resolution.
  const fbo = useFBO(width * dpr, height * dpr,);

  const offset = useMemo(() => new Vector3(), []);
  const { sendMsg, downlink, uplink } = useContext(SocketContext) as SocketContextType;

  const ctrl = useControls(_key ? `Scene.Camera-${_key}` : "Scene.Camera", {
    showCamera: { value: showCamera, label: "Show" },
    camType: { value: ctype, options: [ 'perspective', 'orthographic' ] },
  }, [ showCamera ]);

  const commonParams: ComonP = useControls(_key ? `Scene.Camera-${_key}` : "Scene.Camera", {
    near: { value: near, min: 0.001, step: 0.05 },
    far: { value: far, min: 0.1, step: 0.1 },
    showImagePlane: { value: true, label: "Image Plane" },
    scale: { value: scale, min: 0.1, step: 0.1 },
    showFrustum: { value: showFrustum, label: "Frustum" },
  }, [ near, far, showFrustum ]);

  const persp: PerspParams = useControls(_key ? `Scene.Camera-${_key}` : "Scene.Camera",
    (ctrl.camType === 'perspective') ? {
      fov: { value: fov, min: 0, max: 170 },
      aspect: { value: aspect || width / height, min: 0.1, max: 10 }
    } : {}, [ ctrl.camType, fov, width, height ]);

  const ortho: OrthoParams = useControls(_key ? `Scene.Camera-${_key}` : "Scene.Camera",
    (ctrl.camType === "orthographic") ? {
      top: { value: top, min: -10, step: 0.1 },
      bottom: { value: bottom, min: -10, step: 0.1 },
      left: { value: left, min: -10, step: 0.1 },
      right: { value: right, min: -10, step: 0.1 },
    } : {}, [ ctrl.camType, top, bottom, left, right ]);

  const renderer = useMemo(() => {
    const r = new WebGLRenderer({
      canvas: new OffscreenCanvas(width / downsample, height / downsample),
      antialias: true, precision: 'highp', preserveDrawingBuffer: true,
      depth: true,
    });
    r.setPixelRatio(dpr)
    return r;
  }, [ dpr, height, width, downsample ]);

  useEffect(() => {
    // const aspect = width / height;
    let aspect;
    if (ctrl.camType === 'perspective') {
      aspect = persp.aspect;
    } else {
      aspect = (ortho.right - ortho.left) / (ortho.top - ortho.bottom);
    }
    /* note: setting the updateStyle to `false`, to avoid the error. OffScreenCanvas lack styling attribute. */
    renderer.setSize(Math.floor(aspect * height / downsample), Math.floor(height / downsample), false);
    renderer.setPixelRatio(dpr)
    /* Remember to also update the FBO */
    fbo.setSize(aspect * height * dpr, height * dpr);
  }, [ dpr, height, width, downsample, persp.aspect, ortho.top, ortho.bottom, ortho.left, ortho.right, ctrl.camType ]);

  const onMove = useCallback(() => {
    if (!frustumHandle.current || !cameraRef.current) return;
    const cam = cameraRef.current;
    const moveHandle = frustumHandle.current;

    cam.matrixAutoUpdate = false;
    cam.matrix.copy(moveHandle.matrix);

    sendMsg({
      etype: "CAMERA_MOVE", key: _key, value: {
        matrix: cam.matrix.toArray()
      }
    })

  }, [ frustumHandle.current, cameraRef.current, sendMsg ])

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
    cam.matrixAutoUpdate = false;
    cam.matrix.fromArray(matrix)

    const f = movable ? frustumHandle?.current : frustum?.current;
    if (!f) return;

    f.matrixAutoUpdate = false;
    f.matrix.fromArray(matrix);

  }, [ matrix, cameraRef.current ]);

  const sinceLastFrame = useRef({});

  useFrame(({ gl, scene }, delta) => {
    timingCache.sinceLastFrame += delta;

    if (!cameraRef.current) return;

    // const aspect = width / height;
    let aspect;
    if (ctrl.camType === 'perspective') {
      aspect = persp.aspect;
    } else {
      aspect = (ortho.right - ortho.left) / (ortho.top - ortho.bottom);
    }

    // @ts-ignore: aspect is only available on the PerspectiveCamera. Need to fix this.
    cameraRef.current.aspect = aspect;
    cameraRef.current.updateProjectionMatrix();

    // note: we do not render these frames if the stream is 'ondemand'
    if (timingCache.sinceLastFrame > (1 / fps) && stream === 'frame') {
      timingCache.sinceLastFrame = 0;

      const ctx = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;

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
            key: _key,
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

    // wow I render so many times!
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

      // this is the view-port aspect ratio, different from the camera aspect ratio.
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
          polarity[0] * (1 - aspect * height / size.width) * vAspect * horizontal,
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

  useEffect(() => {
    if (!downlink) return;
    // Only add the render listener if we are in ondemand mode.
    if (stream !== 'ondemand') return;

    const remove_handler = downlink.subscribe("GRAB_RENDER", ({
      key,
      rtype,
      data: { quality = 1 }
    }: GrabRenderEvent) => {
      if (!cameraRef.current) return;
      if (key !== _key) return;

      const ctx = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;

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
            etype: rtype || `GRAB_RENDER_RESPONSE`,
            key,
            value: {
              dpr,
              // todo: need to add timing
              // delta,
              width,
              height,
              frame: new Uint8Array(array),
            },
          };
          sendMsg(payload);
        })
      })
    });

    return remove_handler;

  }, [ sendMsg, downlink, uplink, downsample ]);


  if (hide) return null;
  return (
    <>
      {(ctrl.showCamera && !movable) ? (
        <Frustum _ref={frustum} {...persp} {...commonParams} showFocalPlane={false} {...rest}/>
      ) : null}
      {(ctrl.showCamera && movable) ? (
        <Movable _ref={frustumHandle} onMove={onMove} {...rest}>
          <Frustum _ref={frustum} {...persp} {...commonParams} showFocalPlane={false}/>
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
      {ctrl.camType === 'perspective' ? (
        <PerspectiveCamera
          ref={cameraRef as MutableRefObject<tPerspectiveCamera>}
          near={commonParams.near}
          far={commonParams.far}
          {...persp}
          {...rest}
        />
      ) : null}
      {ctrl.camType === 'orthographic' ? (
        <OrthographicCamera
          ref={cameraRef as MutableRefObject<tOrthographicCamera>}
          near={commonParams.near}
          far={commonParams.far}
          {...ortho}
          {...rest}
        />
      ) : null}
    </>
  );
}
