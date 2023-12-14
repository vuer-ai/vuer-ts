import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import queryString from 'query-string';
import { button, folder, Leva, useControls } from 'leva';
import useFetch from 'use-http';
import yaml from 'js-yaml';
import useStateRef from 'react-usestateref';
import { document } from './lib/browser-monads';
import ThreeScene from './components/three_components/scene.tsx';
import { Hydrate } from './components';
import { list2menu } from './components/three_components/leva_helper.tsx';
import { addNode, findByKey, removeByKey } from './util.tsx';
import { WebSocketProvider } from './components/contexts/websocket.tsx';
import { parseArray } from './components/three_components/utils.tsx';
import { Buffer } from "buffer";

import { ServerEvent } from './interfaces.tsx';
import { pack, unpack } from "msgpackr";

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
    const children = (data || [])
      .map(({ key, ...child }: Node) => <Hydrate key={key} _key={key} {...props} {...child} />);
    return { children };
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
  backgroundChildren: Node[];
}

// const { showError } = useContext(AppContext);
// showError("The scene content likely contain large amount of data. Please use ")

type VuerRootProps = PropsWithChildren<{
  style?;
}>;

const AppContext = createContext({
  showError: (msg: string) => {
    console.error(msg);
  },
  showModal: (msg: string) => {
    console.log(msg);
  }
});

export const AppProvider = AppContext.Provider;

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

  // // for server-side rendering
  // if (typeof window === "undefined") return <div>threejs view server-side rendering</div>;

  const [ scene, setScene, sceneRef ] = useStateRef<SceneType>({
    children: [],
    htmlChildren: [],
    rawChildren: [],
    backgroundChildren: [],
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
    } else {
      _scene = { children: [] };
    }
    if (typeof _scene.children === 'undefined') _scene = { children: _scene };
    setScene(_scene);
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
        if (sceneStr.length > 5000) {
          return showError("The scene likely contains a large amount of data. To share, please replace geometry data with an URI.");
        }
        const chars = String.fromCharCode.apply(null, sceneStr)
        const scene64b = btoa(chars);
        const url = new URL(document.location.href);
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
        setScene(data as SceneType);
      } else if (etype === 'ADD') {
        // the API need to be updated, so are the rest of the API.
        const { nodes, to: parentKey } = data;
        let dirty;
        console.log('before adding', scene.children);
        for (const node of nodes) {
          dirty = dirty || addNode(sceneRef.current, node, parentKey);
        }
        console.log('is dirty?', dirty, scene.children);
        if (dirty) setScene({ ...sceneRef.current });
      } else if (etype === 'UPDATE') {
        let dirty = false;
        const { nodes } = data;
        for (const { key, ...props } of nodes) {
          const node = findByKey(sceneRef.current, key, [
            'rawChildren',
            'htmlChildren',
            'backgroundChildren',
          ]);
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
      } else if (etype === 'REMOVE') {
        const { keys } = data;
        let dirty;
        console.log('before adding', scene.children);
        for (const key of keys) {
          dirty = dirty || removeByKey(sceneRef.current, key);
        }
        console.log('is dirty?', dirty, scene.children);
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
    backgroundChildren: sceneBackgroundChildren,
    ..._scene
  } = scene;

  const rest = {
    initCameraPosition: queries.initCameraPosition,
    ..._props,
    // add the scene params here to allow programmatic override
    ..._scene,
  };

  const toProps = useCallback(makeProps(), []);

  const children = sceneChildren ? toProps(sceneChildren).children : [];
  const rawChildren = sceneRawChildren
    ? toProps(sceneRawChildren).children
    : [];
  const htmlChildren = sceneHtmlChildren
    ? toProps(sceneHtmlChildren).children
    : [];
  const backgroundChildren = sceneBackgroundChildren
    ? toProps(sceneBackgroundChildren).children
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

  return (
    // <div style={{ overflow: "hidden" }}>
    <WebSocketProvider onMessage={onMessage}>
      <ThreeScene
        backgroundChildren={backgroundChildren}
        style={sceneStyle}
        rawChildren={rawChildren}
        htmlChildren={htmlChildren}
        {...rest}
      >
        {children}
      </ThreeScene>
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
    // </div>
  );
}
