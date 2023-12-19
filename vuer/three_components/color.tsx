import { useContext, useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import queryString from 'query-string';
import { SocketContext } from "../html_components/contexts/websocket";

interface BackgroundColorProps {
  levaPrefix?: string;
  color?: string;
}

type BackgroundQueries = {
  background?: string;
  lightBg?: string;
  darkBg?: string;
}

const isDarkMode = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')

export function BackgroundColor({ levaPrefix = 'Scene', color = '#151822' }: BackgroundColorProps) {
  const queries = useMemo(() => queryString.parse(document.location.search), []) as BackgroundQueries;
  const bgColor = useMemo<string>((): string | undefined => {
    if (queries.background) {
      let dark, light = queries.background.split(',');
      if (queries.darkBg) dark = queries.darkBg;
      if (queries.lightBg) light = queries.lightBg;
      if (isDarkMode()) return `#${dark || light}`;
      return `#${light || dark}`;
    }
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

  return <color attach="background" args={[ background ]}/>;
}
