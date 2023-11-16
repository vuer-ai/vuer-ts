import {
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
    useState
} from "react";
import {Html} from "@react-three/drei";
import {imageToBase64} from "../_util";
import {Scene} from "./_three_components/_index";
import {SocketContext, SocketContextType} from "./_contexts/_websocket";
import {Glb, Obj, Pcd, Ply, Urdf} from "./_three_components/_data_loaders";
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
} from "./_three_components/_primitives/_primitives";
import {Gripper, SkeletalGripper} from "./_three_components/_components";
import {Movable, Pivot} from "./_three_components/_controls/_movables";
import {Camera} from "./_three_components/_camera";
import {BBox} from "./_three_components/_primitives/_bbox";
import {CameraView} from "./_three_components/_camera_view";
import {AmbientLight, DirectionalLight, PointLight, SpotLight,} from "./_three_components/_lighting";
import {Frustum} from "./_three_components/_frustum";
import {Render, RenderLayer} from "./_nerf_components/_view";
import {Markdown} from "./_markdown/_markdown";
import {AutoScroll} from "./_chat/_autoscroll";
import {PointCloud} from "./_three_components/_primitives/_pointclound";
import {TriMesh} from "./_three_components/_primitives/_trimesh";
import {Gamepad} from "./_three_components/_controls/_gamepad";
import {Hands} from "./_three_components/_controls/_hands";
import {VuerProps} from "../_interfaces.tsx";

type VuerControlProps = VuerProps<{ value: never }>

export function Button({_key: key, value, ...props}: VuerControlProps) {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    return (
        <button onClick={() => sendMsg({etype: "CLICK", key})} {...props}>
            {value}
        </button>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Slider({_key: key, value: defaultValue, children, ...props}: VuerControlProps) {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    const [value, setValue] = useState<number>(defaultValue || 0);
    return (
        <>
            <input
                type="range"
                value={value}
                onMouseUp={({target}: MouseEvent<HTMLInputElement>) => {
                    const {value} = target as HTMLInputElement;
                    sendMsg({etype: "SET", key, value});
                }}
                // @ts-ignore: not sure how to fix
                onChange={({target}: ChangeEvent<HTMLInputElement>) => setValue(target.value as number)}
                {...props}
            />
            <span>{value}</span>
        </>
    );
}

export function Img({_key: key, children, ...props}: VuerProps) {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    return (
        <img
            className="input-image"
            onClick={(e: MouseEvent<HTMLImageElement>) => {
                console.log("click on image");
                e.preventDefault();
                e.stopPropagation();
                const target = e.target as HTMLImageElement;
                const rect = target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                sendMsg({
                    etype: "CLICK",
                    key,
                    value: {x: x, y: y, w: rect.width, h: rect.height},
                });
            }}
            {...props}
        />
    );
}

type InputProps = VuerProps<{
    value: string;
    style: any;
    defaultValue: string;
    defaultValues: string[];
    placeholder: string;
    clearOnSubmit: boolean;
    textareaStyle: any;
    buttonStyle: any;
}>

export function Input(
    {
        _key: key,
        value: _value,
        style,
        textareaStyle = {},
        placeholder,
        defaultValue,
        // todo: allow multiple to choose from.
        defaultValues,
        clearOnSubmit,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        children,
        // todo: allow line break with enter.
        ...props
    }: InputProps
) {
    const [value, setValue] = useState(_value);
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    const onChange = useMemo<ChangeEventHandler<HTMLTextAreaElement>>(
        () => ({target}) => {
            setValue(target.value);
        }, []);
    const onKeyUp = useMemo<KeyboardEventHandler<HTMLTextAreaElement>>(
        () => (e: KeyboardEvent) => {
            // info: choose default
            if (e.keyCode == 39 && !value) {
                // on right arrow key:
                if (!defaultValue) return;
                e.preventDefault();
                setValue(defaultValue);
            }
            // info: submit
            if (e.keyCode == 13 && e.shiftKey == false) {
                // on enter:
                e.preventDefault();
                sendMsg({etype: "INPUT", key, value});
                if (clearOnSubmit) setValue("");
            }
        }, []);
    return (
        <form
            style={{
                flex: "0 0 auto",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
            {...props}
        >
      <textarea
          placeholder={
              placeholder ||
              `"${defaultValue}" [ press ➡ for default, ⏎ to submit ]`
          }
          value={value}
          onChange={onChange}
          onKeyUp={onKeyUp}
          style={{
              flex: "1 1 auto",
              height: "100%",
              width: "100%",
              padding: "10px",
              // margin: "5px 0",
              marginTop: "5px",
              border: "1.5px solid #eee",
              borderRadius: "5px",
              ...textareaStyle,
          }}
      />
        </form>
    );
}

type ImageUploadProps = VuerProps<{ label: string }>


export function ImageUpload({_key: key, label}: ImageUploadProps) {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    const [file, setFile] = useState<Blob | null>(null);
    const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        // @ts-ignore: not sure how to fix this;
        (e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files[0]), []);
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!!file) imageToBase64(file).then((base64) => {
                    // chop off the data:image/png;base64, part
                    const value = base64.slice(22);
                    sendMsg({etype: "UPLOAD", key, value});
                });
            }}
        >
            <label htmlFor="file">{label} </label>
            <input type="file" onChange={onChange}/>
            <input type="submit" value="Submit"/>
        </form>
    );
}

export function Div({_key: key, ...props}: VuerProps) {
    return <div key={key} {...props} />;
}

type TextProps = VuerProps<{ text: string }>

export function Text({_key: key, text, ...props}: TextProps) {
    return <span {...props}>{text}</span>;
}

// prettier-ignore
type CompList = {
    [key: string]: FC | Component | unknown;
}
export const comp_list: CompList = {
    Slider, Input, Text, Img, Button, ImageUpload, Div,
    // parts of the three-js scene components, can be written as an extension - Ge
    Scene, Ply, Obj, Pcd, Glb, Gltf: Glb,
    PointCloud, TriMesh,
    Urdf, Gripper, SkeletalGripper, Pivot, Movable,
    Gamepad, Hands,
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
    PointLight, DirectionalLight, AmbientLight, SpotLight,
    CameraView, Camera, Html, BBox,
    Render, RenderLayer,
    AutoScroll,
    Markdown,
};
