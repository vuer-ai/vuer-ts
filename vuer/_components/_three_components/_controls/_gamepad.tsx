import {useContext} from "react";
import {useGamepads} from "react-gamepads";
import {SocketContext, SocketContextType} from "../../_contexts/_websocket";
import {VuerProps} from "../../../_interfaces.tsx";

export const Gamepad = ({_key: key, children}: VuerProps) => {
    const {sendMsg} = useContext(SocketContext) as SocketContextType;
    useGamepads((gamepads) => {
        const {axes, buttons} = gamepads[0] as Gamepad;
        sendMsg({
            etype: "GAMEPADS",
            key,
            value: {axes, buttons: buttons.map((b) => b.value)},
        });
    });
    return <>{children}</>;
};
