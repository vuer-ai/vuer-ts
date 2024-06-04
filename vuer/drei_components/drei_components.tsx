import { Component, FC } from "react";
import {
  AccumulativeShadows,
  AdaptiveDpr,
  AdaptiveEvents,
  AsciiRenderer,
  Backdrop,
  BakeShadows,
  BBAnchor,
  Billboard,
  Bounds,
  Bvh,
  CameraShake,
  CatmullRomLine,
  Caustics,
  Center,
  Clone,
  Cloud,
  ComputedAttribute,
  ContactShadows,
  CubicBezierLine,
  CurveModifier,
  CycleRaycast,
  Decal,
  Detailed,
  Edges,
  Effects,
  Environment,
  Extrude,
  FaceLandmarker,
  Facemesh,
  Fisheye,
  Float,
  Gltf,
  GradientTexture,
  Html,
  Hud,
  Image,
  Instances,
  Lathe,
  Lightformer,
  Line,
  MarchingCubes,
  Mask,
  Merged,
  meshBounds,
  MeshDiscardMaterial,
  MeshDistortMaterial,
  MeshPortalMaterial,
  MeshReflectorMaterial,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  MeshWobbleMaterial,
  Outlines,
  PerformanceMonitor,
  PointMaterial,
  Points,
  PositionalAudio,
  Preload,
  QuadraticBezierLine,
  RandomizedLight,
  RenderCubeTexture,
  RenderTexture,
  Resize,
  RoundedBox,
  Sampler,
  ScreenQuad,
  ScreenSpace,
  Segments,
  Select,
  Shadow,
  Shape,
  Sky,
  SoftShadows,
  Sparkles,
  SpotLight,
  SpotLightShadow,
  SpriteAnimator,
  Stage,
  Stars,
  Stats,
  StatsGl,
  Svg,
  Text,
  Text3D,
  Trail,
  View,
  Wireframe,
} from "@react-three/drei";
import { VuerSplat } from "./VuerSplats";

// prettier-ignore
type CompList = Record<string, FC | Component | Promise<Component>>;
export const drei_component_list: CompList = {
  Line,
  QuadraticBezierLine,
  CubicBezierLine,
  CatmullRomLine,
  Facemesh,
  Stage,
  Backdrop,
  Shadow,
  Caustics,
  ContactShadows,
  RandomizedLight,
  AccumulativeShadows,
  //**Cameras */
  // PerspectiveCamera,
  // OrthographicCamera,
  // CubeCamera,
  //**Controls */
  // CameraControls,
  // FlyControls,
  // MapControls,
  // DeviceOrientationControls,
  // TrackballControls,
  // ArcballControls,
  // PointerLockControls,
  // FirstPersonControls,
  // ScrollControls,
  // PresentationControls,
  // KeyboardControls,
  // FaceControls,
  // MotionPathControls,
  //** Gizmos */
  // GizmoHelper,
  // PivotControls,
  // DragControls,
  // TransformControls,
  // Grid,
  // useHelper,
  // Helper,
  //** Abstractions */
  Image,
  Text,
  Text3D,
  PositionalAudio,
  Billboard,
  ScreenSpace,
  // ScreenSizer,
  Effects,
  GradientTexture,
  Edges,
  Outlines,
  Trail,
  Sampler,
  ComputedAttribute,
  Clone,
  // useAnimations,
  MarchingCubes,
  Decal,
  Svg,
  Gltf,
  AsciiRenderer,
  // Splat,
  Splat: VuerSplat,
  //** Shaders */
  MeshReflectorMaterial,
  MeshWobbleMaterial,
  MeshDistortMaterial,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  MeshDiscardMaterial,
  PointMaterial,
  SoftShadows,
  // shaderMaterial,
  //** Misc */
  // Example,
  Html,
  CycleRaycast,
  Select,
  SpriteAnimator,
  Stats,
  StatsGl,
  Wireframe,
  // useDepthBuffer,
  // useContextBridge,
  // useFBO,
  // useCamera,
  // useCubeCamera,
  // useDetectGPU,
  // useAspect,
  // useCursor,
  // useIntersect,
  // useBoxProjectedEnv,
  // useTrail,
  // useSurfaceSampler,
  FaceLandmarker,
  //** Loaders */
  // Loader,
  // useProgress,
  // useGLTF,
  // useFBX,
  // useTexture,
  // useKTX2,
  // useCubeTexture,
  // useVideoTexture,
  // useTrailTexture,
  // useFont,
  // useSpriteLoader,
  // Performance,
  Instances,
  Merged,
  Points,
  Segments,
  Detailed,
  Preload,
  BakeShadows,
  // meshBounds,
  AdaptiveDpr,
  AdaptiveEvents,
  Bvh,
  PerformanceMonitor,
  //** Portals */
  Hud,
  View,
  RenderTexture,
  RenderCubeTexture,
  Fisheye,
  Mask,
  MeshPortalMaterial,
  //** Modifiers */
  CurveModifier,
  //**Shapes*/
  // Plane,
  // Box,
  // Sphere,
  // Circle,
  // Cone,
  // Cylinder,
  // Tube,
  // Torus,
  // TorusKnot,
  // Ring,
  // Tetrahedron,
  // Polyhedron,
  // Icosahedron,
  // Octahedron,
  // Dodecahedron,
  Extrude,
  Lathe,
  Shape,
  RoundedBox,
  ScreenQuad,
  //** Staging */
  Center,
  Resize,
  BBAnchor,
  Bounds,
  CameraShake,
  Float,
  Environment,
  Lightformer,
  SpotLight,
  SpotLightShadow,
  Sky,
  Stars,
  Sparkles,
  Cloud,
  // useEnvironment,
  // useMatcapTexture,
  // useNormalTexture,
  // ShadowAlpha,
};