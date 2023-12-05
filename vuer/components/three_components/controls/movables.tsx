import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Euler, EulerOrder, Matrix4, Mesh, Object3D, Quaternion, Vector3,
} from 'three';
import { invalidate, MeshProps, Vector3 as rVector3 } from '@react-three/fiber';
import { PivotControls } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { SqueezeRayGrab } from './utils.tsx';
import { VuerProps } from '../../../interfaces.tsx';
import { SocketContext, SocketContextType } from '../../contexts/websocket.tsx';

export const HandleBox = forwardRef((
  {
    size,
    children,
    ...rest
  }: MeshProps & PropsWithChildren<{
    size: [number, number, number];
  }>,
  ref: ForwardedRef<Mesh>,
) => (
  <mesh ref={ref} {...rest}>
    <boxGeometry args={size} />
    <meshPhongMaterial color={0xfffff7} />
    {children}
  </mesh>
));

type Sim3Type = {
  position: Vector3;
  rotation: Euler;
  quaternion: Quaternion;
  scale: Vector3;
};

type PivotProps = VuerProps<{
  anchor?: [number, number, number];
  offset?: [number, number, number];
  scale?: number;
  lineWidth?: number;
  matrix?: number[];
  position?: [number, number, number];
  rotation?: [number, number, number, (EulerOrder | undefined)];
}>;

export function Pivot(
  {
    children,
    _key,
    anchor,
    offset,
    scale = 0.4,
    lineWidth = 1.0,
    matrix,
    position = [0, 0, 0],
    // @ts-ignore: type mismatch
    rotation = [0, 0, 0],
    ...rest
  }: PivotProps,
) {
  const [state, setState] = useState({});
  const ref = useRef() as MutableRefObject<Object3D>;
  const { sendMsg } = useContext(SocketContext) as SocketContextType;

  const cache = useMemo<Sim3Type>(() => ({
    position: new Vector3(...position as [number, number, number]),
    rotation: new Euler(...rotation as [number, number, number, (EulerOrder)]),
    quaternion: new Quaternion(),
    scale: new Vector3(),
  }), []);

  useEffect(() => {
    if (!ref.current) return;
    const pivot = ref.current;
    if (matrix) {
      pivot.matrix.fromArray(matrix);
      pivot.matrix.decompose(pivot.position, pivot.quaternion, pivot.scale);
      pivot.rotation.setFromQuaternion(pivot.quaternion);
    } else {
      pivot.position.fromArray(position);
      pivot.rotation.fromArray(rotation);
      pivot.updateMatrix();
      invalidate();
    }
  }, [ref.current]);

  function onDrag(
    local: Matrix4,
    // @ts-ignore: not used
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dLocal: Matrix4,
    world: Matrix4,
    // @ts-ignore: not used
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dWorld: Matrix4,
  ): void {
    local.decompose(cache.position, cache.quaternion, cache.scale);
    cache.rotation.setFromQuaternion(cache.quaternion);
    setState({
      local: local.toArray(),
      world: world.toArray(),
      position: cache.position.toArray(),
      rotation: cache.rotation.toArray(),
      quaternion: cache.quaternion.toArray(),
    });
  }

  function onDragEnd() {
    sendMsg({
      etype: 'OBJECT_MOVE',
      key: _key,
      value: state,
    });
  }

  return (
    <PivotControls
      // @ts-ignore: ref type mismatch
      ref={ref}
      anchor={anchor}
      // annotations={annotations}
      offset={offset}
      scale={scale}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      lineWidth={lineWidth}
      {...rest}
    >
      {children}
    </PivotControls>
  );
}

// export function MovableGripper({_key, sendMsg, color = null, pinchWidth = 1, ...rest}) {
//   const cloud_ref = useRef();
//   const [pinchW, setPinchW] = useState(pinchWidth)
//
//   // make a ref for the sSkeletalGripper
//   const gripper_ref = useRef()
//   // use useMemo to create a skeleton gripper only once
//   const gripperSkeleton = useMemo(() => <SkeletalGripper _ref={gripper_ref}/>, [])
//
//   const {position, rotation, handleOffset} = rest
//
//   const cache.position = useMemo(() => new Vector3(), [])
//   const cache.quaternion = useMemo(() => new Quaternion(), [])
//   const cache.rotation = useMemo(() => new Euler(), [])
//   const cache.scale = useMemo(() => new Vector3(), [])
//   const onSelect = () => {
//     cloud_ref.current?.matrixWorld.decompose(cache.position, cache.quaternion, cache.scale)
//     // convert cache.rotation quaternion to euler
//     cache.rotation.setFrocache.quaternion(cache.quaternion)
//     sendMsg({
//       etype: 'SET_GRIPPER',
//       key: _key,
//       value: {
//         rotation: cache.rotation.toArray().slice(0, 3),
//         position: cache.position.toArray()
//       }
//     })
//     // also set the skeletal gripper
//     gripper_ref.current?.rotation.fromArray(cache.rotation.toArray())
//     gripper_ref.current?.position.fromArray(cache.position.toArray())
//   }
//
//   return (<>
//         <SqueezeRayGrab onSelect={onSelect} bigChildren={
//           <Gripper _ref={cloud_ref} color={color} pinchWidth={pinchW} {...rest}/>
//         }>
//           <HandleBox size={[0.1, 0.1, 0.1]} rotation={rotation} position={addThree(position, handleOffset)}/>
//         </SqueezeRayGrab>
//         {gripperSkeleton}
//       </>
//   )
// }

function addThree(
  [x1, y1, z1]: [number, number, number] = [0, 0, 0],
  [x2, y2, z2]: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  return [
    x1 + x2,
    y1 + y2,
    z1 + z2,
  ];
}

type PivotXRProps = VuerProps<{
  offset: [number, number, number];
  scale: number;
}>;

export function PivotXR(
  {
    _key,
    offset,
    scale,
    children = [],
    position,
    rotation,
  }: PivotXRProps,
) {
  // const cloud_ref = useRef(children.length && children[0], children);
  const ref = useRef() as MutableRefObject<Mesh>;
  const { sendMsg } = useContext(SocketContext) as SocketContextType;

  // make memo for position and rotation
  const cache = useMemo<Sim3Type>(() => ({
    position: new Vector3(),
    rotation: new Euler(),
    quaternion: new Quaternion(),
    scale: new Vector3(),
  }), []);

  const onSqueezeEnd = () => {
    const world = ref.current?.matrixWorld;
    world.decompose(cache.position, cache.quaternion, cache.scale);
    // convert cache.rotation quaternion to euler
    cache.rotation.setFromQuaternion(cache.quaternion);
    sendMsg({
      etype: 'OBJECT_MOVE',
      key: _key,
      value: {
        world: world.toArray(),
        position: cache.position.toArray(),
        rotation: cache.rotation.toArray(),
        quaternion: cache.quaternion.toArray(),
      },
    });
  };

  return (
    <SqueezeRayGrab onSqueezeEnd={onSqueezeEnd} bigChildren={children}>
      <HandleBox
        ref={ref}
        size={[scale, scale, scale]}
        rotation={rotation}
        position={addThree(position, offset) as rVector3}
      />
    </SqueezeRayGrab>
  );
}

type MovableType = VuerProps<{
  anchor?: [number, number, number];
  offset?: [number, number, number];
  annotations?: string[];
  scale?: number;
  lineWidth?: number;
  handleOffset?: [number, number, number];
  hide?: boolean;
}>;

export function Movable(
  {
    children,
    _key,
    anchor,
    offset,
    annotations,
    scale = 0.4,
    lineWidth = 0.5,
    handleOffset = [0, 0, 0],
    hide,
    ...props
  }: MovableType,
) {
  // hide movable leads to pass-through
  const { isPresenting } = useXR();
  if (hide) return <>{children}</>;
  if (isPresenting) {
    return (
      <PivotXR
        _key={_key}
        scale={scale * 0.1}
        offset={handleOffset}
        {...props}
      >
        {children}
      </PivotXR>
    );
  } return (
    <Pivot
      _key={_key}
      anchor={anchor}
      offset={offset}
      annotations={annotations}
      scale={scale}
      lineWidth={lineWidth}
      {...props}
    >
      {children}
    </Pivot>
  );
}
