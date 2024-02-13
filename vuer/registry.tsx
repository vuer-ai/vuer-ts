/** Component Registar
 *
 * - This file is used to register all the components that are available to the user.
 *
 * todo: need to change this into a factory function and a registry object.
 */
import React, { Component, FC, } from 'react';
import { Scene } from './three_components/scene';
import { Glb, Obj, Pcd, Ply, Urdf, } from './three_components/data_loaders';
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
} from './three_components/primitives/primitives';
import { Gripper, SkeletalGripper } from './three_components/components';
import { Movable, Pivot } from './three_components/controls/movables';
import { Camera } from './three_components/camera';
import { BBox } from './three_components/primitives/bbox';
import { CameraView } from './three_components/camera_view/camera_view';
import { AmbientLight, DirectionalLight, PointLight, SpotLight, } from './three_components/lighting';
import { Frustum } from './three_components/frustum';
import { Render, RenderLayer } from './nerf_components/view';
import { Markdown } from './html_components/markdown/markdown';
import { AutoScroll } from './html_components/chat/autoscroll';
import { PointCloud } from './three_components/primitives/pointcloud';
import { TriMesh } from './three_components/primitives/trimesh';
import { Gamepad } from './three_components/controls/gamepad';
import { Hands } from './three_components/controls/hands';
import { SceneBackground } from './three_components/scene_background';
import { ImageBackground } from './three_components/image_background';
import { Arrow, CoordsMarker } from "./three_components/primitives/CoordsMarker";
import { Button, Div, ImageUpload, Img, Input, Slider, Text } from "./html_components/input_components";
import GrabRender from "./three_components/camera_view/GrabRender";
import { TimelineControls } from "./uxr_components/TimelineControls";
import { PointerControls } from "./three_components/controls/pointer";
import { Grid } from "./three_components/grid";
import { drei_component_list } from "./drei_components";
import SceneContainer from "./three_components";

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
  // three components
  SceneContainer,
  Scene,
  SceneBackground,
  ImageBackground,
  Ply,
  Obj,
  Pcd,
  Glb,
  // this is an alias for GLB
  Gltf: Glb,
  PointCloud,
  TriMesh,
  Urdf,
  Gripper,
  SkeletalGripper,
  CoordsMarker,
  Arrow,
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
  GrabRender,
  TimelineControls,
  PointerControls,
  Grid,
  Splats: React.lazy(() => import( './third_party/luma_splats' )),
  BBox,
  Render,
  RenderLayer,
  AutoScroll,
  Markdown,
  ...drei_component_list
};
