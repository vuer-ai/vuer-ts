import { useCallback, useContext } from 'react';
import { useThree } from '@react-three/fiber';
import { button, useControls } from 'leva';
import { SocketContext, SocketContextType } from '../contexts/websocket.tsx';
import { VuerProps } from '../../interfaces.tsx';

export function Download({ _key: key }: VuerProps) {
  const { sendMsg } : SocketContextType = useContext(SocketContext);
  const { gl } = useThree();
  const callback = useCallback(() => {
    const uri = gl.domElement.toDataURL('image/png');
    sendMsg({ etype: 'SNAPSHOT', key, value: { screen: uri } });
    const link = document.createElement('a');
    link.setAttribute('download', 'canvas.png');
    link.setAttribute(
      'href',
      uri.replace('image/png', 'image/octet-stream'),
    );
    link.click();
  }, [ sendMsg ]);
  useControls({
    'Take Screenshot': button(callback, { disabled: false }),
  }, []);

  return null;
}
