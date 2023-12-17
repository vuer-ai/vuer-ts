import { useMemo } from 'react';
import queryString from 'query-string';
import { Grid as DreiGrid } from '@react-three/drei';
import { useControls } from 'leva';
import { useThree } from '@react-three/fiber';
import { document } from '../../lib/browser-monads';
import { Euler, Object3D, Quaternion, Vector3 } from "three";

interface GridQueries {
  grid?: string;
}

interface GridProps {
  far?: number;
  levaPrefix?: string;
}

export function Grid({ far = null, levaPrefix = 'Scene.' }: GridProps): JSX.Element {
  const q = useMemo<GridQueries>(
    () => queryString.parse(document.location.search),
    [],
  );
  const { camera } = useThree();

  const {
    showGrid, offset, fadeDistance, ...config
  } = useControls(
    `${levaPrefix}Grid Plane`,
    {
      showGrid: {
        value: q.grid ? q.grid.toLowerCase() === 'true' : true,
        label: 'Show Grid',
      },
      offset: 0,
      cellSize: 0.2,
      cellThickness: 0.6,
      cellColor: '#6f6f6f',
      sectionSize: 1.0,
      sectionThickness: 1.5,
      sectionColor: '#23aaff',
      fadeDistance: far || 10,
      fadeStrength: 1,
      followCamera: true,
      infiniteGrid: true,
    },
    { collapsed: true },
    [ far, camera.far ],
  );

  const quat = useMemo(() => {
    const upVector = new Vector3(0, 1, 0);

    // Compute the quaternion
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(upVector, Object3D.DEFAULT_UP);

    const euler = new Euler()
    euler.setFromQuaternion(quaternion, 'XYZ');

    return euler;
  }, [])

  return (
    <>
      {
        showGrid ?
          <DreiGrid
            position={Object3D.DEFAULT_UP.clone().multiplyScalar(offset)}
            rotation={quat}
            args={[ 10, 10 ]}
            fadeDistance={Math.min(camera.far || 5, fadeDistance)}
            {...config}
          />
          : null
      }
    </>
  );
};
