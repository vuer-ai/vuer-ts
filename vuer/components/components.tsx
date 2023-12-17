import React, {
  ChangeEvent,
  ChangeEventHandler,
  Component,
  FC,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Html, Splat } from '@react-three/drei';
import { imageToBase64 } from '../util';
import { Scene } from './three_components';
import { SocketContext } from './contexts/websocket';
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
import { Markdown } from './markdown/markdown';
import { AutoScroll } from './chat/autoscroll';
import { PointCloud } from './three_components/primitives/pointclound';
import { TriMesh } from './three_components/primitives/trimesh';
import { Gamepad } from './three_components/controls/gamepad';
import { Hands } from './three_components/controls/hands';
import { VuerProps } from '../interfaces';
import { SceneBackground } from './three_components/scene_background';
import { ImageBackground } from './three_components/image_background';
import { CoordsMarker } from "./three_components/primitives/CoordsMarker";

type VuerControlProps = VuerProps<{ value: never }>;

export function Button({ _key: key, value, ...props }: VuerControlProps) {
  const { sendMsg } = useContext(SocketContext);
  return (
    <button onClick={() => sendMsg({ etype: 'CLICK', key })} {...props}>
      {value}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Slider({
  _key: key, value: defaultValue, children, ...props
}: VuerControlProps) {
  const { sendMsg } = useContext(SocketContext);
  const [ value, setValue ] = useState<number>(defaultValue || 0);
  return (
    <>
      <input
        type="range"
        value={value}
        onMouseUp={({ target }: MouseEvent<HTMLInputElement>) => {
          const { value } = target as HTMLInputElement;
          sendMsg({ etype: 'SET', key, value });
        }}
        // @ts-expect-error: not sure how to fix
        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
          setValue(target.value as number);
        }}
        {...props}
      />
      <span>{value}</span>
    </>
  );
}

export function Img({ _key: key, children, ...props }: VuerProps) {
  const { sendMsg } = useContext(SocketContext);
  return (
    <img
      alt={props.alt || key}
      className="input-image"
      onClick={(e: MouseEvent<HTMLImageElement>) => {
        console.log('click on image');
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLImageElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        sendMsg({
          etype: 'CLICK',
          key,
          value: {
            x, y, w: rect.width, h: rect.height,
          },
        });
      }}
      {...props}
    />
  );
}

type InputProps = VuerProps<{
  buttonStyle;
  clearOnSubmit: boolean;
  defaultValue: string;
  defaultValues: string[];
  placeholder: string;
  style;
  textareaStyle;
  value: string;
}>;

export function Input(
  {
    _key: key,
    value: _value,
    style,
    textareaStyle = {},
    placeholder,
    defaultValue,
    // todo: allow multiple to choose from.
    // defaultValues,
    clearOnSubmit,
    children,
    // todo: allow line break with enter.
    ...props
  }: InputProps,
) {
  const [ value, setValue ] = useState(_value);
  const { sendMsg } = useContext(SocketContext);
  const onChange = useMemo<ChangeEventHandler<HTMLTextAreaElement>>(() => ({ target }) => {
    setValue(target.value);
  }, []);
  const onKeyUp = useMemo<KeyboardEventHandler<HTMLTextAreaElement>>(() => (e: KeyboardEvent) => {
    // info: choose default
    if (e.keyCode == 39 && !value) {
      // on right arrow key:
      if (!defaultValue) return;
      e.preventDefault();
      setValue(defaultValue);
    }
    // info: submit
    if (e.keyCode == 13 && !e.shiftKey) {
      // on enter:
      e.preventDefault();
      sendMsg({ etype: 'INPUT', key, value });
      if (clearOnSubmit) setValue('');
    }
  }, []);

  return (
    <form
      style={{
        flex: '0 0 auto',
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    >
      <textarea
        placeholder={
          placeholder
          || `"${defaultValue}" [ press ➡ for default, ⏎ to submit ]`
        }
        value={value}
        onChange={onChange}
        onKeyUp={onKeyUp}
        style={{
          flex: '1 1 auto',
          height: '100%',
          width: '100%',
          padding: '10px',
          // margin: "5px 0",
          marginTop: '5px',
          border: '1.5px solid #eee',
          borderRadius: '5px',
          ...textareaStyle,
        }}
      />
    </form>
  );
}

type ImageUploadProps = VuerProps<{ label: string }>;

export function ImageUpload({ _key: key, label }: ImageUploadProps) {
  const { sendMsg } = useContext(SocketContext);
  const [ file, setFile ] = useState<Blob | null>(null);
  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    // @ts-expect-error: not sure how to fix this;
    (e: ChangeEvent<HTMLInputElement>) => {
      setFile(e.target.files[0]);
    }, []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (file) {
          imageToBase64(file).then((base64) => {
            // chop off the data:image/png;base64, part
            const value = base64.slice(22);
            sendMsg({ etype: 'UPLOAD', key, value });
          });
        }
      }}
    >
      <label htmlFor="file">
        {label}
        {' '}
      </label>
      <input type="file" onChange={onChange}/>
      <input type="submit" value="Submit"/>
    </form>
  );
}

export function Div({ _key: key, ...props }: VuerProps) {
  return <div key={key} {...props} />;
}

type TextProps = VuerProps<{ text: string }>;

export function Text({ _key: key, text, ...props }: TextProps) {
  return <span {...props}>{text}</span>;
}

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
  // parts of the three-js scene components, can be written as an extension - Ge
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
  Splats: React.lazy(() => import( './gaussian_splatting' )) as Promise<Component>,
  BBox,
  Render,
  RenderLayer,
  AutoScroll,
  Markdown,
};
