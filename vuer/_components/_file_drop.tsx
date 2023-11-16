// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck: todo fix this file
import {useEffect, useState} from "react";
import {useControls} from "leva";
import {pluginFile} from "../_lib/_leva-file-picker";
import {Glb, Obj, Pcd, Ply, Urdf} from "./_three_components/_data_loaders";



export function FileDrop() {
    const [buffer, setBuffer] = useState(null);
    const {File: file} = useControls("Upload", {
        File: pluginFile(),
    });

    useEffect(() => {
        if (!file) return;
        (async () => {
            // @ts-ignore: don't have time to look at the types now.
            const buff = await file.arrayBuffer();
            setBuffer(buff);
        })();
    }, [file]);

    if (!file) return <mesh/>;
    if (file.path.endsWith(".ply")) {
        return <Ply buff={buffer}/>;
    } else if (file.path.endsWith(".pcb")) {
        return <Pcd buff={buffer}/>;
    } else if (file.path.endsWith(".obj")) {
        return <Obj buff={buffer}/>;
    } else if (file.path.endsWith(".glb")) {
        return <Glb buff={buffer}/>;
    } else if (file.path.endsWith(".urdf")) {
        return <Urdf buff={buffer}/>;
    } else {
        return <mesh/>;
    }
}
