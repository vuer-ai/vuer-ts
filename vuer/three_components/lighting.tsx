import { MutableRefObject, useRef } from 'react';
import { useControls } from 'leva';
import { Sphere, useHelper } from '@react-three/drei';
import {
  AmbientLightProps as TALP,
  DirectionalLightProps as TDLP,
  SpotLightProps as TSLP,
} from '@react-three/fiber';
import {
  PointLight as TPL,
  SpotLight as TSL,
  DirectionalLight as TDL,
  AmbientLight as TAL,
  DirectionalLightHelper,
  PointLightHelper,
  SpotLightHelper,
} from "three";
import { VuerProps } from "../interfaces";

type LightProps<TLP> = VuerProps<{
  intensity?: number;
  hide?: boolean;
  levaPrefix?: string;
  helper?: boolean;
}, TLP>;

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
  }: LightProps<TDLP>,
) {
  const lightRef = useRef() as MutableRefObject<TDL>;

  let prefix = levaPrefix ? `${levaPrefix}Directional Light` : 'Directional Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  // @ts-ignore: leva is broken
  const controls = useControls(prefix, {
    useHelper: helper,
    intensity: { value: intensity, step: 0.05 },
    // @ts-ignore: leva is broken
    color,
    hide,
  }, [ helper, intensity, color, hide ]);

  // @ts-ignore: leva is broken
  useHelper(controls.useHelper as boolean ? lightRef : null, DirectionalLightHelper, 1, 'red');

  // @ts-ignore: leva is broken
  if (controls.hide) return null;
  // @ts-ignore: leva is broken
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
  }: LightProps<TALP>,
) {
  const lightRef = useRef() as MutableRefObject<TAL>;

  let prefix = levaPrefix ? `${levaPrefix}Ambient Light` : 'Ambient Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    prefix,
    // @ts-ignore: leva is broken
    {
      intensity: { value: intensity, step: 0.05 },
      // @ts-ignore: leva is broken
      color,
      hide,
    },
    { collapsed: true }, [ intensity, color, hide ]
  );

  // @ts-ignore: leva is broken
  if (controls.hide) return null;
  // @ts-ignore: leva is broken
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
  }: LightProps<TSLP>,
) {
  const lightRef = useRef() as MutableRefObject<TSL>;
  // @ts-ignore: todo: fix typing
  useHelper(helper ? lightRef : null, SpotLightHelper, 1, 'red');

  let prefix = levaPrefix ? `${levaPrefix}Spot Light` : 'Spot Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    // @ts-ignore: leva typing is broken
    prefix, {
      intensity: { value: intensity, step: 0.05 },
      // @ts-ignore: leva is broken
      color,
      hide,
    }, [ intensity, color, hide ]);

  // @ts-ignore: leva typing is broken
  if (controls.hide) return null;
  // @ts-ignore: todo: fix typing
  return <spotLight key={_key} ref={lightRef} {...controls} {...rest} />;
}

type PointLightProps = LightProps<{
  radius?: number;
} & Omit<TPL, "radius">>;

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
    showSphere = false,
    radius = 0.1,
    ...rest
  }: PointLightProps,
) {
  const lightRef = useRef() as MutableRefObject<TPL>;
  useHelper(helper ? lightRef : null, PointLightHelper, 1, 'red');

  let prefix = levaPrefix ? `${levaPrefix}Point Light` : 'Point Light'
  prefix = _key ? `${prefix}-[${_key}]` : prefix;

  const controls = useControls(
    // @ts-ignore: this is fine
    prefix, {
      intensity: { value: intensity, step: 0.05 },
      // @ts-ignore: leva is broken
      color,
      hide,
    }, [ intensity, color, hide ]);

  // @ts-ignore: this is fine
  if (controls.hide) return null;
  return (
    <group>
      <pointLight key={_key} ref={lightRef} {...controls} {...rest} />
      {showSphere
        ? <Sphere
          args={[ radius as number, 32, 32 ]}
          // @ts-ignore: todo: fix this.
          position={rest.position}
          // @ts-ignore: todo: fix this.
          emissive={color}
          emissiveIntensity={intensity}
        /> : null
      }
    </group>
  );
}
