import {PropsWithChildren, useContext, useEffect, useMemo} from "react";
import {useControls} from "leva";
import {SocketContext, SocketContextType} from "../_contexts/_websocket";
import queryString, {ParsedQuery} from "query-string";
import {document} from "../../_lib/_browser-monads";
import {SceneStoreType, useSceneStore} from "../../_store";
import {Euler, Vector3} from "@react-three/fiber";


import {ClientEvent} from "../../_interfaces";
import {Sim3, SO3, V3} from "./_number_types";

export function deg2rad(rotation: SO3): SO3 {
    return {
        x: (rotation.x * Math.PI) / 180,
        y: (rotation.y * Math.PI) / 180,
        z: (rotation.z * Math.PI) / 180,
        order: rotation.order || "XYZ",
    } as SO3;
}

export const v3array = ({x, y, z}: V3): [number, number, number] => [x, y, z];
export const euler2array = ({x, y, z, order = undefined}: SO3): Euler => {
    if (typeof order === "undefined") return [x, y, z] as Euler;
    return [x, y, z, order] as Euler;
}
export const rot2array = (rotation: SO3): Euler => euler2array(deg2rad(rotation));

export const scale2array = (scale: number | [number, number, number] | V3): Vector3 => {
    if (typeof scale === "number") return [scale, scale, scale] as Vector3;
    return v3array(scale as V3) as Vector3;
}

type SceneGroupProps = PropsWithChildren<{
    levaPrefix?: string;
    position?: V3;
    rotation?: V3;
    scale?: number;
}>;

type Sim3Queries = {
    rotation?: string;
    position?: string;
    scale?: string;
}

export const SceneGroup = (
    {
        // sendMsg,
        levaPrefix = "Scene",
        position: paramPosition,
        rotation: paramRotation,
        scale: paramScale,
        children,
    }: SceneGroupProps
) => {
    const {uplink} = useContext(SocketContext) as SocketContextType;
    const sceneStore = useSceneStore();
    const queries = useMemo<Sim3>((): Sim3 => {
        const q: ParsedQuery & Sim3Queries = queryString.parse(document.location.search)

        let rotation;
        let position;
        let scale;

        if (q.rotation) {
            // @ts-ignore: okay for now
            const [x, y, z] = q.rotation.split(",").filter((u) => u && u === u).map(parseFloat);
            rotation = {x, y, z};
        }
        if (q.position) {
            // @ts-ignore: okay for now
            const [x, y, z] = q.position.split(",").filter((u) => u && u === u).map(parseFloat);
            position = {x, y, z};
        }
        if (q.scale) {
            scale = parseFloat(q.scale as string);
        }

        return {rotation, position, scale} as Sim3;
    }, []);

    const {position, rotation, scale} = useControls(
        levaPrefix,
        {
            rotation: {
                value: paramRotation || queries.rotation || {x: 0, y: 0, z: 0},
                order: 1,
                // lock: true,
            },
            position: {
                value: paramPosition || queries.position || {x: 0, y: 0, z: 0},
                order: -1,
                lock: true,
            },
            scale: {
                value: paramScale || queries.scale || 1,
                min: 0.0001,
                step: 0.01,
                label: "Scale",
                order: 2,
                pad: 4,
            },
        },
        {collapsed: true}
    );

    // here we register a reducer for "CAMERA_MOVE" events. This will trigger
    // a camera update event in the _camera.js component.
    useEffect(() => {
        // emit the event in a timeout, so it happens after the addReducer synchronous call.
        setTimeout(() => uplink?.publish({etype: "CAMERA_UPDATE"}), 0);

        // update the scene store.
        sceneStore.update({position, rotation, scale} as SceneStoreType);

        return uplink.addReducer("CAMERA_MOVE", (event: ClientEvent): ClientEvent => {
            return {
                ...event,
                value: {
                    ...event.value,
                    world: {
                        ...event.value?.world,
                        position,
                        rotation, //: deg2rad(rotation),
                        scale,
                    },
                },
            } as ClientEvent;
        });
    }, [uplink, position, rotation, scale]);
    return (
        <group
            position={v3array(position) as Vector3 || [0, 0, 0]}
            rotation={rot2array(rotation) || [0, 0, 0]}
            scale={scale2array(scale || 1.0)}
        >
            {children}
        </group>
    );
};
export const GroupSlave = ({children,}: PropsWithChildren) => {
    const {position, rotation, scale} = useSceneStore() as Sim3;
    return (
        <group
            position={v3array(position) as Vector3 || [0, 0, 0]}
            rotation={rot2array(rotation) || [0, 0, 0]}
            scale={scale2array(scale || 1.0)}
        >
            {children}
        </group>
    );
};
