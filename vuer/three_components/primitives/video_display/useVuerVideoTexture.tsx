import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Vector2, VideoTexture } from "three";

export type TexturePT = {
  start?: boolean;
  repeat?: [ number, number ];
  offset?: [ number, number ];
}

export function useVuerVideoTexture(video, { start = false, repeat, offset }: TexturePT = {}) {
  // const video = useVideo(src, props);
  const gl = useThree(state => state.gl);

  const texture = useMemo(() => {
    if (!video) return null;
    const texture = new VideoTexture(video);
    if ('colorSpace' in texture) texture.colorSpace = gl.outputColorSpace;
    else {
      // @ts-ignore encoding is not in the type definition.
      texture.encoding = gl.outputEncoding;
    }
    return texture
  }, [ video ]);


  useEffect(() => {
    if (!texture) return;
    if (repeat) texture.repeat = new Vector2(...repeat);
    if (offset) texture.offset = new Vector2(...offset);
  }, [ repeat, offset ])

  useEffect(() => {
    if (!texture) return;
    if (!start) return;
    texture.image.play();
    return () => texture.image.pause();
  }, [ texture, start ]);


  return texture;
}