import { useContext, useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import queryString from 'query-string';
import { SocketContext, SocketContextType } from '../contexts/websocket';

interface BackgroundColorProps {
  levaPrefix?: string;
  color?: string;
}
export function BackgroundColor({ levaPrefix = 'Scene', color = '#151822' }: BackgroundColorProps) {
  const queries = useMemo(() => queryString.parse(document.location.search), []);
  const bgColor = useMemo<string>((): string | undefined => {
    if (queries.background) return `#${queries.background}`;
    if (color) return color;
  }, [ color ]);
  const { background } = useControls(
    levaPrefix,
    {
      background: {
        value: bgColor,
        label: 'Background Color',
      },
    },
    { collapsed: true },
    [ color ],
  );
  const { uplink } = useContext(SocketContext);
  useEffect(
    () => uplink.addReducer('CAMERA_MOVE', (event) =>
    // console.log("CAMERA_MOVE-reducer-once", event);
      ({
        ...event,
        value: {
          ...event.value,
          world: { ...event.value?.world, background },
        },
      })),
    [ uplink, background ],
  );

  return <color attach="background" args={[ background ]} />;
}
