import {PropsWithChildren, useEffect, useState} from 'react'
import {GltfView, ObjView, PcdView, PlyView, UrdfView} from "./_components";
import {GLTFLoader, OBJLoader, PCDLoader, PLYLoader} from "three-stdlib";
import URDFLoader, {URDFRobot} from "urdf-loader";
import {BufferGeometry, Points} from "three"; // todo: pass reference

// todo: pass reference
// todo: change src to src

type Props = PropsWithChildren<{
    src?: string;
    text?: string;
    buff?: ArrayBuffer;
    hide?: boolean;
    encoding?: string;
    [key: string]: any;
}>;

export function Obj({src, text, buff, hide, encoding = "ascii", ...rest}: Props) {
    const [data, setData] = useState<any>();
    useEffect(() => {
        if (!data && hide) return;
        const loader = new OBJLoader();
        if (buff) text = (new TextDecoder(encoding)).decode(buff);
        if (text) setData(loader.parse(text));
        else if (src) loader.load(src, setData);
    }, [src, hide]);
    if (!data) return null;
    return <ObjView data={data} hide={hide} {...rest} />;
}

export function Pcd({src, text, buff, hide, encoding = "ascii", ...rest}: Props) {
    const [data, setData] = useState<Points>();
    useEffect(() => {
        if (!data && hide) return;
        const loader = new PCDLoader();
        if (buff) text = (new TextDecoder(encoding)).decode(buff);
        if (text) setData(loader.parse(text, "") as Points);
        else if (src) loader.load(src as string, setData);
    }, [src, hide]);
    if (!data) return null;
    return <PcdView data={data} hide={hide} {...rest} />;
}

export function Ply({src, text, buff, hide, encoding = "ascii", ...rest}: Props) {
    const [data, setData] = useState<BufferGeometry>();
    useEffect(() => {
        if (!data && hide) return;
        const loader = new PLYLoader();
        if (buff) text = (new TextDecoder(encoding)).decode(buff);
        if (text) setData(loader.parse(text));
        else if (src) loader.load(src, setData);
    }, [src, hide]);
    if (!data) return null;
    return <PlyView data={data} hide={hide} {...rest} />;
}

export function Glb({src, text, buff, hide, encoding = "ascii", ...rest}: Props) {
    const [data, setData] = useState<any>();
    useEffect(() => {
        if (!data && hide) return;
        const loader = new GLTFLoader();
        if (buff) text = (new TextDecoder(encoding)).decode(buff);
        if (text) loader.parse(text, "", setData);
        else if (src) loader.load(src, setData);
    }, [src, hide]);
    if (!data) return null;
    return <GltfView data={data} hide={hide} {...rest} />;
}

export function Urdf({src, text, buff, hide, encoding = "ascii", jointValues, ...rest}: Props) {
    const [data, setData] = useState<URDFRobot>();
    useEffect(() => {
        if (!data && hide) return;
        const loader = new URDFLoader();
        if (buff) text = (new TextDecoder(encoding)).decode(buff);
        if (text) setData(loader.parse(text));
        else if (src) loader.load(src, setData);
    }, [src, hide]);
    if (!data) return null;
    return (
        <UrdfView robot={data} jointValues={jointValues} hide={hide} {...rest} />
    );
}