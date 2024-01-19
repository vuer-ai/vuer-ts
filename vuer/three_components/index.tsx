import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import queryString from 'query-string';
import { button, folder, useControls } from 'leva';
import useFetch from 'use-http';
import yaml from 'js-yaml';
import useStateRef from 'react-usestateref';
import { document } from '../third_party/browser-monads';
import { Scene } from './scene';
import { Hydrate } from '../html_components';
import { list2menu } from './leva_helper';
import { addNode, findByKey, removeByKey, upsert } from '../util';
import { ServerEvent } from '../interfaces';
import { pack, unpack } from "msgpackr";
import { Buffer } from "buffer";
import { Grid } from "./grid";
import { ToneMapping } from "./ToneMapping";
import { SocketContext } from "../html_components/contexts/websocket";
import { AppContext } from "../index";

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
}

interface SceneType {
  children: Node[];
  htmlChildren: Node[];
  rawChildren: Node[];
  bgChildren: Node[];
}


export type SceneContainerP = PropsWithChildren<{
  up: [ number, number, number ];
  [key: string]: unknown;
}>;


const SceneAttrs = [
  'children', 'rawChildren', 'htmlChildren', 'bgChildren'
]

export default function SceneContainer({ children: _, ..._props }: SceneContainerP) {

  const queries = useMemo<QueryParams>(() =>
    queryString.parse(document.location.search) as QueryParams, []);

  const { response } = useFetch(queries.scene, []);

  const [ scene, setScene, sceneRef ] = useStateRef<SceneType>({
    children: [],
    htmlChildren: [],
    rawChildren: [],
    bgChildren: [],
  });

  const [ menu, setMenu ] = useState({});

  const { showError } = useContext(AppContext)
  const { downlink } = useContext(SocketContext);

  useEffect(() => {
    // do not change the scene using Fetch unless queries.scene is set.
    if (!queries.scene) return;

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


  useEffect(() => {
    const removeSet = downlink.subscribe("SET", ({ etype, data }: ServerEvent) => {
      // the top level is a dummy node
      if (data.tag !== "Scene") showError(`The top level node of the SET operation must be a <Scene/> object, got <${data.tag}/> instead.`)
      setScene(data as SceneType);
    })

    const removeAdd = downlink.subscribe("ADD", ({ etype, data }: ServerEvent) => {
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
    })
    const removeUpdate = downlink.subscribe("UPDATE", ({ etype, data }: ServerEvent) => {
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
    })
    const removeUpsert = downlink.subscribe("UPSERT", ({ etype, data }: ServerEvent) => {
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
    })
    const removeRemove = downlink.subscribe("REMOVE", ({ etype, data }: ServerEvent) => {
      const { keys } = data;
      let dirty;
      for (const key of keys) {
        const removed = removeByKey(sceneRef.current, key);
        dirty = dirty || (removed?.length > 0)
      }
      if (dirty) setScene({ ...sceneRef.current });
    })
    return () => {
      removeSet();
      removeAdd();
      removeUpdate()
      removeUpsert();
      removeRemove();
    }
  }, [])

  const {
    children: sceneChildren,
    htmlChildren: sceneHtmlChildren,
    rawChildren: sceneRawChildren,
    bgChildren: sceneBackgroundChildren,
    ..._scene
  } = scene;

  // very problematic
  const rest = {
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
    <Scene
      bgChildren={bgChildren}
      htmlChildren={htmlChildren}
      rawChildren={rawChildren}
      {...rest}
    >
      {children}
    </Scene>);
}
