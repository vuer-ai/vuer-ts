import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import queryString from 'query-string';
import { button, folder, Leva, useControls } from 'leva';
import useFetch from 'use-http';
import yaml from 'js-yaml';
import useStateRef from 'react-usestateref';
import { document } from './third_party/browser-monads';
import { Scene } from './three_components/scene';
import { Hydrate } from './html_components';
import { list2menu } from './three_components/leva_helper';
import { addNode, findByKey, removeByKey, upsert } from './util';
import { WebSocketProvider } from './html_components/contexts/websocket';
import { parseArray } from './three_components/utils';
import { ServerEvent } from './interfaces';
import { pack, unpack } from "msgpackr";
import { Buffer } from "buffer";
import { Grid } from "./three_components/grid";
import { ToneMapping } from "./three_components/ToneMapping";

// The dataloader component hides the list of children from the outer scope.
// this means we can not directly show the
export interface Node {
  key?: string;
  tag: string;
  children?: Node[] | string[] | null;

  [key: string]: unknown;
}

function makeProps(props?) {
  return (data: Node[]) => {
    return (data || [])
      .map(({ key, ...child }: Node) => <Hydrate key={key} _key={key} {...props} {...child} />);
  };
}

interface QueryParams {
  scene?: string;
  collapseMenu?: string;
  initCameraPosition?: number[];
  pointSize?: string;
}

interface SceneType {
  children: Node[];
  htmlChildren: Node[];
  rawChildren: Node[];
  bgChildren: Node[];
}

// const { showError } = useContext(AppContext);
// showError("The scene content likely contain large amount of data. Please use ")

type VuerRootProps = PropsWithChildren<{
  style?;
  up: [ number, number, number ];
}>;

export const AppContext = createContext({
  showError: (msg: string) => console.error(msg),
  showInfo: (msg: string) => console.info(msg),
  showSuccess: (msg: string) => console.log(msg),
  showWarning: (msg: string) => console.warn(msg),
  showModal: (msg: string) => {
    console.log(msg);
  }
});


export const AppProvider = AppContext.Provider;

function isEmpty(obj?: unknown[] | null) {
  if (typeof obj === 'undefined') return true;
  if (obj === null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  return Object.keys(obj).length === 0;
}

const SceneAttrs = [
  'children', 'rawChildren', 'htmlChildren', 'bgChildren'
]

export default function VuerRoot({ style, children: _, ..._props }: VuerRootProps) {

  const queries = useMemo<QueryParams>(() => {
    const parsed = queryString.parse(document.location.search);
    if (typeof parsed.collapseMenu === 'string') parsed.collapseMenu = parsed.collapseMenu.toLowerCase();
    // @ts-expect-error: initCameraPosition is a number[]
    parsed.initCameraPosition = parseArray(parsed.initCameraPosition);
    return parsed;
  }, []);
  const collapseMenu = useMemo<boolean>(
    () => queries.collapseMenu === 'true',
    [ queries.collapseMenu ],
  );

  const { showError } = useContext(AppContext)

  const [ scene, setScene, sceneRef ] = useStateRef<SceneType>({
    children: [],
    htmlChildren: [],
    rawChildren: [],
    bgChildren: [],
  });

  const [ menu, setMenu ] = useState({});
  const { response } = useFetch(queries.scene, []);

  useEffect(() => {
    // do not change the scene using Fetch unless queries.scene is set.
    if (!queries.scene) return;

    // @ts-expect-error: fixme
    const scene_uri: string = queries.scene.toLowerCase();
    let _scene;
    if (scene_uri.endsWith('.json')) {
      _scene = response.data;
    } else if (scene_uri.endsWith('.yml') || scene_uri.endsWith('.yaml')) {
      _scene = yaml.load(response.data);
    } else if (queries.scene) {
      try {
        const b = new Buffer(queries.scene, "base64");
        _scene = unpack(b);
      } catch (e) {
        console.log("Failed to parse scene", e);
        _scene = { children: [] };
      }
      console.log('not implemented');
    }
    if (!!scene) setScene(_scene);
    setMenu(list2menu(_scene.children, false));
  }, [ queries.scene, response.data ]);

  useControls(
    () => ({
      'Camera Control': folder(
        {
          show_cameras: { value: false, label: 'Show Cameras' },
        },
        { collapsed: true },
      ),
      "Share": button(() => {
        const sceneStr = pack(scene);
        if (sceneStr.length > 10_000) {
          return showError(`The scene likely contains a large amount of data. To share, please replace 
          geometry data with an URI. Length is ${sceneStr.length} bytes.`)
        }
        const chars = String.fromCharCode.apply(null, sceneStr)
        const scene64b = btoa(chars);
        const url = new URL(document.location);
        url.searchParams.set('scene', scene64b);
        document.location.href = url.toString();
      }, { label: "Share Scene" }),
      Scene: folder({}),
      Render: folder(
        {
          // showRender: { value: false, label: "Show Rendering" },
        },
        { collapsed: true },
      ),
      'Scene.Options': folder(
        {
          ...menu,
        },
        { collapsed: true, order: -2 },
      ),
    }),
    [ menu, scene ],
  );

  const onMessage = useCallback(
    ({ etype, data }: ServerEvent) => {
      if (etype === 'SET') {
        // the top level is a dummy node
        if (data.tag !== "Scene") showError(`The top level node of the SET operation must be a <Scene/> object, got <${data.tag}/> instead.`)
        setScene(data as SceneType);
      } else if (etype === 'ADD') {
        // the API need to be updated, so are the rest of the API.
        const { nodes, to: parentKey } = data;
        let dirty;
        for (const node of nodes) {
          try {
            const hasAdded = addNode(sceneRef.current, node, parentKey);
            dirty = dirty || hasAdded;
          } catch (e) {
            showError(`Failed to add node ${node.key} to ${parentKey}. ${e}`);
          }
        }
        if (dirty) setScene({ ...sceneRef.current });
      } else if (etype === 'UPDATE') {
        /* this is the find and update. */
        let dirty = false;
        const { nodes } = data;
        for (const { key, ...props } of nodes) {
          const node = findByKey(sceneRef.current, key, SceneAttrs);
          if (node) {
            Object.assign(node, props);
            dirty = true;
          } else {
            console.log('node not found', key, sceneRef.current);
          }
        }
        if (dirty) {
          // note: use the spread to create a new instance to trigger update.
          setScene({ ...sceneRef.current });
        }
      } else if (etype === 'UPSERT') {
        /* this is the find and update, or add if not found.. */
        const { nodes, to } = data;
        const parentKey = to || 'children';

        if (SceneAttrs.indexOf(parentKey) > -1) {
          upsert(sceneRef.current, nodes, parentKey);
        } else {
          const parent = findByKey(sceneRef.current, parentKey, SceneAttrs);
          if (!parent) return showError(`Failed to find parent ${parentKey}`);
          upsert(parent, nodes, 'children');
        }
        // note: use the spread to create a new instance to trigger update.
        setScene({ ...sceneRef.current });
      } else if (etype === 'REMOVE') {
        const { keys } = data;
        let dirty;
        for (const key of keys) {
          const removed = removeByKey(sceneRef.current, key);
          dirty = dirty || (removed?.length > 0)
        }
        if (dirty) setScene({ ...sceneRef.current });
      } else {
        // print here
      }
    },
    [],
  );

  const {
    children: sceneChildren,
    htmlChildren: sceneHtmlChildren,
    rawChildren: sceneRawChildren,
    bgChildren: sceneBackgroundChildren,
    ..._scene
  } = scene;

  // very problematic
  const rest = {
    // up: [ 0, 0, 1 ],
    ..._props,
    // add the scene params here to allow programmatic override
    ..._scene,
  };

  const toProps = useCallback(makeProps(), []);

  const children = sceneChildren ? toProps(sceneChildren) : [];
  const rawChildren = sceneRawChildren
    ? toProps(sceneRawChildren)
    : [];
  const htmlChildren = sceneHtmlChildren
    ? toProps(sceneHtmlChildren)
    : [];
  const bgChildren = sceneBackgroundChildren
    ? toProps(sceneBackgroundChildren)
    : [];

  const sceneStyle = useMemo(
    () => ({
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: 10,
      ...(style || {}),
    }),
    [ style ],
  );

  if (!bgChildren?.length) {
    // note: add key to avoid error message
    const k = "default grid";
    bgChildren.push(<Grid key={k} _key={k}/>);
  }

  if (!rawChildren?.length) {
    // note: add key to avoid error message
    rawChildren.push(<ToneMapping key="default-tone-mapping"/>);
  }

  // todo: might want to treat scene as one of the children.
  // note: finding a way to handle the leva menu will be tricky.
  return (
    <WebSocketProvider onMessage={onMessage}>
      <Scene
        bgChildren={bgChildren}
        htmlChildren={htmlChildren}
        rawChildren={rawChildren}
        style={sceneStyle}
        {...rest}
      >
        {children}
      </Scene>
      <Leva
        theme={{
          sizes: {
            rootWidth: '380px',
            controlWidth: '200px',
            numberInputMinWidth: '56px',
          },
        }}
        collapsed={collapseMenu}
      />
    </WebSocketProvider>
  );
}
