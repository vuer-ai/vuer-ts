import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { Canvas, extend, useThree } from '@react-three/fiber'
import { CameraControls, Effects, Float, Splat, StatsGl } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { useControls } from 'leva'

extend({ TAARenderPass, OutputPass })

// https://twitter.com/alexcarliera
const cakewalk = 'https://huggingface.co/cakewalk/splat-data/resolve/main'
// https://twitter.com/dylan_ebert_
const dylanebert = 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/kitchen'

export default function App() {
  const { root , checkpoint } = useControls({
    root: { value: 'default', options: [ 'default', 'physics', 'alphahash', 'truck' ] },
    checkpoint: { value: cakewalk, label: "Checkpoint" }
  })
  return (
    <div style={{ "height": "100vh", "width": "100vw" }}>
      <Canvas dpr={1.5} gl={{ antialias: false }} camera={{ position: [ 4, 1.5, -4 ], fov: 35 }}>
        <color attach="background" args={[ 'white' ]}/>
        <CameraControls makeDefault/>
        <StatsGl/>
        {root === 'default' ? <Default/> : root === 'physics' ? <Phys/> : root === 'alphahash' ? <TAA/> : <Truck/>}
      </Canvas>
    </div>
  )
}

const Default = () => (
  <>
    <Float>
      <Splat alphaTest={0.1} src={`${cakewalk}/nike.splat`} scale={0.5} position={[ 0, 1.6, 2 ]}/>
    </Float>
    <Float>
      <Splat alphaTest={0.1} src={`${cakewalk}/nike.splat`} scale={0.5} position={[ 0, 1.6, -1.5 ]}
             rotation={[ Math.PI, 0, Math.PI ]}/>
    </Float>
    <Float>
      <Splat alphaTest={0.1} src={`${cakewalk}/plush.splat`} scale={0.5} position={[ -1.5, 1.6, 1 ]}/>
    </Float>
    <Splat src={`${dylanebert}/kitchen-7k.splat`} position={[ 0, 0.25, 0 ]}/>
  </>
)

const TAA = () => (
  <>
    <Splat alphaHash src={`${cakewalk}/nike.splat`} scale={0.5} position={[ 0, 1.6, 2 ]}/>
    <Splat alphaHash src={`${cakewalk}/nike.splat`} scale={0.5} position={[ 0, 1.6, -1.5 ]}
           rotation={[ Math.PI, 0, Math.PI ]}/>
    <Splat alphaHash src={`${cakewalk}/plush.splat`} scale={0.5} position={[ -1.5, 1.6, 1 ]}/>
    <Splat alphaHash src={`${dylanebert}/kitchen-7k.splat`} position={[ 0, 0.25, 0 ]}/>
    <Post/>
  </>
)

const Truck = () => <Splat src={`${cakewalk}/truck.splat`} position={[ 0, 0, 0 ]}/>

const Phys = () => (
  <>
    <Physics>
      <Shoe position={[ 0, 5, 0 ]}/>
      <Shoe position={[ 0, 7, 0 ]} rotation-y={0.5}/>
      <Shoe position={[ 0, 9, 0 ]} rotation-y={1}/>
      <CuboidCollider position={[ 0, -0.6, 0 ]} args={[ 20, 0.5, 20 ]}/>
    </Physics>
    <Splat src={`${dylanebert}/kitchen-7k.splat`} position={[ 0, 0.25, 0 ]}/>
  </>
)

const Shoe = (props) => (
  <RigidBody {...props} colliders={false}>
    <BallCollider position={[ -0.5, 0, -0.1 ]} args={[ 0.25 ]}/>
    <BallCollider position={[ -0, 0, -0 ]} args={[ 0.2 ]}/>
    <BallCollider position={[ 0.65, 0, -0 ]} args={[ 0.1 ]}/>
    <CuboidCollider rotation={[ 0, 0, 0.2 ]} position={[ 0.3, -0.1, 0 ]} args={[ 0.3, 0.1, 0.2 ]}/>
    <CuboidCollider rotation={[ 0, -0.2, -0.1 ]} position={[ -0.4, -0.15, -0.1 ]} args={[ 0.3, 0.1, 0.15 ]}/>
    <CuboidCollider rotation={[ 0, 0, -0.3 ]} position={[ 0.3, 0.05, 0 ]} args={[ 0.3, 0.1, 0.15 ]}/>
    <CuboidCollider rotation={[ 0, -0.1, 0 ]} position={[ -0.3, 0.15, -0.05 ]} args={[ 0.3, 0.1, 0.15 ]}/>
    <Splat alphaTest={0.1} src={`${cakewalk}/nike.splat`} scale={0.5} position={[ -0.05, 1.1, 0.05 ]}
           rotation={[ -0.51, 0, 0.1 ]}/>
  </RigidBody>
)

function Post() {
  const taa = useRef(null)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)

  useEffect(() => {
    const oldToneMapping = gl.toneMapping
    gl.toneMapping = THREE.NoToneMapping
    if (controls) {
      const wake = () => {
        taa.current.accumulate = false
        taa.current.sampleLevel = 0
      }
      const rest = () => {
        taa.current.accumulate = true
        taa.current.sampleLevel = 2
      }
      controls.addEventListener('wake', wake)
      controls.addEventListener('sleep', rest)
      return () => {
        gl.toneMapping = oldToneMapping
        controls.removeEventListener('wake', wake)
        controls.removeEventListener('sleep', rest)
      }
    }
  }, [ controls ])

  return (
    <Effects disableRenderPass disableGamma>
      <tAARenderPass ref={taa} accumulate={true} sampleLevel={2} args={[ scene, camera ]}/>
      <outputPass/>
    </Effects>
  )
}
