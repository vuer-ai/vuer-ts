import React from "react";
import { HUDPlane, HUDPlaneProps } from "../../video_plane";
import { useVideo } from "./useVuerVideo";
import { useVuerVideoTexture } from "./useVuerVideoTexture";
import { useWebRTC } from "./useWebRTC";
import { VuerProps } from "../../../interfaces";


export type StereoPlaneProps = VuerProps<{
  src: string;
  iceServer?: RTCIceServer;
  rtcOptions?: RTCConfiguration;
  side?: number;
}> & HUDPlaneProps;

export const WebRTCStereoVideoPlane = ({
  src,
  // This is a public STUN server provided by Google.
  iceServer = { urls: 'stun:stun.l.google.com:19302' },
  side = 2,
  rtcOptions,
  ...props
}: StereoPlaneProps) => {

  const srcObj = useWebRTC(src, { iceServer, ...rtcOptions });

  const video = useVideo(srcObj)
  const leftTexture = useVuerVideoTexture(video, { repeat: [ 0.5, 1 ], offset: [ 0, 0 ] });
  const rightTexture = useVuerVideoTexture(video, { repeat: [ 0.5, 1 ], offset: [ 0.5, 0 ] });

  return <>
    <HUDPlane layers={1} {...props}>
      {leftTexture && <meshBasicMaterial map={leftTexture} toneMapped={false} side={2}/>}
    </HUDPlane>
    <HUDPlane layers={2} {...props}>
      {rightTexture && <meshBasicMaterial map={rightTexture} toneMapped={false} side={2}/>}
    </HUDPlane>
  </>
}

export const StereoVideoPlane = ({
  src,
  // This is a public STUN server provided by Google.
  iceServer = { urls: 'stun:stun.l.google.com:19302' },
  side = 2,
  rtcOptions,
  ...props
}: StereoPlaneProps) => {

  const video = useVideo(src)
  const leftTexture = useVuerVideoTexture(video, { repeat: [ 0.5, 1 ], offset: [ 0, 0 ] });
  const rightTexture = useVuerVideoTexture(video, { repeat: [ 0.5, 1 ], offset: [ 0.5, 0 ] });

  return <>
    <HUDPlane layers={1} {...props}>
      {leftTexture && <meshBasicMaterial map={leftTexture} toneMapped={false} side={2}/>}
    </HUDPlane>
    <HUDPlane layers={2} {...props}>
      {rightTexture && <meshBasicMaterial map={rightTexture} toneMapped={false} side={2}/>}
    </HUDPlane>
  </>
}
