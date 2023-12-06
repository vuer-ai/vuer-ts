import { LumaSplatsThree } from "@lumaai/luma-web/dist/@types/library/LumaSplatsThree";
import { extend, Object3DNode } from '@react-three/fiber';

// For typeScript support:
declare module '@react-three/fiber' {
  interface ThreeElements {
    lumaSplats: Object3DNode<LumaSplatsThree, typeof LumaSplatsThree>
  }
}

const SEMANTICS_LAYERS = {
  all: 255,
  foregrounds: 2,
  backgrounds: 1,
}

async function register() {
  const isSSR = typeof window === "undefined";
  if (isSSR) return;
  const { LumaSplatsThree } = await import ("@lumaai/luma-web");

  // Make LumaSplatsThree available to R3F
  extend({ LumaSplats: LumaSplatsThree });
}


register();

export type SplatsProps = {
  src: string;
  semantics: string;
  [key: string]: unknown;
}

export function Splats({ src, semantics = "all", ...props }: SplatsProps) {

  return <lumaSplats
    semanticsMask={SEMANTICS_LAYERS[semantics]}
    source={src}
    {...props}
  />
}