import { ForwardedRef, forwardRef, MutableRefObject, ReactNode, useMemo, useRef } from 'react';
import { Interactive, XRController, XRInteractionEvent } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';

import { Group, Matrix4 } from 'three';
import { VuerProps } from '../../../_interfaces';

type SqueezeRayGrabProps = VuerProps<{
  onSqueezeStart?: (e?: XRInteractionEvent) => void;
  onSqueezeEnd?: (e?: XRInteractionEvent) => void;
  onSelect?: (e?: XRInteractionEvent) => void;
  bigChildren?: ReactNode | ReactNode[];
  [key: string];
}, Group>;

export const SqueezeRayGrab = forwardRef((
  {
    onSqueezeStart,
    onSqueezeEnd,
    onSelect,
    children,
    bigChildren,
    ...rest
  }: SqueezeRayGrabProps,
  forwardedRef: ForwardedRef<Group>,
) => {
  const ref = useRef<Group>();
  const groupRef = (forwardedRef || ref) as MutableRefObject<Group>;
  const grabbingController = useRef() as MutableRefObject<XRController | null>;

  const previousTransform = useMemo(() => new Matrix4(), []);

  useFrame(() => {
    const controller = grabbingController.current;
    if (!groupRef.current || !controller) return null;
    const group = groupRef.current;

    group.applyMatrix4(previousTransform);
    group.applyMatrix4(controller.matrixWorld);
    group.updateMatrixWorld();

    previousTransform.copy(controller.matrixWorld).invert();
  });

  return (
        <group ref={groupRef}>
            {bigChildren}
            <Interactive
                onSqueezeStart={(e: XRInteractionEvent) => {
                  // @ts-expect-error: not sure how to fix this
                  grabbingController.current = e.target.controller;
                  previousTransform.copy(e.target.controller.matrixWorld).invert();
                  onSqueezeStart?.(e);
                }}
                onSqueezeEnd={(e: XRInteractionEvent) => {
                  // @ts-expect-error: not sure how to fix this
                  if (e.target.controller === grabbingController.current) {
                    grabbingController.current = null;
                  }
                  onSqueezeEnd?.(e);
                }}
                {...rest}
                onSelect={(e) => {
                  onSelect?.(e);
                }}
            >
                {children}
            </Interactive>
        </group>
  );
});