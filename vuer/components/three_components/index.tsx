import { PropsWithChildren } from 'react';
import ThreeScene from './scene';

type SceneProps = PropsWithChildren<{
  _key: string,
  [key: string]: unknown;
}>;

export function Scene({ _key, ...rest }: SceneProps) {
  return <ThreeScene {...rest} />;
}
