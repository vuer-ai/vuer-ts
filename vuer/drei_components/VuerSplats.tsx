import { Splat } from "@react-three/drei";
import { Matrix16T, VuerProps } from "../interfaces";
import * as React from "react";
import { VuerGroup } from "../three_components/primitives/better_group";

// we repeat these definitions because drei/Splat does not export its props
type VuerSplatsProps = VuerProps<{
  src: string;
  matrix?: Matrix16T;
  /* Use the Three.js Convention and flip the coordinates. GSplats are [1, -1, -1] by default. */
  flipCoors?: boolean;
  toneMapped?: boolean;
  alphaTest?: number;
  alphaHash?: boolean;
  /* the chuncksize for loading */
  chunkSize?: number;
  // up?: [ number, number, number ];

}> & JSX.IntrinsicElements['mesh'];

/** We can not attach refs to the Splat component because it is a functional component.
 / So we wrap it in a VuerGroup component, and handle all position/rotation/scale/matrix
 / from there. */
export function VuerSplat({
  _ref,
  matrix,
  flipCoords = true,
  rotation,
  position,
  scale,
  ...rest
}: VuerSplatsProps): React.JSX.Element {
  return <VuerGroup
    ref={_ref}
    rotation={rotation}
    position={position}
    scale={scale}
    matrix={matrix}>
    {
      (!!flipCoords)
        ? <Splat rotation={[ Math.PI, 0, 0 ]}{...rest}/>
        : <Splat {...rest}/>
    }
  </VuerGroup>
}
