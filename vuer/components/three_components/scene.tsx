import React, { PropsWithChildren, Suspense, useCallback, useContext, useEffect, useMemo, useRef, } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { Controllers, Hands, VRButton, XR, } from '@react-three/xr';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { SSAOPass, UnrealBloomPass } from 'three-stdlib';
// import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";
import { BufferGeometry, Mesh, Object3D, Vector3 } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { Perf } from 'r3f-perf';
import queryString, { ParsedQuery } from 'query-string';
import { CameraLike, OrbitCamera } from './camera.tsx';
import { Download } from './download.tsx';
// import {FileDrop} from "../_file_drop";
import { Grid } from './grid.tsx';
import { PointerControl } from './controls/pointer.tsx';
import { SceneGroup } from './group.tsx';
import { SocketContext, SocketContextType } from '../contexts/websocket.tsx';
import { BackgroundColor } from './color.tsx';
import { document } from '../../lib/browser-monads';
import { ClientEvent } from '../../interfaces.tsx';

// question: what does this do? - Ge
Mesh.prototype.raycast = acceleratedRaycast;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
BufferGeometry.prototype.disposeBoundsTreee = disposeBoundsTree;

extend({
  SSAOPass,
  UnrealBloomPass,
  // TextGeometry,
});

type ThreeProps = PropsWithChildren<{
  _key?: string;
  canvasRef?;
  className?: string;
  style?;
  up?: [ number, number, number ];
  backgroundChildren?: unknown | unknown[];
  rawChildren?: unknown | unknown[];
  htmlChildren?: unknown | unknown[];
}>;

export default function ThreeScene(
  {
    _key: key,
    canvasRef: _canvasRef,
    className,
    style,
    children,
    backgroundChildren,
    // these are not transformed.
    rawChildren,
    htmlChildren,
    up = null,
  }: ThreeProps,
) {
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

  return (
    <>
      <div style={divStyle} className={className}>
        <VRButton/>
        <Canvas
          ref={canvasRef}
          shadows
          // preserve buffer needed for download
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
            <PointerControl
              parent={canvasRef}
              parentKey={key}
            />
            <Grid/>
            {backgroundChildren}
            <Suspense>
              <SceneGroup>{children}</SceneGroup>
            </Suspense>
            {rawChildren}
            <OrbitCamera
              parent={canvasRef}
              onChange={onCameraMove}
              panSpeed={1}
            />
            <BackgroundColor/>
            <Download/>
            <GizmoHelper alignment="bottom-right" margin={[ 80, 80 ]}>
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
