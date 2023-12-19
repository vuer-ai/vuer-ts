import { Hands as BareHands } from '@react-three/xr';

// @ts-ignore: ignore for now. Under heavy development.
export function Hands({ _key: key, children, ...rest }) {
  // const {sendMsg} = useContext(SocketContext) as SocketContextType;
  // const onChange = useCallback((gamepads: XRInteractionEvent) => {
  //     // const {axes, buttons, connected, id, index, mapping, timestamp} =
  //     //     gamepads[0];
  //     // sendMsg({
  //     //     etype: "HANDS",
  //     //     key,
  //     //     value: {axes, buttons: buttons.map((b:) => b.value)},
  //     // });
  // }, [sendMsg]);
  // you can add custom GLB models to the hands
  return <BareHands key={key} {...rest} />;
}
