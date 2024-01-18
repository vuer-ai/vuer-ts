import { Ref, Suspense, useEffect, useState, } from 'react';
import { Mesh, TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import { useControls } from 'leva';
import { HeightMaterial } from './height_map_materials';

type PrimitiveProps = {
  _ref?: Ref<Mesh>;
  _key?: string;
  sendMsg?;
  children?;
  hide?: boolean;
  args?: number[];
  materialType?: 'basic' | 'standard' | 'phong' | 'lambert';
  material?;
  outlines?;
  [key: string]: unknown;
};

export function Primitive(
  {
    _ref,
    _key = 'Box',
    geometry: Geometry,
    // todo: can use children to enable multiple materials.
    // children,
    hide,
    args,
    materialType = 'basic', // One of ["basic", "standard", "phong", "standard", "lambert"]
    material: { displacementMap, normalMap, ..._material } = {},
    outlines,
    ...rest
  }: { geometry: string } & PrimitiveProps,
) {
  const [ materialParams, setMaterial ] = useState({});
  const [ textures, setTexture ] = useState({});
  const textureMaps = useLoader(TextureLoader, Object.values(textures) as string[] || []);

  useEffect(() => {
    for (const k in _material) {
      const value = _material[k];
      const isMap = k.endsWith('map') || k.endsWith('Map');
      if (typeof value === 'string' && isMap) {
        setTexture((store) => ({ ...store, [k]: value }));
      } else {
        setMaterial((store) => ({ ...store, [k]: value }));
      }
    }
  }, [ rest ]);

  const tMaps = Object.fromEntries(
    Object.keys(textures).map((key, i) => [ key, textureMaps[i] ]),
  );

  // todo: use hide as a higher-level component, to avoid running all of the hooks.
  if (hide) return null;

  return (
    <mesh ref={_ref} key={_key} {...rest}>
      <Geometry attach="geometry" args={args}/>
      <Suspense>
        <HeightMaterial
          attach="material"
          _key={`${_key}-material`}
          type={materialType}
          displacementMap={displacementMap}
          normalMap={normalMap}
          normalScale={[ 1, 1 ]}
          displacementScale={1}
          {...tMaps}
          {...materialParams}
        />
        {outlines ? <Outlines {...outlines} /> : null}
      </Suspense>
    </mesh>
  );
}

export function Box(params: PrimitiveProps) {
  return <Primitive geometry="boxGeometry" {...params} />;
}

export function Capsule(params: PrimitiveProps) {
  return <Primitive geometry="capsuleGeometry" {...params} />;
}

export function Circle(params: PrimitiveProps) {
  return <Primitive geometry="circleGeometry" {...params} />;
}

export function Cone(params: PrimitiveProps) {
  return <Primitive geometry="coneGeometry" {...params} />;
}

export function Cylinder(params: PrimitiveProps) {
  return <Primitive geometry="cylinderGeometry" {...params} />;
}

export function Dodecahedron(params: PrimitiveProps) {
  return <Primitive geometry="dodecahedronGeometry" {...params} />;
}

export function Edges(params: PrimitiveProps) {
  return <Primitive geometry="edgesGeometry" {...params} />;
}

export function Extrude(params: PrimitiveProps) {
  return <Primitive geometry="extrudeGeometry" {...params} />;
}

export function Icosahedron(params: PrimitiveProps) {
  return <Primitive geometry="icosahedronGeometry" {...params} />;
}

export function Lathe(params: PrimitiveProps) {
  return <Primitive geometry="latheGeometry" {...params} />;
}

export function Octahedron(params: PrimitiveProps) {
  return <Primitive geometry="octahedronGeometry" {...params} />;
}

export function Plane(params: PrimitiveProps) {
  return <Primitive geometry="planeGeometry" {...params} />;
}

export function Polyhedron(params: PrimitiveProps) {
  return <Primitive geometry="polyhedronGeometry" {...params} />;
}

export function Ring(params: PrimitiveProps) {
  return <Primitive geometry="ringGeometry" {...params} />;
}

export function Shape(params: PrimitiveProps) {
  return <Primitive geometry="shapeGeometry" {...params} />;
}

type SphereProps = {
  _ref?: Ref<Mesh>;
  _key?: string;
  args?: number[];
  color?: string;
  materialType?: 'basic' | 'standard' | 'phong' | 'lambert';
  [key: string]: unknown;
};

export function Sphere(
  {
    _ref,
    _key,
    // hide,
    // args = [ 1 ],
    // color = 'white',
    materialType = 'basic',
    ...params
  }: SphereProps,
) {
  // const controls = useControls(
  //   `Sphere-${_key}`,
  //   {
  //     radius: {
  //       value: args[0],
  //       step: 0.0001,
  //       optional: true,
  //       innerLabelTrim: 10,
  //       pad: 10,
  //     },
  //     color: { value: color, optional: true },
  //   },
  //   [ ...args ],
  // );
  return (
    <Primitive
      ref={_ref}
      geometry="sphereGeometry"
      materialType={materialType}
      // args={[ controls.radius, ...args.slice(1) ]}
      // color={controls.color || color}
      {...params}
    />
  );
}

export function Tetrahedron(params: PrimitiveProps) {
  return <Primitive geometry="tetrahedronGeometry" {...params} />;
}

export function Torus(params: PrimitiveProps) {
  return <Primitive geometry="torusGeometry" {...params} />;
}

export function TorusKnot(params: PrimitiveProps) {
  return <Primitive geometry="torusKnotGeometry" {...params} />;
}

export function Tube(params: PrimitiveProps) {
  return <Primitive geometry="tubeGeometry" {...params} />;
}

export function Wireframe(params: PrimitiveProps) {
  return <Primitive geometry="wireframeGeometry" {...params} />;
}
