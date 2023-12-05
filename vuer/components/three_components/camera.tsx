import {
  MutableRefObject, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef,
} from 'react';
import {
  invalidate, RootState, useFrame, useThree,
} from '@react-three/fiber';
import {
  CameraHelper as CH,
  Euler,
  Matrix4,
  OrthographicCamera as tOrthographicCamera,
  PerspectiveCamera as tPerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three';

import { OrbitControls as tOrbitControls } from 'three-stdlib';

import {
  CubeCamera, Html, OrbitControls, OrthographicCamera, PerspectiveCamera, useHelper,
} from '@react-three/drei';
import { useControls } from 'leva';
import queryString from 'query-string';
import { document } from '../../lib/browser-monads';
import { SocketContext, SocketContextType } from '../contexts/websocket.tsx';
import { VuerProps } from '../../interfaces.tsx'; // import {Line} from "./_primitives";
// import {Line} from "./_primitives";

const CAMERA_TYPES = {
  PerspectiveCamera,
  OrthographicCamera,
  CubeCamera,
};

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function equals(aArr: number[], bArr: number[]): boolean {
//     for (let i = 0; i < aArr.length; i++) {
//         if (aArr[i] !== bArr[i]) return false;
//     }
//     return true;
// }

type Sim3Type = {
  matrix: Matrix4;
  position: Vector3;
  rotation: Euler;
  quaternion: Quaternion;
  scale: Vector3;
};

type CameraProps = VuerProps<{
  animate?: boolean | ((camera: tOrthographicCamera | tPerspectiveCamera, state: RootState) => void);
  type?: keyof typeof CAMERA_TYPES;
  label?: string;
  near?: number;
  far?: number;
  fov?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}>;

export function Camera(
  {
    _ref,
    animate,
    type = 'PerspectiveCamera',
    // not used
    label,
    near = 0.1,
    far = 0.2,
    fov = 75,
    position,
    rotation,
    matrix,
    makeDefault = false,
    helper = false,
    ..._props
  }: CameraProps,
) {
  const ref = useRef() as MutableRefObject<tOrthographicCamera | tPerspectiveCamera>;

  useHelper(helper ? ref : null, CH);

  const t = useMemo<Vector3>(() => new Vector3(0, 0, 0), []);
  const cache = useMemo<Sim3Type>(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(0, 0, 0),
      rotation: new Euler(0, 0, 0),
      quaternion: new Quaternion(0, 0, 0, 0),
      scale: new Vector3(0, 0, 0),
    }),
    [],
  );

  useEffect(() => {
    if (ref.current && matrix) {
      const cam: tPerspectiveCamera | tOrthographicCamera = ref.current;
      cache.matrix.fromArray(matrix);
      cache.matrix.decompose(cam.position, cache.quaternion, cam.scale);
      cam.rotation.setFromQuaternion(cache.quaternion);
      cam.updateMatrixWorld(true);
      cam.updateWorldMatrix(true, true);
      invalidate();
    }
  }, [ ref.current, ...(matrix || []) ]);

  useEffect(() => {
    if (!ref.current) return;
    const cam = ref.current as tPerspectiveCamera;
    cam.near = near;
    cam.far = far;
    // @ts-ignore: fov is only available on the PerspectiveCamera.
    cam.fov = fov;
  }, [ ref.current, fov, near, far ]);

  useFrame((state) => {
    if (!animate) return;
    if (!ref.current) return;
    if (typeof animate === 'function') {
      animate(ref.current, state);
      ref.current.lookAt(t);
    } else {
      // go to the target
      console.log('animated camera motion is not implemented yet');
    }
  });

  // @ts-ignore: let it be right now.
  const Component = CAMERA_TYPES[type];

  return (
    <>
      {/* @ts-ignore: disable this check now. */}
      <Component
        ref={ref}
        position={position || undefined}
        rotation={rotation || undefined}
        makeDefault={makeDefault}
        {..._props}
      />
      {(label && label.length) ? (
        <Html
          wrapperClass="label"
          as="span"
          style={{
            display: 'inline-block',
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem 0.25rem 0.5rem ',
            background: 'white',
            color: 'black',
            width: 'max-content',
            maxWidth: '200px',
            height: 'fit-content',
          }}
        >
          {' '}
          {label}
          {' '}

        </Html>
      ) : null}
    </>
  );
}

// type  WhenCameraMovesType = {
//     onMove: (camera: Camera) => void;
// }
//
// export function WhenCameraMoves({onMove}) {
//     const mat = useMemo(() => new Matrix4());
//     const throttled = useCallback(
//         _throttle(
//             ({camera}) => {
//                 if (typeof onMove !== "function") return;
//                 if (mat.equals(camera.matrixWorld)) return;
//                 const a = mat.toArray();
//                 const b = camera.matrixWorld.toArray();
//                 // make a variable for the L1 distance between the two matrices
//                 const d = a.reduce((acc, v, i) => acc + Math.abs(v - b[i]), 0);
//                 if (d < 0.0005) return;
//                 // use copy, because camera matrix is updated in-place.
//                 mat.copy(camera.matrixWorld);
//                 // prettier-ignore
//                 const {
//                     name, type, far, near, focus,
//                     aspect, fov,
//                     up, position, rotation, matrix, matrixWorld, projectionMatrix,
//                 } = camera;
//                 // prettier-ignore
//                 if (!onMove) return;
//                 onMove({
//                     type, aspect, far, focus, fov,
//                     matrix: matrix.elements,
//                     matrixWorld: matrixWorld.elements,
//                     name, near,
//                     position: position.toArray(),
//                     rotation: rotation.toArray(),
//                     projectionMatrix: projectionMatrix.elements,
//                     up,
//                 });
//             },
//             16,
//             {leading: true, trailing: true}
//         ),
//         [onMove]
//     );
//     useFrame(throttled, -1);
// }

// note: experimental-delete
export function SmoothCamera() {
  const perspectiveCam = useRef() as MutableRefObject<tPerspectiveCamera>;
  const orthoCam = useRef() as MutableRefObject<tOrthographicCamera>;
  const { get, set } = useThree(({ get, set }) => ({ get, set }));

  const { type, ...controls } = useControls('Camera Control', {
    type: { value: 'Perspective', options: [ 'Perspective', 'Orthographic' ] },
    position: { value: [ 0, 2, 10 ], step: 0.1 },
    // prettier-ignore
    near: 0.1,
    far: 100,
    // orthographic
    fov: 50,
    zoom: 100,
  });

  useEffect(() => {
    if (type === 'Perspective') {
      set({ camera: perspectiveCam.current });
    } else {
      set({ camera: orthoCam.current });
    }
  }, [ get, set, type ]);

  return (
    <>
      <PerspectiveCamera
        name="3d"
        ref={perspectiveCam}
        // position={[0, 2, 10]}
        fov={50}
        near={controls.near}
        far={controls.far}
      />
      <OrthographicCamera
        name="2d"
        ref={orthoCam}
        // position={[0, 2, 0]}
        zoom={100}
        near={controls.near}
        far={controls.far}
        left={window.innerWidth / -2}
        right={window.innerWidth / 2}
        top={window.innerHeight / 2}
        bottom={window.innerHeight / -2}
      />
    </>
  );
}

function zoomToFov(zoom: number, orbit_distance: number, viewHeight: number): number {
  // console.log("zoom to fov", zoom, orbit_distance, viewHeight);
  // when zoom is 1, should capture [-1, 1] in the world box
  const physicalViewHeight = viewHeight / zoom;
  const fov = (360 / Math.PI) * Math.atan(physicalViewHeight / (2 * orbit_distance));
  return fov;
}

function fovToZoom(fov: number, orbit_distance: number, viewHeight: number): number {
  // console.log("fov to zoom", fov, orbit_distance, viewHeight);
  const physicalViewHeight = 2 * orbit_distance * Math.tan((fov / 360) * Math.PI);
  const zoom = viewHeight / physicalViewHeight;
  return zoom;
}

type KeyboardControlsType = {
  parent: HTMLElement;
  // control: MutableRefObject<tOrbitControls>;
  controls: tOrbitControls;
  panSpeed?: number;
  viewHeight: number;
  // fov?: number;
  // zoom?: number;
  // left?: number;
  // right?: number;
  // top?: number;
  // bottom?: number;
};

export function KeyboardControls(
  {
    parent,
    controls,
    panSpeed = 0.016,
    viewHeight,
  }: KeyboardControlsType,
) {
  // const { camera } = useThree();
  useLayoutEffect(() => {
    // React-fiber calls OrbitControls.dispose automatically.
    // if (!control.current) return;
    if (!controls) return;

    const keyDown = (function () {
      // closure, to avoid re-instancing this dummy variable.
      const v = new Vector3();

      return function (e: KeyboardEvent): void {
        let moved = false;

        // const ctrl = control.current;
        const camera = controls.object;
        // todo: Use FOV scale to determine pan speed. Use fraction of FOV.
        // note: use reference, won't need to regenerate this function
        // const distance = camera.position.distanceTo(
        //     ctrl.target
        // );
        // let viewHeight: number;
        // if (fov) {
        //     viewHeight = (distance * Math.tan((Math.PI * fov) / 360));
        // } else if (typeof top == 'number' && typeof bottom == 'number') {
        //     viewHeight = Math.max((top - bottom) / 2);
        // } else {
        //     return;
        // }
        const adjusted: number = panSpeed * viewHeight;
        console.log('view height', viewHeight, 'panSpeed', panSpeed, 'adjusted', adjusted);
        const clipped = Math.max(adjusted, 0.001);
        const speed = e.shiftKey ? clipped * 10 : clipped;
        console.log('speed:', speed, 'panSpeed', panSpeed);

        if (e.code === 'KeyW') {
          v.setFromMatrixColumn(controls.object.matrix, 0);
          v.crossVectors(controls.object.up, v);
          v.normalize();
          v.multiplyScalar(speed);
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (e.code === 'KeyS') {
          v.setFromMatrixColumn(controls.object.matrix, 0);
          v.crossVectors(controls.object.up, v);
          v.normalize();
          v.multiplyScalar(speed);
          v.negate();
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (e.code === 'KeyA') {
          v.copy(controls.target);
          v.sub(controls.object.position);
          v.crossVectors(controls.object.up, v);
          v.normalize();
          v.multiplyScalar(speed);
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (e.code === 'KeyD') {
          v.copy(controls.target);
          v.sub(controls.object.position);
          v.crossVectors(controls.object.up, v);
          v.normalize();
          v.multiplyScalar(speed);
          v.negate();
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (e.code === 'KeyE') {
          v.set(0, speed, 0);
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (e.code === 'KeyQ') {
          v.set(0, -speed, 0);
          controls.target.add(v);
          camera.position.add(v);
          moved = true;
        }
        if (moved) {
          // camera.updateProjectionMatrix()
          invalidate();
        }
      };
    }());

    const keyUp = () => {
      // key_bank[e.code] = false;
      // if (e.code === "Space") key_bank.clear();
    };

    if (parent) {
      const el = parent;
      /** Important **
             to use canvas component as the event target, you need to
             pass in a tabindex=1 because canvas is not a focusable element
             on start.
             See this: https://stackoverflow.com/a/32936969/1560241
             Setting this in react, on the component parent does not work. */
      el.tabIndex = 1;

      el.addEventListener('keydown', keyDown);
      el.addEventListener('keyup', keyUp);

      return () => {
        el.removeEventListener('keydown', keyDown);
        el.removeEventListener('keyup', keyUp);
        console.log('layoutEffect remove listener');
      };
    }
  }, [ controls, parent, panSpeed, viewHeight ]);

  return null;
}

type OrbitCameraType = {
  parent: MutableRefObject<HTMLDivElement>;
  onChange?: (camera: CameraLike) => void;
  panSpeed?: number;
  fov?: number;
  zoom?: number;
  position?: [number, number, number];
  near?: number;
  far?: number;
  initPosition?: [number, number, number];
};

type OrbitCameraQueryType = {
  panSpeed: string;
  fov: string;
  zoom: string;
  position?: string;
  near: string;
  far: string;
};

export type BaseCamLike = {
  type: string;
  near: number;
  far: number;
  matrix: number[];
  position: number[];
  rotation: number[];
  up: number[];
  aspect: number;
  orbit_distance: number;
};

export interface OrthographicCamLike extends BaseCamLike {
  type: 'OrthographicCamera';
  zoom: number;
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface PerspectiveCamLike extends BaseCamLike {
  type: 'PerspectiveCamera';
  fov: number;
  focus: number;
}

export type CameraLike = OrthographicCamLike | PerspectiveCamLike;

export function OrbitCamera(
  {
    parent,
    onChange,
    panSpeed = 1, // roughly 1 unit per second
    fov = 75,
    zoom = 1,
    position,
    near,
    far,
    initPosition = [ -0.5, 0.75, 0.8 ],
  }: OrbitCameraType,
) {
  const controlsRef = useRef() as MutableRefObject<tOrbitControls>;
  // camRef.current is undefined at the beginning.
  const camRef = useRef() as MutableRefObject<tOrthographicCamera | tPerspectiveCamera>;
  const orthoRef = useRef() as MutableRefObject<tOrthographicCamera>;
  const perspRef = useRef() as MutableRefObject<tPerspectiveCamera>;

  const queries = useMemo(() => queryString.parse(document.location.search), []) as OrbitCameraQueryType;
  // const initialPosition = queries.camPosition
  //     // @ts-ignore: no time to deal with this right now.
  //     ? queries.camPosition?.split(",").map(Number)
  //     : initPosition;
  const [ controlled, setControls ] = useControls('Camera Control', () => ({
    zoom: {
      label: 'Zoom (px)',
      value: Number(queries.zoom) || zoom || 1,
      // in pixels, no max, because it can get pretty large.
      step: 0.001,
      min: 0.001,
      pad: 4,
    },
    fov: {
      label: 'Fov°',
      value: Number(queries.fov) || fov || 75,
      step: 0.1,
      min: 0.1,
      max: 220,
    },
  }));
  const { ctype, camInitPosition, ...ctrls } = useControls('Camera Control', {
    ctype: {
      value: 'Perspective',
      options: [ 'Perspective', 'Orthographic' ],
      label: 'Cam Type',
    },
    camInitPosition: initPosition,
    zoomSpeed: 1.0,
    // perspective
    near: {
      label: 'Near (cm)',
      value: parseFloat(queries.near) || near || 0.01,
      min: 0.01,
      max: 1000,
      step: 0.01,
    },
    far: {
      label: 'Far (m)',
      value: parseFloat(queries.far) || far || 200,
      min: 0.1,
      max: 1000,
      step: 0.1,
    },
    // orthographic
    panSpeed: {
      value: Number(queries.panSpeed) || panSpeed || 1,
      pad: 5,
      step: 0.01,
      min: 0.001,
      max: 5,
    },
  });

  const { set } = useThree(({ get, set }) => ({ get, set }));

  // const viewHeight = parent.current?.clientHeight * gl.getPixelRatio();
  // looks like the view is in the abstract pixels, not the physical pixels.
  const viewHeight = parent.current?.clientHeight;
  const viewWidth = parent.current?.clientWidth;

  useLayoutEffect(() => {
    if (!set) return;

    let currentPos; let
      orbit_distance;
    if (camRef.current) {
      const { target } = controlsRef.current;
      // @ts-ignore: camRef.current *is* defined
      orbit_distance = camRef.current.position.distanceTo(target);
      currentPos = camRef.current.position;
    } else {
      currentPos = new Vector3(...camInitPosition);
    }
    if (ctype === 'Perspective') {
      // @ts-ignore: might be undefined
      const zoom = camRef?.current?.zoom;
      perspRef.current.position.copy(currentPos);

      const curr = camRef.current = perspRef.current as tPerspectiveCamera;
      // place here to avoid rance condition
      controlsRef.current.object = curr;
      if (zoom && orbit_distance) {
        const fov = zoomToFov(zoom, orbit_distance, viewHeight);
        curr.fov = fov;
        curr.updateProjectionMatrix();
        setControls({ fov });
      }
    } else if (ctype === 'Orthographic') {
      // @ts-ignore: might be undefined
      const fov = camRef?.current?.fov;
      orthoRef.current.position.copy(currentPos);
      // @ts-ignore: camRef.current *is* defined
      if (camRef.current?.far) orthoRef.current.far = camRef.current.far;

      const curr = camRef.current = orthoRef.current as tOrthographicCamera;
      // place here to avoid rance condition
      controlsRef.current.object = curr;
      if (fov && orbit_distance) {
        curr.near = -curr.far;
        // want to write so that it is the size of the field of view at the target location.
        // distance to target
        const zoom = fovToZoom(fov, orbit_distance, viewHeight);
        curr.zoom = zoom;
        curr.updateProjectionMatrix();
        setControls({
          zoom: viewHeight / zoom,
        });
      } else {
        console.warn(`camera tpe ${ctype} is not defined`);
      }
    }
    if (camRef.current) set({ camera: camRef.current } as RootState);
  }, [ ctype ]);

  function triggerRender() {
    const defaultCam = controlsRef.current.object;
    if (!defaultCam) return;

    const orbit_distance = defaultCam.position.distanceTo(
      controlsRef.current.target,
    );

    if (typeof onChange !== 'function') return;
    if (defaultCam.type === 'PerspectiveCamera') {
      const {
        type,
        near, far, matrix, position, rotation,
        up,
        fov,
        focus,
        aspect,
      } = defaultCam as tPerspectiveCamera;
      // prettier-ignore
      onChange({
        type,
        near,
        far,
        matrix: matrix.elements,
        position: position.toArray(),
        rotation: rotation.toArray(),
        up: up.toArray(),
        fov,
        focus,
        aspect,
        orbit_distance,
      } as PerspectiveCamLike);
    } else if (defaultCam.type === 'OrthographicCamera') {
      // prettier-ignore
      const {
        type,
        near, far, matrix, position, rotation,
        up,
        zoom,
        left,
        top,
        bottom,
        right,
      } = defaultCam as tOrthographicCamera;
      onChange({
        type,
        // orthographic camera does not have aspect
        near,
        far,
        matrix: matrix.elements,
        position: position.toArray(),
        rotation: rotation.toArray(),
        up: up.toArray(),
        // use the camera zoom instead
        aspect: (right - left) / (top - bottom),
        zoom: viewHeight / zoom,
        left,
        top,
        bottom,
        right,
        // needed to compute fov
        orbit_distance,
      } as OrthographicCamLike);
    }
  }

  const { uplink } = useContext(SocketContext) as SocketContextType;
  // register camera update event
  useEffect(
    () => uplink.subscribe('CAMERA_UPDATE', () => triggerRender()),
    [],
  );

  const matCache = useMemo(() => ({ matrix: '' }), []);

  // The change event in the OrbitControl with Orthographic camera has a bug.
  const handler = useCallback(() => {
    const camera = controlsRef.current?.object as tOrthographicCamera & tPerspectiveCamera;
    if (!camera) return;
    const newMat = JSON.stringify([
      camera.projectionMatrix.toArray(),
      camera.position.toArray(),
      camera.rotation.toArray(),
      camera.fov,
    ]);
    if (matCache.matrix !== newMat) triggerRender();
    matCache.matrix = newMat;
  }, [ camRef.current, onChange, viewHeight, setControls ]);

  // can probably simplify.
  useLayoutEffect(
    () => triggerRender(),
    [
      controlsRef.current,
      ctrls.near,
      ctrls.far,
      controlled.fov,
      controlled.zoom,
      viewHeight,
      viewWidth,
      setControls,
      onChange,
      // ...(up || []),
      ...(position || []),
    ],
  );

  return (
    <>
      <OrbitControls
        ref={controlsRef as MutableRefObject<tOrbitControls>}
        makeDefault
        enableDamping={false}
        enablePan
        screenSpacePanning
        onChange={handler}
        reverseOrbit
        maxPolarAngle={(135 / 180) * Math.PI}
        minPolarAngle={(0 / 180) * Math.PI}
        maxZoom={Infinity}
        maxDistance={Infinity}
        zoomSpeed={ctrls.zoomSpeed}
      />
      <PerspectiveCamera
        key="perspective"
        makeDefault
        ref={perspRef as MutableRefObject<tPerspectiveCamera>}
        fov={controlled.fov}
        near={ctrls.near}
        far={ctrls.far}
      />
      <OrthographicCamera
        key="orthographic"
        makeDefault
        ref={orthoRef as MutableRefObject<tOrthographicCamera>}
        zoom={viewHeight / controlled.zoom}
        near={ctrls.near}
        far={ctrls.far}
      />
      <KeyboardControls
        parent={parent.current}
        // fov={controlled.fov}
        viewHeight={controlled.zoom}
        controls={controlsRef.current}
        panSpeed={ctrls.panSpeed / 600}
      />
    </>
  );
}
