import { MutableRefObject, useEffect, useState } from 'react';
import { Center, PivotControls, Sphere } from '@react-three/drei';
import {
  BufferGeometry, Color, ColorRepresentation, Group, Mesh, Points,
} from 'three';
import { URDFRobot } from 'urdf-loader';
import { ThreeEvent } from '@react-three/fiber';
import { VuerProps } from '../../interfaces';

type ObjProps = VuerProps<{
  data?: Points<BufferGeometry>;
  hide?: boolean;
  color?: string;
}, Points>;

export function PcdView(
  {
    data, _ref, size = 0.0015, hide, ...rest
  }: ObjProps & {
    size?: number;
  },
): JSX.Element | null {
  // rest includes translation and rotation
  if (!data || hide) return null;
  return (
    <points ref={_ref} {...rest}>
      {/* @ts-ignore: for some reason geometry does not exist on JSX Elements. */}
      <geometry attach="geometry" {...data.geometry} />
      <pointsMaterial
        attach="material"
        vertexColors
        size={size}
        sizeAttenuation
        transparent
        alphaTest={1}
        opacity={1}
      />
    </points>
  );
}

export function ObjView(
  {
    data, _ref, hide, ...rest
  }: ObjProps,
) {
  if (!data || hide) return null;
  // todo: offer wireframe and color-override options.
  return (
    <primitive
      ref={_ref}
      receiveShadow
      castShadow
      object={data}
      {...rest}
    />
  );
}

export type PlyProps = VuerProps<{
  data: BufferGeometry;
  size?: number;
  color?: ColorRepresentation
}, Points | Mesh>;

export function PlyView(
  {
    data,
    _ref,
    size = 0.005,
    color,
    hide,
    ...rest
  }: PlyProps,
) {
  // computing the normals on unordered pointcloud is bad.
  if (!data || hide) return null;

  if (!data.attributes.normal) console.log('data.attributes.normal is missing');
  if (!data.index) {
    console.log(
      "data.index is missing. Won't be able to compute surface normals.",
    );
  }
  if (data && !data.attributes.normal && data.index) {
    // console.log('computed normals for data. ')
    data.computeVertexNormals();
  }
  if (data.attributes.normal) {
    return (
      <mesh
        ref={_ref as MutableRefObject<Mesh>}
        geometry={data}
        castShadow
        // recieveShadow
        {...rest}
      >
        <meshStandardMaterial vertexColors />
      </mesh>
    );
  } if (color) {
    return (
      <points
        ref={_ref as MutableRefObject<Points>}
        {...rest}
      >
        <bufferGeometry {...data} />
        <pointsMaterial
          size={size}
          vertexColors
          color={color}
          sizeAttenuation
        />
      </points>
    );
  }
  return (
    <points geometry={data} {...rest}>
      <pointsMaterial
        attach="material"
        vertexColors
        size={size}
        sizeAttenuation
        opacity={1}
      />
    </points>
  );
}

// GLB is a binary container format of GLTF.
export function GltfView({ data, _ref, ...rest }: VuerProps<{ data: { scene } }>) {
  return <primitive ref={_ref} object={data.scene} {...rest} />;
}

export function UrdfView(
  {
    robot, _ref, jointValues = {}, ...rest
  }: VuerProps<{
    robot: URDFRobot;
    jointValues;
  }, Group>,
) {
  useEffect(
    () => {
      if (jointValues) robot?.setJointValues(jointValues);
    },
    [ robot, jointValues ],
  );
  return <primitive ref={_ref} object={robot} {...rest} />;
}

type GripperProps = VuerProps<{
  color?: Color;
  pinchWidth?: number;
  skeleton?: boolean;
  axes?: boolean;
  // showCoordnates?: boolean;
  showOrigin?: boolean;
  hide?: boolean;
}, Group>;

export function Gripper(
  {
    _ref,
    color,
    pinchWidth = 0.04,
    skeleton = false,
    axes = false,
    // showCoordnates = True,
    showOrigin = true,
    hide,
    ...rest
  }: GripperProps,
) {
  if (hide) return null;
  if (skeleton) {
    return (
      <SkeletalGripper
        _ref={_ref}
        color={color}
        pinchWidth={pinchWidth}
        {...rest}
      />
    );
  }
  return (
    <group ref={_ref} {...rest}>
      {axes && <axesHelper args={[ 0.1 ]} />}
      <mesh
        position={[ 0, 0.07, 0 ]}
        rotation={[ 0, 0, Math.PI / 2 ]}
        scale={[ 1, 1, 1 ]}
      >
        <cylinderGeometry attach="geometry" args={[ 0.015, 0.015, 0.12, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#cecece'} />
      </mesh>
      <mesh position={[ -pinchWidth - 0.005, 0.0, 0.0 ]} scale={1}>
        <boxGeometry attach="geometry" args={[ 0.01, 0.02, 0.025, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#23aaff'} />
      </mesh>
      <mesh position={[ -pinchWidth - 0.005, 0.0275 + 0.01, 0.0 ]} scale={1}>
        <boxGeometry attach="geometry" args={[ 0.01, 0.055, 0.025, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#8ed6ff'} />
      </mesh>
      <mesh position={[ pinchWidth + 0.005, 0.0, 0.0 ]} scale={1}>
        <boxGeometry attach="geometry" args={[ 0.01, 0.02, 0.025, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#ff5656'} />
      </mesh>
      <mesh position={[ pinchWidth + 0.005, 0.0275 + 0.01, 0.0 ]} scale={1}>
        <boxGeometry attach="geometry" args={[ 0.01, 0.055, 0.025, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#ff9595'} />
      </mesh>
      <mesh
        position={[ 0, 0.075 + 0.025, 0 ]}
        rotation={[ 0, 0, 0 ]}
        scale={[ 1, 1, 1 ]}
      >
        <cylinderGeometry attach="geometry" args={[ 0.0125, 0.0125, 0.05, 32 ]} />
        <meshBasicMaterial attach="material" color={color || '#5b5b5b'} />
      </mesh>
      {/* add a sphere to show the origin */}
      {showOrigin ? (
        <mesh position={[ 0, 0, 0 ]} rotation={[ 0, 0, 0 ]}>
          <sphereGeometry attach="geometry" args={[ 0.0075, 32, 32 ]} />
          <meshBasicMaterial attach="material" color="green" />
        </mesh>
      ) : null}
    </group>
  );
}

type SkeletalGripperProps = VuerProps<{
  color?: Color;
  pinchWidth?: number;
  opacity?: number;
  hide?: boolean;
}, Group>;

export function SkeletalGripper(
  {
    _ref,
    color,
    pinchWidth = 0.07,
    opacity = 0.9,
    hide,
    ...rest
  }: SkeletalGripperProps,
) {
  if (hide) return null;
  return (
    <group scale={1} {...rest} ref={_ref}>
      <mesh
        position={[ 0, 0.07, 0 ]}
        rotation={[ Math.PI / 2, 0, 0 ]}
        scale={[ 1, 1, 1 ]}
      >
        <cylinderGeometry
          attach="geometry"
          args={[ 0.005, 0.005, pinchWidth * 2, 32 ]}
        />
        <meshBasicMaterial
          color={color || '#ffffff'}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[ 0, 0.02, pinchWidth ]} scale={1}>
        <cylinderGeometry attach="geometry" args={[ 0.005, 0.005, 0.1, 32 ]} />
        <meshBasicMaterial
          attach="material"
          color={color || '#23aaff'}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[ 0, 0.02, -pinchWidth ]} scale={1}>
        <cylinderGeometry attach="geometry" args={[ 0.005, 0.005, 0.1, 32 ]} />
        <meshBasicMaterial
          attach="material"
          color={color || '#ff5656'}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[ 0, 0.09, 0 ]} rotation={[ 0, 0, 0 ]} scale={[ 0.8, 1, 1 ]}>
        <cylinderGeometry attach="geometry" args={[ 0.01, 0.01, 0.06, 32 ]} />
        <meshBasicMaterial
          attach="material"
          color={color || 'gray'}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[ 0, 0, 0 ]} rotation={[ 0, 0, 0 ]}>
        <sphereGeometry attach="geometry" args={[ 0.01, 32, 32 ]} />
        <meshBasicMaterial
          attach="material"
          color={color || 'green'}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

type MarkerProps = VuerProps<{
  anchor: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  hoverScale?: number;
}>;

export function Marker({
  anchor, rotation, radius, hoverScale = 3,
}: MarkerProps) {
  const [ show, setShow ] = useState(false);
  const [ scale, setScale ] = useState(1);

  // use useEvent after upgrading to next react version
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    setShow(!show);
    e.stopPropagation();
  };
  const pointerOver = () => setScale(hoverScale);
  const pointerOut = () => setScale(1);

  if (!show) {
    return (
      <Sphere
        args={[ radius * scale ]}
        position={anchor}
        onClick={onClick}
        onPointerOver={pointerOver}
        onPointerOut={pointerOut}
      >
        <meshPhongMaterial color="blue" opacity={1} transparent />
      </Sphere>
    );
  }

  return (
    <PivotControls
      depthTest={false}
      anchor={anchor}
      rotation={rotation}
      scale={radius * scale}
      visible={show}
      disableAxes={!show}
      disableSliders={!show}
      disableRotations={!show}
    >
      <Center position={anchor}>
        <Sphere
          args={[ radius * scale ]}
          onClick={onClick}
          onPointerOver={pointerOver}
          onPointerOut={pointerOut}
        >
          <meshPhongMaterial color="blue" opacity={1} transparent />
        </Sphere>
      </Center>
    </PivotControls>
  );
}
