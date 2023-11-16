import {useCallback, useContext} from "react";
import {useThree} from "@react-three/fiber";
import {button, useControls} from "leva";
import {SocketContext, SocketContextType} from "../_contexts/_websocket";
import {VuerProps} from "../../_interfaces";

export function Download({_key: key}: VuerProps) {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    const {gl} = useThree();
    const callback = useCallback(
        () => {
            const uri = gl.domElement.toDataURL('image/png');
            sendMsg({etype: "SNAPSHOT", key, value: {screen: uri}});
            const link = document.createElement('a')
            link.setAttribute('download', 'canvas.png')
            link.setAttribute(
                'href',
                uri.replace('image/png', 'image/octet-stream')
            )
            link.click()
        }, [sendMsg]
    )
    useControls({
        "Take Screenshot": button(callback, {disabled: false}),
    }, [])

    return null;
}