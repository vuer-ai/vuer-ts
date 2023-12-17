import { PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { GLTF, GLTFLoader, OBJLoader, PCDLoader, PLYLoader, STLLoader, } from 'three-stdlib';
import URDFLoader, { URDFRobot } from 'urdf-loader';
import { BufferGeometry, LoadingManager, Mesh, MeshStandardMaterial, Object3D, Points } from 'three'; // todo: pass reference
import { GltfView, ObjView, PcdView, PlyView, UrdfView, } from './components';
import { AppContext } from "../../index";

// todo: pass reference
// todo: change src to src

type Props = PropsWithChildren<{
  src?: string;
  text?: string;
  buff?: ArrayBuffer;
  hide?: boolean;
  encoding?: string;
  [key: string]: unknown;
}>;

export function Obj({
  src, text, buff, hide, encoding = 'ascii', ...rest
}: Props) {
  const [ data, setData ] = useState<{ scene: unknown } | undefined>();
  useEffect(() => {
    if (!data && hide) return;
    const loader = new OBJLoader();
    if (buff) text = (new TextDecoder(encoding)).decode(buff);
    if (text) setData(loader.parse(text));
    else if (src) loader.load(src, setData);
  }, [ src, hide ]);
  if (!data) return null;
  return <ObjView data={data} hide={hide} {...rest} />;
}

export function Pcd({
  src, text, buff, hide, encoding = 'ascii', ...rest
}: Props) {
  const [ data, setData ] = useState<Points>();
  useEffect(() => {
    if (!data && hide) return;
    const loader = new PCDLoader();
    if (buff) text = (new TextDecoder(encoding)).decode(buff);
    if (text) setData(loader.parse(text, '') as Points);
    else if (src) loader.load(src as string, setData);
  }, [ src, hide ]);
  if (!data) return null;
  return <PcdView data={data} hide={hide} {...rest} />;
}

export function Ply({
  src, text, buff, hide, encoding = 'ascii', ...rest
}: Props) {
  const [ data, setData ] = useState<BufferGeometry>();
  useEffect(() => {
    if (!data && hide) return;
    const loader = new PLYLoader();
    if (buff) text = (new TextDecoder(encoding)).decode(buff);
    if (text) setData(loader.parse(text));
    else if (src) loader.load(src, setData);
  }, [ src, hide ]);
  if (!data) return null;
  return <PlyView data={data} hide={hide} {...rest} />;
}

export function Glb({
  src, text, buff, hide, encoding = 'ascii', ...rest
}: Props) {
  const [ data, setData ] = useState<unknown>();
  useEffect(() => {
    if (!data && hide) return;
    const loader = new GLTFLoader();
    if (buff) text = (new TextDecoder(encoding)).decode(buff);
    if (text) loader.parse(text, '', setData);
    else if (src) loader.load(src, setData);
  }, [ src, hide ]);
  if (!data) return null;
  return <GltfView data={data as { scene: unknown }} hide={hide} {...rest} />;
}

type URDFProps = Props & {
  fetchOptions?;
  workingPath?: string;
  parseVisual?: boolean;
  parseCollision?: boolean;
  packages?: string | { [key: string]: string } | ((targetPkg: string) => string);
}

export function Urdf({
  src, text, buff, hide, encoding = 'ascii',
  jointValues,
  workingPath,
  fetchOptions,
  parseVisual,
  parseCollision,
  packages,
  ...rest
}: URDFProps) {
  const [ data, setData ] = useState<URDFRobot>();
  const { showError, showInfo } = useContext(AppContext);
  const loader: URDFLoader = useMemo(() => {
    const _loader = new URDFLoader();
    if (!!workingPath) _loader.workingPath = workingPath;
    if (!!fetchOptions) _loader.fetchOptions = fetchOptions;
    if (!!parseVisual) _loader.parseVisual = parseVisual;
    if (!!parseCollision) _loader.parseCollision = parseCollision;
    if (!!packages && packages.length) _loader.packages = packages;

    _loader.loadMeshCb = function (
      path: string,
      manager: LoadingManager,
      onLoad: (mesh: Object3D, err?: Error) => void
    ) {
      if (typeof path !== "string") return;
      const onError = (err) => {
        showError(`Failed to load mesh: ${path}`);
        onLoad(undefined, err);
      }
      if (path.endsWith(".obj")) new OBJLoader(manager).load(path, onLoad, undefined, onError);
      else if (path.endsWith(".stl")) new STLLoader(manager).load(path, (o) => onLoad(
        new Mesh(o, new MeshStandardMaterial())), undefined, onError);
      else if (path.endsWith(".glb")) new GLTFLoader(manager).load(path, (o: GLTF) => onLoad(o.scene), undefined, onError);
      else if (path.endsWith(".gltf")) new GLTFLoader(manager).load(path, (o: GLTF) => onLoad(o.scene), undefined, onError);
      else if (path.endsWith(".pcd")) new PCDLoader(manager).load(path, onLoad, undefined, onError);
      else showInfo(`Unknown mesh type: ${path}`)
    }
    return _loader;
  }, [
    jointValues,
    workingPath,
    fetchOptions,
    parseVisual,
    parseCollision,
    packages,
  ]);

  useEffect(() => {
    if (!data && hide) return;

    if (buff) text = (new TextDecoder(encoding)).decode(buff);

    console.log(text, src)

    if (text) setData(loader.parse(text));
    else if (src) loader.load(src, setData);

  }, [ loader, src, hide ]);
  if (!data) return null;
  return (
    <UrdfView robot={data} jointValues={jointValues} hide={hide} {...rest} />
  );
}
