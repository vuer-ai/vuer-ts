import React, { Suspense, useCallback, useContext, useEffect, useMemo, useRef, } from 'react';
import { Canvas } from '@react-three/fiber';
import { Controllers, VRButton, XR } from '@react-three/xr';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { BufferGeometry, Mesh, Object3D, Vector3 } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { Perf } from 'r3f-perf';
import queryString, { ParsedQuery } from 'query-string';
import { CameraLike, OrbitCamera } from './camera';
import { Hands } from "./controls/hands";
import { Gamepad } from "./controls/gamepad";
import { Download } from './download';
import { GroupSlave, SceneGroup } from './group';
import { BackgroundColor } from './color';
import { document } from '../third_party/browser-monads';
import { ClientEvent, VuerProps } from "../interfaces";
import { SocketContext, SocketContextType } from "../html_components/contexts/websocket";
import { OrbitControls as tOrbitControls } from "three-stdlib/controls/OrbitControls";

// question: what does this do? - Ge
Mesh.prototype.raycast = acceleratedRaycast;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
BufferGeometry.prototype.disposeBoundsTreee = disposeBoundsTree;

// extend({
//   SSAOPass,
//   UnrealBloomPass,
//   // TextGeometry,
// });

export type SceneProps = VuerProps<{
  _key?: string;
  canvasRef?;
  className?: string;
  style?;
  up?: [ number, number, number ];
  bgChildren?: JSX.Element | JSX.Element[];
  rawChildren?: JSX.Element | JSX.Element[];
  htmlChildren?: JSX.Element | JSX.Element[];
  grid?: boolean;
  initCamPosition?: [ number, number, number ];
  initCamRotation?: [ number, number, number ];
}>;

/**
 * This is the root component for the 3D scene.
 *
 * @param _key - the key of the scene component
 * @param canvasRef - the reference to the canvas element
 * @param className - the class name of the scene component
 * @param style - the style of the scene component
 * @param children - the children of the scene component
 * @param bgChildren - the children of the scene component that are rendered in the background
 * @param rawChildren - the children of the scene component that are rendered as is
 * @param htmlChildren - the children of the scene component that are rendered as html
 * @param up - the up vector of the scene
 * @param grid - whether to show the grid
 * @param initCamPosition - the initial position of the camera
 * @param initCamRotation - the initial rotation of the camera
 *
 * @returns the scene component
 */
export function Scene({
  canvasRef: _canvasRef,
  className,
  style,
  children,
  bgChildren,
  // these are not transformed.
  rawChildren,
  htmlChildren,
  up = null,
  initCamPosition,
  initCamRotation,
}: SceneProps,) {

  const ref = useRef<HTMLCanvasElement>();
  const canvasRef = _canvasRef || ref;
  const { sendMsg, uplink } = useContext(SocketContext) as SocketContextType;
  const queries = useMemo<ParsedQuery>(() => queryString.parse(document.location.search), []);

  useEffect(() => {
    if (!up) return;
    Object3D.DEFAULT_UP.copy(new Vector3(...up));
  }, [ up ])

  const onCameraMove = useCallback(
    (camera: CameraLike) => {
      uplink?.publish({
        etype: 'CAMERA_MOVE',
        key: 'defaultCamera',
        value: {
          camera: {
            ...camera,
            height: canvasRef.current?.clientHeight,
            width: canvasRef.current?.clientWidth,
          },
        },
      } as ClientEvent);
    },
    [ sendMsg, uplink ],
  );

  const divStyle = useMemo(
    () => ({
      overflow: 'hidden',
      ...(style || {
        height: '300px',
        width: '400px',
        border: '1px solid black',
        margin: '5px 5px 5px 5px',
      }),
    }),
    [ style ],
  );

  const camCtrlRef = useRef<tOrbitControls>();

  return (
    <>
      <div style={divStyle} className={className}>
        <VRButton/>
        <Canvas
          ref={canvasRef}
          shadows
          // preserve buffer needed for download and grab image data
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          frameloop="demand"
          // why set it to 1: https://stackoverflow.com/a/32936969/1560241
          tabIndex={1}
        >
          <XR>
            {queries.debug || queries.perf ? (
              <Perf position="top-left"/>
            ) : null}
            {/* <FileDrop/> */}
            <Hands/>
            <Controllers/>
            <Gamepad/>
            <SceneGroup/>
            <BackgroundColor/>
            {/** Hoist the SceneGroup control hooks up here. This is not the original
             usage pattern, but it turned out to work really well.*/}
            <OrbitCamera
              ctrlRef={camCtrlRef}
              parent={canvasRef}
              onChange={onCameraMove}
              panSpeed={1}
              initPosition={initCamPosition}
              initRotation={initCamRotation}
            />
            {/** note: we show the grid in place of the default background children,
             because otherwise user might think the app is broken. We can replace this
             with a default scene in the future. <Grid/> is the default scene here.*/}
            {bgChildren}
            <Suspense>
              <GroupSlave>{children}</GroupSlave>
            </Suspense>
            {rawChildren}
            <Download/>
            <GizmoHelper alignment="bottom-left" margin={[ 80, 80 ]}>
              <GizmoViewport
                axisColors={[ '#9d4b4b', '#2f7f4f', '#3b5b9d' ]}
                labelColor="white"
              />
            </GizmoHelper>
          </XR>
        </Canvas>
      </div>
      {htmlChildren}
    </>
  );
}
