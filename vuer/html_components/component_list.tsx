import React, { Component, FC, } from 'react';
import { Html, Splat } from '@react-three/drei';
import { Scene } from '../three_components';
import { Glb, Obj, Pcd, Ply, Urdf, } from '../three_components/data_loaders';
import {
  Box,
  Capsule,
  Circle,
  Cone,
  Cylinder,
  Dodecahedron,
  Edges,
  Extrude,
  Icosahedron,
  Lathe,
  Octahedron,
  Plane,
  Polyhedron,
  Ring,
  Shape,
  Sphere,
  Tetrahedron,
  Torus,
  TorusKnot,
  Tube,
  Wireframe,
} from '../three_components/primitives/primitives';
import { Gripper, SkeletalGripper } from '../three_components/components';
import { Movable, Pivot } from '../three_components/controls/movables';
import { Camera } from '../three_components/camera';
import { BBox } from '../three_components/primitives/bbox';
import { CameraView } from '../three_components/camera_view/camera_view';
import { AmbientLight, DirectionalLight, PointLight, SpotLight, } from '../three_components/lighting';
import { Frustum } from '../three_components/frustum';
import { Render, RenderLayer } from '../nerf_components/view';
import { Markdown } from './markdown/markdown';
import { AutoScroll } from './chat/autoscroll';
import { PointCloud } from '../three_components/primitives/pointclound';
import { TriMesh } from '../three_components/primitives/trimesh';
import { Gamepad } from '../three_components/controls/gamepad';
import { Hands } from '../three_components/controls/hands';
import { SceneBackground } from '../three_components/scene_background';
import { ImageBackground } from '../three_components/image_background';
import { CoordsMarker } from "../three_components/primitives/CoordsMarker";
import { Button, Div, ImageUpload, Img, Input, Slider, Text } from "./input_components";

// prettier-ignore
type CompList = Record<string, FC | Component | Promise<Component>>;
export const comp_list: CompList = {
  Slider,
  Input,
  Text,
  Img,
  Button,
  ImageUpload,
  Div,
  // parts of the three-js scene html_components, can be written as an extension - Ge
  SceneBackground,
  ImageBackground,
  Scene,
  Ply,
  Obj,
  Pcd,
  Glb,
  Gltf: Glb,
  PointCloud,
  TriMesh,
  Urdf,
  Gripper,
  SkeletalGripper,
  CoordsMarker,
  Pivot,
  Movable,
  Gamepad,
  Hands,
  Frustum,
  Box,
  Capsule,
  Circle,
  Cone,
  Cylinder,
  Dodecahedron,
  Edges,
  Extrude,
  Icosahedron,
  Lathe,
  Octahedron,
  Plane,
  Polyhedron,
  Ring,
  Shape,
  Sphere,
  Tetrahedron,
  Torus,
  TorusKnot,
  Tube,
  Wireframe,
  PointLight,
  DirectionalLight,
  AmbientLight,
  SpotLight,
  CameraView,
  Camera,
  Html,
  Splat,
  Splats: React.lazy(() => import( '../third_party/luma_splats' )) as Promise<Component>,
  BBox,
  Render,
  RenderLayer,
  AutoScroll,
  Markdown,
};
