import { useEffect } from 'react';
import { suspend } from 'suspend-react';


export type useVideoProps = {
  src?: string | MediaStream;
  unsuspend?: string;
  crossOrigin?: string;
  muted?: boolean;
  loop?: boolean;
  start?: boolean;
  playsInline?: boolean;
}

export function useVideo(src, {
  unsuspend = 'loadedmetadata',
  crossOrigin = 'Anonymous',
  muted = true,
  loop = true,
  start = true,
  playsInline = true,
  ...rest
}: useVideoProps = {}): HTMLVideoElement {

  const video = suspend(() => new Promise((res, rej) => {
    if (!src) return res(null);
    const video = Object.assign(document.createElement('video'), {
      src: typeof src === 'string' && src || undefined,
      srcObject: src instanceof MediaStream && src || undefined,
      crossOrigin,
      loop,
      muted,
      playsInline,
      ...rest
    });
    video.addEventListener(unsuspend, () => res(video));
  }), [ src ]) as HTMLVideoElement;

  useEffect(() => {
    if (!video) return
    if (!start) return
    video.play();
    return () => video.pause();
  }, [ video ]);

  return video;
}

