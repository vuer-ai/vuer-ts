import { MutableRefObject, useRef } from 'react';
import { useControls } from 'leva';
import { Sphere, useHelper } from '@react-three/drei';
import {
  AmbientLight as TAL,
  Color,
  DirectionalLight as TDL,
  DirectionalLightHelper,
  PointLight as TPL,
  PointLightHelper,
  SpotLight as TSL,
  SpotLightHelper,
} from 'three';
import { PointLightProps } from '@react-three/fiber';
import { VuerProps } from '../../interfaces';

type LightProps<TL> = VuerProps<{
  color: Color | undefined;
  intensity: number;
  hide: boolean;
  levaPrefix: string;
  helper: boolean;
}, TL>;

export function DirectionalLight(
  {
    _key,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children,
    hide = false,
    intensity = 0.5,
    color = '#ffffff',
    levaPrefix = 'Scene.',
    helper = false,
    ...rest
  }: LightProps<TDL>,
) {
  const lightRef = useRef() as MutableRefObject<TDL>;

  let prefix = levaPrefix ? `${levaPrefix}Directional Light` : 'Directional Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  // @ts-ignore: todo: fix typing
  const controls = useControls(prefix, {
    useHelper: helper,
    intensity: { value: intensity, step: 0.005 },
    color,
    hide,
  }, [ helper ]);

  useHelper(controls.useHelper ? lightRef : null, DirectionalLightHelper, 1, 'red');

  if (controls.hide) return null;
  return <directionalLight key={_key} ref={lightRef} {...controls} {...rest} />;
}

export function AmbientLight(
  {
    _key,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children,
    hide = false,
    intensity = 0.5,
    color = '#ffffff',
    levaPrefix = 'Scene.',

    ...rest
  }: LightProps<TAL>,
) {
  const lightRef = useRef() as MutableRefObject<TAL>;

  let prefix = levaPrefix ? `${levaPrefix}Ambient Light` : 'Ambient Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    prefix,
    {
      intensity: { value: intensity, step: 0.005 },
      color,
      hide,
    },
    { collapsed: true },
  );

  if (controls.hide) return null;
  return <ambientLight key={_key} ref={lightRef} {...controls} {...rest} />;
}

export function SpotLight(
  {
    _key,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children,
    hide = false,
    intensity = 0.5,
    color = '#ffffff',
    levaPrefix = 'Scene.',
    helper = false,
    ...rest
  }: LightProps<TSL>,
) {
  const lightRef = useRef() as MutableRefObject<TSL>;
  // @ts-ignore: todo: fix typing
  useHelper(helper ? lightRef : null, SpotLightHelper, 1, 'red');

  let prefix = levaPrefix ? `${levaPrefix}Spot Light` : 'Spot Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    prefix, {
      intensity: { value: intensity, step: 0.005 },
      color,
      hide,
    });

  if (controls.hide) return null;
  return <spotLight key={_key} ref={lightRef} {...controls} {...rest} />;
}

export function PointLight(
  {
    _key,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children,
    hide = false,
    intensity = 20,
    color = '#ffffff',
    levaPrefix = 'Scene.',
    helper = false,
    ...rest
  }: LightProps<TPL> & PointLightProps,
) {
  const lightRef = useRef() as MutableRefObject<TPL>;
  useHelper(helper ? lightRef : null, PointLightHelper, 1, 'red');

  let prefix = levaPrefix ? `${levaPrefix}Point Light` : 'Point Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    prefix, {
      intensity: { value: intensity, step: 0.005 },
      color,
      hide,
    });

  if (controls.hide) return null;
  return (
    <group>
      <pointLight key={_key} ref={lightRef} {...controls} {...rest} />
      <Sphere
        args={[ 0.1, 32, 32 ]}
        position={rest.position}
        // @ts-ignore: todo: fix this.
        emissive={color || 'white'}
        emissiveIntensity={intensity}
      />
    </group>
  );
}
