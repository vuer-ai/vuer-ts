import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Euler, Group, InstancedMesh, Object3D, Vector3 } from "three";

const instances = [
  { position: new Vector3(1, 0, 0), rotation: new Euler(0, 0, -0.5 * Math.PI), color: new Color(0xff0000) },
  { position: new Vector3(0, 1, 0), rotation: new Euler(0, 0, 0), color: new Color(0x00ff00) },
  { position: new Vector3(0, 0, 1), rotation: new Euler(0.5 * Math.PI, 0, 0), color: new Color(0x0000ff) }
]

export type CoordsMarker = {
  matrix?: [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ],
  position?: [ number, number, number ],
  rotation?: [ number, number, number ],
  scale?: number,
  lod?: number,
  headScale?: number,
}


export function CoordsMarker({
  matrix,
  position,
  rotation,
  scale = 1.0,
  headScale = 1.0,
  lod = 10,
}: CoordsMarker) {

  const ref = useRef<Group>();
  const coneRef = useRef<InstancedMesh>();
  const cylinderRef = useRef<InstancedMesh>();

  const obj = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const coneIMesh = coneRef.current;
    if (!coneIMesh) return

    instances.forEach(({ position, rotation, color }, index) => {
      obj.position.set(position.x, position.y, position.z)
      obj.rotation.set(rotation.x, rotation.y, rotation.z)
      obj.updateMatrix()
      coneIMesh.setMatrixAt(index, obj.matrix)
      coneIMesh.setColorAt(index, color)
    })

  }, [])

  useLayoutEffect(() => {
    const cylinderIMesh = cylinderRef.current;
    if (!cylinderIMesh) return

    instances.forEach(({ position, rotation, color }, index) => {
      obj.position.set(position.x / 2, position.y / 2, position.z / 2)
      obj.rotation.set(rotation.x, rotation.y, rotation.z)
      obj.updateMatrix()
      cylinderIMesh.setMatrixAt(index, obj.matrix)
      cylinderIMesh.setColorAt(index, color)
    })

  }, [])

  useLayoutEffect(() => {
    const group = ref.current;
    if (!group || !matrix) return
    group.matrix.set(...matrix)
  }, [ matrix ])

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <instancedMesh ref={coneRef} args={[ null, null, 3 ]}>
        <coneGeometry args={[ 0.05 * headScale, 0.1 * headScale, lod, lod ]}/>
        <meshBasicMaterial/>
      </instancedMesh>
      <instancedMesh ref={cylinderRef} args={[ null, null, 3 ]}>
        <cylinderGeometry args={[ 0.025, 0.025, 1, lod, lod ]}/>
        <meshBasicMaterial/>
      </instancedMesh>
    </group>
  )
}